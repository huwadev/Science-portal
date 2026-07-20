<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use App\Services\TotpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class AdminAuthController extends Controller
{
    /**
     * Admin login step 1: Google OAuth + Domain Restriction + 2FA Secret Check.
     */
    public function login(Request $request)
    {
        $request->validate([
            'access_token' => 'required|string',
        ]);

        $googleToken = $request->input('access_token');

        try {
            // Verify access token with Google
            $response = Http::get('https://www.googleapis.com/oauth2/v3/userinfo', [
                'access_token' => $googleToken,
            ]);

            if ($response->failed()) {
                AuditLogger::log('auth.login_failed', [
                    'reason' => 'Invalid Google access token',
                    'email' => 'unknown'
                ]);
                return response()->json(['message' => 'Invalid Google access token'], 401);
            }

            $googleUser = $response->json();
            $email = $googleUser['email'] ?? 'unknown';
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to connect to Google API: ' . $e->getMessage()], 500);
        }

        // Validate email domain (must end with @ethiosss.org or @community.ethiosss.org)
        $allowedDomains = ['ethiosss.org', 'community.ethiosss.org'];
        $emailParts = explode('@', $email);
        $domain = end($emailParts);

        $isAllowedDomain = in_array($domain, $allowedDomains);
        if (config('app.env') === 'local' && $domain === 'example.com') {
            $isAllowedDomain = true;
        }

        if (!$isAllowedDomain) {
            AuditLogger::log('auth.login_failed', [
                'reason' => 'Unauthorized email domain',
                'email' => $email
            ]);
            return response()->json(['message' => 'Unauthorized email domain'], 403);
        }

        // Enforce account pre-registration by superadmin
        // Note: Default root account is seeded, others must exist
        $isSeed = ($email === 'science@ethiosss.org');
        
        $user = User::where('email', $email)->first();
        if (!$user && !$isSeed) {
            AuditLogger::log('auth.login_failed', [
                'reason' => 'Admin account not pre-registered',
                'email' => $email
            ]);
            return response()->json(['message' => 'Unauthorized - Admin account not registered by Superadmin'], 403);
        }

        if (!$user) {
            $user = new User();
            $user->email = $email;
        }

        // Setup role & permissions for superadmin / seed accounts
        if ($email === 'science@ethiosss.org') {
            $user->role = 'superadmin';
            $user->permissions = ['dashboard', 'modules', 'users', 'logs'];
        } else {
            if (!$user->exists) {
                $user->role = 'admin';
            }
            if (empty($user->permissions)) {
                $user->permissions = ['dashboard', 'modules'];
            }
        }

        $user->name = $googleUser['name'] ?? 'Administrator';
        $user->google_id = $googleUser['sub'];
        $user->avatar = $googleUser['picture'] ?? null;
        $user->is_active = true;
        $user->save();

        // Generate temporary 2FA token (valid for 5 minutes)
        $tempToken = Str::random(40);
        Cache::put('admin_2fa_temp_' . $tempToken, $user->id, 300);

        if ($user->google2fa_enabled) {
            AuditLogger::log('auth.login_step1_success', [
                'email' => $email,
                'message' => 'First factor (Google) verified. 2FA verification required.',
            ]);

            return response()->json([
                'two_factor_required' => true,
                'temp_token' => $tempToken,
                'email' => $email,
            ]);
        }

        // If 2FA not enabled, generate secret and return QR code for setup
        if (!$user->google2fa_secret) {
            $user->google2fa_secret = TotpService::generateSecret();
            $user->save();
        }

        $qrCodeUrl = TotpService::getQrCodeUrl($email, $user->google2fa_secret);

        AuditLogger::log('auth.login_step1_success', [
            'email' => $email,
            'message' => 'First factor (Google) verified. 2FA setup required.',
        ]);

        return response()->json([
            'two_factor_setup_required' => true,
            'temp_token' => $tempToken,
            'secret' => $user->google2fa_secret,
            'qr_code_url' => $qrCodeUrl,
            'email' => $email,
        ]);
    }

    /**
     * Admin login step 2: Verify TOTP 2FA code and issue bearer token.
     */
    public function verify2fa(Request $request)
    {
        $request->validate([
            'temp_token' => 'required|string',
            'code' => 'required|string|size:6',
        ]);

        $tempToken = $request->input('temp_token');
        $code = $request->input('code');

        $userId = Cache::get('admin_2fa_temp_' . $tempToken);

        if (!$userId) {
            return response()->json(['message' => 'Login session expired or invalid. Please try signing in again.'], 401);
        }

        $user = User::find($userId);

        if (!$user || !$user->google2fa_secret) {
            return response()->json(['message' => 'User not found or 2FA not configured.'], 401);
        }

        // Check for active lockout
        if ($user->locked_until && $user->locked_until > time()) {
            $minutesLeft = (int) ceil(($user->locked_until - time()) / 60);
            AuditLogger::log('auth.2fa_locked', [
                'email' => $user->email,
                'minutes_remaining' => $minutesLeft,
            ]);
            return response()->json([
                'message' => "Account temporarily locked due to too many failed attempts. Try again in {$minutesLeft} minute(s).",
            ], 429);
        }

        // Verify authenticator code
        if (!TotpService::verifyCode($user->google2fa_secret, $code)) {
            $user->failed_attempts = ($user->failed_attempts ?? 0) + 1;

            if ($user->failed_attempts >= 3) {
                $user->locked_until = time() + 900; // 15 minutes lockout
                Cache::forget('admin_2fa_temp_' . $tempToken); // invalidate temp token
            }

            $user->save();

            AuditLogger::log('auth.2fa_failed', [
                'email' => $user->email,
                'reason' => 'Invalid authenticator code',
                'attempts' => $user->failed_attempts,
            ]);
            return response()->json(['message' => 'Invalid Authenticator code. Please try again.'], 422);
        }

        // Success: Reset failed attempts & activate 2FA flag if setting up
        $user->failed_attempts = 0;
        $user->locked_until = null;
        $user->google2fa_enabled = true;

        // Generate final stateful session token (bearer)
        $plainToken = Str::random(60);
        $user->api_token = hash('sha256', $plainToken);
        $user->save();

        Cache::forget('admin_2fa_temp_' . $tempToken);

        AuditLogger::log('auth.2fa_success', [
            'email' => $user->email,
            'role' => $user->role,
        ]);

        return response()->json([
            'token' => $plainToken,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $user->role,
                'permissions' => $user->permissions ?? [],
            ]
        ]);
    }
}

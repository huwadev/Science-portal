<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Module;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Authenticate a standard user via Google ID Token.
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'id_token' => 'required|string',
        ]);

        $idToken = $request->input('id_token');

        try {
            // Verify Google Token securely using Google's public tokeninfo endpoint
            $response = Http::get('https://oauth2.googleapis.com/tokeninfo', [
                'id_token' => $idToken,
            ]);

            if ($response->failed()) {
                AuditLogger::log('auth.user_login_failed', [
                    'reason' => 'Invalid Google token verification response',
                ]);
                return response()->json(['message' => 'Invalid Google token'], 401);
            }

            $googleData = $response->json();

            // Validate essential claims
            if (empty($googleData['sub']) || empty($googleData['email'])) {
                return response()->json(['message' => 'Invalid token payload'], 401);
            }

            // Verify email verified claim
            $emailVerified = $googleData['email_verified'] ?? false;
            if (!filter_var($emailVerified, FILTER_VALIDATE_BOOLEAN)) {
                return response()->json(['message' => 'Google email not verified'], 401);
            }

            $email = strtolower($googleData['email']);
            $googleId = $googleData['sub'];
            $name = $googleData['name'] ?? $email;
            $avatar = $googleData['picture'] ?? null;

            // Provision User in MongoDB
            $user = User::where('email', $email)->first();

            if ($user) {
                // Link Google account details
                $user->google_id = $googleId;
                $user->avatar = $user->avatar ?: $avatar;
                $user->save();
            } else {
                // Create brand new basic user
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'role' => 'basic', // default role
                    'is_active' => true,
                ]);
            }

            if (!$user->is_active) {
                AuditLogger::log('auth.user_login_failed', [
                    'reason' => 'Account deactivated',
                    'email' => $email,
                ]);
                return response()->json(['message' => 'Your account has been deactivated.'], 403);
            }

            // Generate stateful session token (bearer)
            $plainToken = Str::random(60);
            $user->api_token = hash('sha256', $plainToken);
            $user->save();

            AuditLogger::log('auth.user_login_success', [
                'email' => $email,
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
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('User Google Auth Error', ['exception' => $e]);
            return response()->json([
                'message' => 'Authentication failed',
                'error' => 'An error occurred during login. Please try again.'
            ], 500);
        }
    }

    /**
     * Log out current user session.
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->api_token = null;
            $user->save();
            AuditLogger::log('auth.logout', [
                'email' => $user->email,
            ]);
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get current user profile details.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        return response()->json([
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

    /**
     * Check if the authenticated user has access to a specific module.
     */
    public function sessionCheck(Request $request)
    {
        $request->validate([
            'slug' => 'required|string',
        ]);

        $slug = $request->input('slug');
        $user = $request->user();

        $module = Module::where('slug', $slug)->first();

        if (!$module) {
            return response()->json(['allowed' => false, 'message' => 'Module not found'], 404);
        }

        // Public modules are open to everyone
        if (!$module->is_restricted) {
            // Track launch count
            $module->increment('launch_count');
            return response()->json(['allowed' => true]);
        }

        // Restricted modules require logged-in status (at least basic role)
        if ($user) {
            // Track launch count
            $module->increment('launch_count');
            AuditLogger::log('module.launch', [
                'email' => $user->email,
                'module' => $slug,
            ]);
            return response()->json(['allowed' => true]);
        }

        return response()->json(['allowed' => false, 'message' => 'Authentication required'], 401);
    }
}

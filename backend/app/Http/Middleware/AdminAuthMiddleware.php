<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use App\Services\AuditLogger;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (!$token) {
            AuditLogger::log('auth.unauthorized_attempt', [
                'reason' => 'No token provided',
                'url' => $request->fullUrl(),
            ]);
            return response()->json(['message' => 'Unauthorized - No token provided'], 401);
        }

        // Token is stored hashed inside the database
        $user = User::where('api_token', hash('sha256', $token))->first();

        if (!$user) {
            AuditLogger::log('auth.unauthorized_attempt', [
                'reason' => 'Invalid or expired token',
                'token_snippet' => substr($token, 0, 8) . '...',
                'url' => $request->fullUrl(),
            ]);
            return response()->json(['message' => 'Unauthorized - Invalid token'], 401);
        }

        // Verify active state
        if (!$user->is_active) {
            return response()->json(['message' => 'Forbidden - Account deactivated'], 403);
        }

        // Set the user in the request
        $request->setUserResolver(function () use ($user) {
            return $user;
        });

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\AuditLogger;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Superadmins bypass all permission restrictions
        if ($user->role === 'superadmin') {
            return $next($request);
        }

        // Validate granular user permissions
        $userPermissions = $user->permissions ?? [];
        $requiredPermissions = [];
        foreach ($permissions as $perm) {
            $requiredPermissions = array_merge($requiredPermissions, explode(',', $perm));
        }

        $hasPermission = false;
        foreach ($requiredPermissions as $p) {
            if (in_array(trim($p), $userPermissions)) {
                $hasPermission = true;
                break;
            }
        }

        if (!$hasPermission) {
            AuditLogger::log('auth.unauthorized_attempt', [
                'reason' => 'Permission access denied',
                'user_email' => $user->email,
                'user_role' => $user->role,
                'required_permissions' => $requiredPermissions,
                'url' => $request->fullUrl(),
            ]);
            return response()->json(['message' => 'Forbidden - Insufficient permissions'], 403);
        }

        return $next($request);
    }
}

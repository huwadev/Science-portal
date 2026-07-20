<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class AuditLogger
{
    /**
     * Log an administrative, user, or security event.
     *
     * @param string $event
     * @param array $metadata
     * @return \App\Models\AuditLog|null
     */
    public static function log(string $event, array $metadata = [])
    {
        try {
            $request = request();
            $user = $request ? $request->user() : null;
            $email = $user ? $user->email : 'anonymous';

            // Special fallback for auth endpoint before setUserResolver runs
            if ($email === 'anonymous' && isset($metadata['email'])) {
                $email = $metadata['email'];
                unset($metadata['email']);
            }

            $ip = $request ? $request->ip() : '127.0.0.1';
            $userAgent = $request ? $request->header('User-Agent') : 'unknown';

            return AuditLog::create([
                'event' => $event,
                'email' => $email,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'metadata' => $metadata,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create audit log entry: ' . $e->getMessage());
            return null;
        }
    }
}

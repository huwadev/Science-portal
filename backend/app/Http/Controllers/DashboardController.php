<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Module;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Retrieve statistics summary for the admin dashboard.
     */
    public function stats(Request $request)
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        
        $totalModules = Module::count();
        $activeModulesCount = Module::where('status', 'build')->count();
        
        $modulesList = Module::all();
        $totalLaunches = $modulesList->sum('launch_count');

        // Formulate launches datasets
        $moduleLaunches = $modulesList->map(function ($mod) {
            return [
                'slug' => $mod->slug,
                'title' => $mod->title,
                'launch_count' => $mod->launch_count ?? 0,
            ];
        });

        // Fetch recent launch logs (last 10 entries)
        $recentLaunches = AuditLog::where('event', 'module.launch')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Calculate basic security incidents (auth failures, unauthorized attempts)
        $securityIncidentsCount = AuditLog::whereIn('event', [
            'auth.login_failed', 'auth.2fa_failed', 'auth.unauthorized_attempt'
        ])->count();

        // Formulate visitor traffic analytics (last 7 days pageviews based on audit logs)
        $traffic = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $startOfDay = date('Y-m-d 00:00:00', strtotime("-$i days"));
            $endOfDay = date('Y-m-d 23:59:59', strtotime("-$i days"));
            
            $viewsCount = AuditLog::whereBetween('created_at', [$startOfDay, $endOfDay])->count();
            
            // Uniques count (based on ip address)
            $uniquesCount = AuditLog::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->distinct('ip_address')
                ->count();

            $traffic[] = [
                'date' => date('M d', strtotime("-$i days")),
                'pageviews' => max($viewsCount, 2), // small mock base if empty
                'uniques' => max($uniquesCount, 1),
            ];
        }

        return response()->json([
            'metrics' => [
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'total_modules' => $totalModules,
                'active_modules' => $activeModulesCount,
                'total_launches' => $totalLaunches,
                'security_incidents' => $securityIncidentsCount,
            ],
            'module_launches' => $moduleLaunches,
            'recent_launches' => $recentLaunches,
            'analytics' => [
                'traffic' => $traffic
            ]
        ]);
    }
}

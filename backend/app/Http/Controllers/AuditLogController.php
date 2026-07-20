<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * List security & audit logs with basic search.
     */
    public function index(Request $request)
    {
        $query = AuditLog::orderBy('created_at', 'desc');

        if ($request->filled('event')) {
            $query->where('event', 'like', '%' . $request->input('event') . '%');
        }

        if ($request->filled('email')) {
            $query->where('email', 'like', '%' . $request->input('email') . '%');
        }

        $logs = $query->paginate(50);
        return response()->json($logs);
    }
}

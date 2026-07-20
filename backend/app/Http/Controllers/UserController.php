<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * List all registered portal users (Admin only).
     */
    public function index(Request $request)
    {
        $users = User::orderBy('created_at', 'desc')->get();
        return response()->json($users);
    }

    /**
     * Update user details, role or toggle active state (Admin only).
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'role' => 'sometimes|required|in:admin,member,basic',
            'is_active' => 'sometimes|required|boolean',
            'permissions' => 'sometimes|array',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Prevent modification of Superadmin accounts by other admins
        if ($user->role === 'superadmin' && $request->user()->role !== 'superadmin') {
            return response()->json(['message' => 'Unauthorized to modify superadmin accounts'], 403);
        }

        $user->update($request->only(['role', 'is_active', 'permissions']));

        AuditLogger::log('user.update', [
            'target_email' => $user->email,
            'changes' => $request->only(['role', 'is_active', 'permissions']),
        ]);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user
        ]);
    }
}

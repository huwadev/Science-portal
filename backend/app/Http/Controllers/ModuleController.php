<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Services\AuditLogger;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    /**
     * Display public listing of build modules.
     */
    public function index()
    {
        $modules = Module::where('status', 'build')->get();
        return response()->json($modules);
    }

    /**
     * Admin view: lists all modules, including pending ones.
     */
    public function adminIndex(Request $request)
    {
        $modules = Module::orderBy('slug', 'asc')->get();
        return response()->json($modules);
    }

    /**
     * Admin: update a scientific module.
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'complexity' => 'sometimes|required|string|max:100',
            'concept' => 'sometimes|required|string',
            'tech' => 'sometimes|required|string',
            'status' => 'sometimes|required|in:build,pending',
            'is_restricted' => 'sometimes|required|boolean',
        ]);

        $module = Module::find($id);

        if (!$module) {
            return response()->json(['message' => 'Module not found'], 404);
        }

        $oldRestricted = $module->is_restricted;
        $module->update($request->only([
            'title', 'category', 'complexity', 'concept', 'tech', 'status', 'is_restricted'
        ]));

        // Log the change
        AuditLogger::log('module.update', [
            'module' => $module->slug,
            'changes' => $request->all(),
        ]);

        return response()->json([
            'message' => 'Module updated successfully',
            'module' => $module
        ]);
    }
}

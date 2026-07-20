<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\ModuleController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuditLogController;

Route::prefix('v1')->group(function () {
    // ==========================================
    // PUBLIC ENDPOINTS (No Auth Required)
    // ==========================================
    
    // User login via Google
    Route::post('/auth/google', [AuthController::class, 'googleLogin'])->middleware('throttle:10,1');
    
    // Admin Login step 1 & step 2
    Route::post('/admin/login', [AdminAuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/admin/login/verify-2fa', [AdminAuthController::class, 'verify2fa'])->middleware('throttle:10,1');

    // Modules list (unauthenticated can view public ones)
    Route::get('/modules', [ModuleController::class, 'index']);

    // ==========================================
    // PROTECTED ENDPOINTS (All Require Auth)
    // ==========================================
    Route::middleware('admin.auth')->group(function () {
        // Session Me & Logout
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::get('/auth/session-check', [AuthController::class, 'sessionCheck']);

        // ==========================================
        // ADMIN ONLY ENDPOINTS (Require Admin Auth & Permissions)
        // ==========================================
        Route::prefix('admin')->group(function () {
            // Stats Overview
            Route::middleware('permission:dashboard')->group(function () {
                Route::get('/stats', [DashboardController::class, 'stats']);
            });

            // Modules Management
            Route::middleware('permission:modules')->group(function () {
                Route::get('/modules', [ModuleController::class, 'adminIndex']);
                Route::put('/modules/{id}', [ModuleController::class, 'update']);
            });

            // Users Management
            Route::middleware('permission:users')->group(function () {
                Route::get('/users', [UserController::class, 'index']);
                Route::put('/users/{id}', [UserController::class, 'update']);
            });

            // Logs Management
            Route::middleware('permission:logs')->group(function () {
                Route::get('/logs', [AuditLogController::class, 'index']);
            });
        });
    });
});

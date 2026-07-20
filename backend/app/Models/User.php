<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'google_id',
        'name',
        'email',
        'avatar',
        'role', // 'superadmin', 'admin', 'member', 'basic'
        'api_token',
        'google2fa_secret',
        'google2fa_enabled',
        'permissions', // admin specific permissions
        'failed_attempts',
        'locked_until',
        'is_active',
    ];

    protected $attributes = [
        'permissions' => '[]',
        'role' => 'basic',
        'is_active' => true,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'failed_attempts' => 'integer',
            'locked_until' => 'integer',
            'is_active' => 'boolean',
            'google2fa_enabled' => 'boolean',
        ];
    }

    /**
     * Determine if user has a specific permission (for admin dashboard operations).
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->role === 'superadmin') {
            return true;
        }

        return is_array($this->permissions) && in_array($permission, $this->permissions);
    }

    /**
     * Determine if user has admin privileges.
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, ['superadmin', 'admin']);
    }
}

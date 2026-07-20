<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class AuditLog extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'audit_logs';

    protected $fillable = [
        'user_id',
        'email',
        'event',
        'metadata', // array
        'ip_address',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}

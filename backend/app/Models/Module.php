<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Module extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'modules';

    protected $fillable = [
        'slug',
        'title',
        'category',
        'complexity',
        'concept',
        'tech',
        'status', // 'build', 'pending'
        'is_restricted', // boolean
        'launch_count', // integer
    ];

    protected $attributes = [
        'status' => 'pending',
        'is_restricted' => false,
        'launch_count' => 0,
    ];

    protected $casts = [
        'is_restricted' => 'boolean',
        'launch_count' => 'integer',
    ];
}

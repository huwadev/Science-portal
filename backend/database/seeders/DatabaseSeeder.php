<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Super Admin
        User::updateOrCreate(
            ['email' => 'superadmin@ethiosss.org'],
            [
                'name' => 'ESSS Superadmin',
                'role' => 'superadmin',
                'permissions' => ['dashboard', 'modules', 'users', 'logs'],
                'is_active' => true,
            ]
        );

        $this->call(ModuleSeeder::class);
    }
}

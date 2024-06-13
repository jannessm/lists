<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        \App\Models\User::factory(10)->hasTasks(5)->create();

        \App\Models\User::factory()
            ->hasTasks(5)
            ->create([
            'name' => 'Test User',
            'email' => 'test@test',
            'password' => Hash::make(md5("test")),
        ]);
    }
}

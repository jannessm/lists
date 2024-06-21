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
        if (file_exists(__DIR__ . '/data.db')) {
            $this->seedFromSqlite();
        } else {
            $this->seedRandomly();
        }
    }

    private function seedRandomly() {
        \App\Models\User::factory(10)->hasLists(5)->create();
    
        \App\Models\User::factory()
            ->hasTasks(5)
            ->create([
            'name' => 'Test User',
            'email' => 'test@test',
            'password' => Hash::make(md5("test")),
        ]);
    }

    private function seedFromSqlite() {
        $pdo = null;

        try {
            $pdo = new \PDO("sqlite:" . __DIR__ . '/data.db');
        } catch (\PDOException $e) {
            respondErrorMsg(500, "Database not available.");
        }

        if (!$pdo) {
            return;
        }

        //user
        $stmt = $pdo->prepare('Select email as name, email, password, dark_theme as theme from user;');
        $stmt->execute();

        while ($user = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            \App\Models\User::factory()->create($user);
        }
    }
}

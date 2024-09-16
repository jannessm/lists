<?php

namespace Database\Seeders;

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
            echo "seed from sqlite database\n\n";
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
        
        $new_lists = [];
        $new_users = [];

        //lists_user relations
        $relations_stmt = $pdo->prepare('SELECT email AS user_id, uuid AS list_id FROM user_list;');
        $relations_stmt->execute();

        while($relation = $relations_stmt->fetch(\PDO::FETCH_ASSOC)) {
            $created_list = FALSE;

            // create user if not done yet
            if (!array_key_exists($relation['user_id'], $new_users)) {
                $stmt = $pdo->prepare('SELECT email, password, dark_theme AS theme FROM user WHERE email = :email;');
                $stmt->execute([
                    ':email' => $relation['user_id']
                ]);
                
                $user = $stmt->fetch(\PDO::FETCH_ASSOC);
                if ($user) {
                    switch($user['theme']) {
                        default:
                        case null:
                            $user['theme'] = 'auto';
                            break;
                        case 1:
                        case '1':
                            $user['theme'] = 'dark';
                            break;
                        case 0:
                        case '0':
                            $user['theme'] = 'light';
                    }
                    $user['name'] = str_replace(['.', '-', '_'], ' ', explode('@', $user['email'])[0]);
                    echo "create user " . $user['name'] . "\n";
                    $new_user = \App\Models\User::create($user);
                    $new_users[$relation['user_id']] = $new_user;
                } else {
                    echo "\n" . $relation['user_id'] . " not found\n";
                    continue;
                }
            }


            // create list if not done yet
            if (!array_key_exists($relation['list_id'], $new_lists) && 
                 array_key_exists($relation['user_id'], $new_users)) {
                $stmt = $pdo->prepare('SELECT name, groceries AS is_shopping_list FROM lists WHERE uuid = :uuid;');
                $stmt->execute([
                    ':uuid' => $relation['list_id']
                ]);

                $user = $new_users[$relation['user_id']];
    
                $list = $stmt->fetch(\PDO::FETCH_ASSOC);
                $list['created_by'] = $user->id;
                $list['is_shopping_list'] = $list['is_shopping_list'] === 1 || $list['is_shopping_list'] === '1';
                
                echo "create list " . $list['name'] . " for " . $user->name ."\n";
                $new_list = \App\Models\Lists::create($list);
                
                $new_lists[$relation['list_id']] = $new_list;
                $created_list = TRUE;
            }


            //add relation if relation is "shared_with"
            if (!$created_list) {
                $new_user = $new_users[$relation['user_id']];
                $new_list = $new_lists[$relation['list_id']];
                echo "shared " . $new_list->name . " with " . $new_user->name . "\n";
                $new_list->sharedWith()->attach($new_user);
            }
        }

        //process list items
        $stmt = $pdo->prepare('SELECT name, time AS due, done, list_id, created_by from list_items;');
        $stmt->execute();

        while ($item = $stmt->fetch(\PDO::FETCH_ASSOC)) {

            if (!array_key_exists($item['list_id'], $new_lists) ||
                !array_key_exists($item['created_by'], $new_users)) {
                echo "\ncould not create item for " . $item['list_id'] . " for user " . $item['created_by'] . "\n";
                continue;
            }
            $item['lists_id'] = $new_lists[$item['list_id']]->id;
            $item['created_by'] = $new_users[$item['created_by']]->id;
            $item['done'] = $item['done'] === 1 || $item['done'] === '1';
            $item['timezone'] = 'Europe/Berlin';
            unset($item['list_id']);

            if (strlen($item['name']) > 50) {
                $item['description'] = $item['name'];
                $item['name'] = substr($item['name'], 0, 50);
            }

            $newItem = \App\Models\ListItem::create($item);
        }
    }
}

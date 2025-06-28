<?php

namespace App\Console\Commands;

use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UsageData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stats:usage';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Usage statistics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $stats = $this->getUsageStats();

        $this->info("Last Week Statistics:");
        $this->info("  Total Users:", $stats['users_count']);
        $this->info("  Unverified Users:", $stats['unverified_users_count']);
        if (!empty($stats['new_users'])) {
            $this->info("  New Users:", $stats['new_users']);
        }
    }

    public function getUsageStats() {
        /************ User stats **************/
        $last_week = Carbon::now()->subWeeks(1);
        $all_users = DB::scalar('select count(id) from users;');
        $new_users = DB::table('users')->where('created_at', '>=', $last_week)->get();
        $unverified_users = DB::scalar(
            'select count(id) from users where NOT email_verified_at = NULL;'
        );

        /************ Items stats ************/
        $new_items = DB::table('list_items')
            ->where('created_at', '>=', $last_week)
            ->count();
        $new_items_by_user = DB::table('list_items')
            ->join('users', 'users.id', '=', 'list_items.created_by')
            ->selectRaw('users.name, count(list_items.id) as new_items')
            ->where('list_items.created_at', '>=', $last_week)
            ->groupBy('users.name')
            ->orderBy('new_items', 'desc')
            ->get();
        $deleted_items = DB::table('list_items')
            ->select('users.name')
            ->where([['_deleted', true], ['updated_at', '>=', $last_week]])
            ->count();
        
        return [
            "users_count" => $all_users,
            "new_users" => $new_users,
            "unverified_users_count" => $unverified_users,
            "new_items_count" => $new_items,
            "new_items_by_user" => $new_items_by_user,
            "deleted_items_count" => $deleted_items
        ];
    }
}

<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Console\PromptsForMissingInput;

use Carbon\Carbon;

use App\Models\ListItem;
use App\Notifications\ReminderNotification;

class UserStatistics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-user-statistics';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send user statistics to admin.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $last_week = Carbon::now()->subWeeks(1);
        $all_users = DB::scalar('select count(id) from users;');
        $new_users = DB::scalar('select count(id) from users where created_at >= ' . $last_week.toISOString() . ';');
        $new_users = DB::scalar('select name, email from users where created_at >= ' . $last_week . ';');
        $unverified_users = DB::scalar('select count(id) from users where NOT email_verified_at = NULL;');

        Mail::to('jannes@magnusso.nz')->send(new UserStatisticsEmail($all_users, $new_users, $unverified_users));
    }
}

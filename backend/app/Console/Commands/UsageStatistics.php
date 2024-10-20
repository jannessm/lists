<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Console\PromptsForMissingInput;

use Carbon\Carbon;

use App\Mail\UsageStatisticsEmail;

class UsageStatistics extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-usage-statistics';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send usage statistics to admin.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
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

        if (!!config('mail.admin_mail')) {
            Mail::to(config('mail.admin_mail'))->send(
                new UsageStatisticsEmail($all_users, $new_users, $unverified_users,
                                         $new_items, $new_items_by_user, $deleted_items)
            );
        } else {
            throw new \Exception('no ADMIN_MAIL defined');
        }
    }
}

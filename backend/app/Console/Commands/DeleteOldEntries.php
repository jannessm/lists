<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Contracts\Console\PromptsForMissingInput;

use Carbon\Carbon;

use App\Mail\DeleteReportEmail;

class DeleteOldEntries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:delete-old-entries';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete old soft deleted entries that are older than 6 months.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $half_year_ago = Carbon::now()->subMonths(6);
        /************ Items ************/
        $deleted_items = DB::table('list_items')
            ->where([['_deleted', true], ['updated_at', '<', $half_year_ago]])
            ->delete();
        /************ Lists ************/
        $deleted_lists = DB::table('lists')
            ->where([['_deleted', true], ['updated_at', '<', $half_year_ago]])
            ->delete();

        if (!!env('ADMIN_MAIL', False)) {
            Mail::to(env('ADMIN_MAIL', False))->send(
                new DeleteReportEmail($deleted_items, $deleted_lists)
            );
        }
    }
}

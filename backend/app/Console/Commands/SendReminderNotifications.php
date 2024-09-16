<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Contracts\Console\PromptsForMissingInput;

use Carbon\Carbon;

use App\Models\ListItem;
use App\Notifications\ReminderNotification;

class SendReminderNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-reminders
        {--timestamp=now : timestamp of reminders to send notifications for}
        {--timezone=Europe/Berlin : timezone of the given timestamp}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notifications to users for enabled reminders';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $timestamp = new Carbon(
            $this->option('timestamp'),
            new \DateTimeZone($this->option('timezone'))
        );

        $timestamp = $timestamp->setTimezone('UTC');
        $timestamp->second = 0;

        $items = ListItem::where([
            ['_deleted', false],
            ['done', false],
            ['reminder', $timestamp]
        ])->get()->all();

        foreach($items as $item) {
            Log::debug('send reminder for "' . $item->name . '" at ' . $item->reminder);
            $users = $item->lists->users();
            $notification = new ReminderNotification($item);
            Notification::send($users, $notification);
        }
    }
}

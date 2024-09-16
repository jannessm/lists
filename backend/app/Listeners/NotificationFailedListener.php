<?php

namespace App\Listeners;

use App\Events\NotificationChannels\WebPush\Events\NotificationFailed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class NotificationFailedListener
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(NotificationFailed $event): void
    {
        Log::warning(json_encode($event->report, JSON_PRETTY_PRINT));
    }
}

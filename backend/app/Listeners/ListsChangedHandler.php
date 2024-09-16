<?php

namespace App\Listeners;

use App\Events\ListsChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

class ListsChangedHandler implements ShouldQueue
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
    public function handle(ListsChanged $event): void
    {
        Subscription::broadcast('streamLists', $event->changedLists);
    }
}

<?php

namespace App\Listeners;

use App\Events\UserChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

class StreamUserChanges implements ShouldQueue
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
    public function handle(UserChanged $event): void
    {
        Subscription::broadcast('streamMe', $event->updatedUsers);
    }
}

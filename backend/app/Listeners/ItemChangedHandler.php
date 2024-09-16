<?php

namespace App\Listeners;


use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Notification;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

use App\Events\ListItemChanged;
use App\Notifications\ListsChangedNotification;

class ItemChangedHandler implements ShouldQueue
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
    public function handle(ListItemChanged $event): void
    {
        $updatedItems = $event->changedItems;

        // stream changes
        Subscription::broadcast('streamItems', $updatedItems);

        // send Push Notifications
        foreach($updatedItems as $updatedItem) {
            foreach($event->pushRows as $row) {
                if ($updatedItem->id === $row['newDocumentState']['id']) {
                    $users = $updatedItem->lists->users();
                    $otherUsers = $users->whereNotIn('id', [$event->actor->id]);
                    
                    $notification = ListsChangedNotification::fromPushRow($row, $updatedItem, $event->actor);

                    if (App::environment('local')) {
                        Notification::send($users, $notification);
                    } else {
                        Notification::send($otherUsers, $notification);
                    }
                    break;
                }
            }
        }
    }
}

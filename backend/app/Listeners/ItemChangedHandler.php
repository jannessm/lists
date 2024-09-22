<?php

namespace App\Listeners;


use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Notification;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

use App\Events\ListItemChanged;
use App\Notifications\ItemChangedNotification;
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

        // sort by lists
        $lists = [];
        foreach($updatedItems as $item) {
            $lists_id = $item->lists->id;
            if (!array_key_exists($lists_id, $lists)) {
                $lists[$lists_id] = [];
            }

            array_push($lists[$lists_id], $item);
        }

        // create pushRows map
        $pushRows = [];
        foreach($event->pushRows as $row) {
            $pushRows[$row['newDocumentState']['id']] = $row;
        }

        // send Push Notifications
        foreach($lists as $items) {
            $list = $items[0]->lists;
            $users = $list->users();
            $otherUsers = $users->whereNotIn('id', [$event->actor->id]);
            
            if (count($items) > 1) {
                // create summarized notification
                $notification = new ListsChangedNotification($list, count($items), $event->actor);
            } else if (count($items) === 1) {
                // create specific notification
                $updatedItem = $items[0];
                $notification = ItemChangedNotification::fromPushRow($pushRows[$updatedItem->id], $updatedItem, $event->actor);
            }

            if (App::environment('dev')) {
                Notification::send($users, $notification);
            } else {
                Notification::send($otherUsers, $notification);
            }
        }
        // foreach($updatedItems as $updatedItem) {
        //     foreach($event->pushRows as $row) {
        //         if ($updatedItem->id === $row['newDocumentState']['id']) {
        //             $users = $updatedItem->lists->users();
        //             $otherUsers = $users->whereNotIn('id', [$event->actor->id]);
                    
        //             $notification = ListsChangedNotification::fromPushRow($row, $updatedItem, $event->actor);

        //             if (App::environment('local')) {
        //                 Notification::send($users, $notification);
        //             } else {
        //                 Notification::send($otherUsers, $notification);
        //             }
        //             break;
        //         }
        //     }
        // }
    }
}

<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

use NotificationChannels\WebPush\WebPushMessage;

use App\WebPush\MyWebPushChannel;
use App\Models\ListItem;
use App\Models\User;

enum ListChangeEvent {
    case Added;
    case Done;
    case Changed;
}

class ListsChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private ListItem $item,
        private ListChangeEvent $type,
        private User $actor) { }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [MyWebPushChannel::class];
    }

    /**
     * Determine if the notification should be sent.
     */
    public function shouldSendPush(object $notifiable, string $endpoint): bool
    {
        $settings = $notifiable->getPushSettings($endpoint);
        if (!$settings) {
            return false;
        }

        return $settings->receive_push && $settings->receive_lists_changed;
    }

    public function toWebPush($notifiable, $notification) {
        $list = $this->item->lists;
        $actor = explode(' ', $this->actor->name)[0];

        return (new WebPushMessage)
            ->title($list->name . ' geändert')
            ->icon('/icons/Icon-256.png')
            ->body($actor . ' hat ' . $this->item->name . ' ' . $this->eventToText() . '.')
            ->action('Liste öffnen', 'open_list')
            ->options([
                'TTL' => 1000,
                'urgency' => 'normal'
            ])
            ->data(['onActionClick' => [
                "default" => [
                    "operation" => "navigateLastFocusedOrOpen",
                    "url" => "/user/lists/" . $list->id
                ],
                "open_list" => [
                    "operation" => "navigateLastFocusedOrOpen",
                    "url" => "/user/lists/" . $list->id
                ]
            ]]);
    }

    function eventToText() {
        switch ($this->type) {
            case ListChangeEvent::Added:
                return 'hinzugefügt';
            case ListChangeEvent::Done:
                return 'erledigt';
            
            default:
                return 'verändert';
        }
    }

    static function fromPushRow($pushRow, ListItem $item, User $user) {
        $newState = $pushRow['newDocumentState'];
        $master = $pushRow['assumedMasterState'];

        if (!$master) {
            return new ListsChangedNotification($item, ListChangeEvent::Added, $user);
        } else if ($newState['done'] !== $master['done'] && $item->done) {
            return new ListsChangedNotification($item, ListChangeEvent::Done, $user);
        }

        return new ListsChangedNotification($item, ListChangeEvent::Changed, $user);
    }
}

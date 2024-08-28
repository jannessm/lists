<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

use NotificationChannels\WebPush\WebPushMessage;
use NotificationChannels\WebPush\WebPushChannel;

use App\Models\ListItem;

enum ListsChangeEvent {
    case Added;
    case Done;
    case Changed;
}

class ListsChanged extends Notification implements ShouldQueue
{
    use Queueable;

    private ListItem $item;
    private ListChangeEvent $type;

    /**
     * Create a new notification instance.
     */
    public function __construct(ListItem $item, ListChangeEvent $type)
    {
        $this->item = $item;
        $this->type = $type;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return [WebPushChannel::class];
    }

    /**
     * Determine if the notification should be sent.
     */
    public function shouldSend(object $notifiable, string $channel): bool
    {
        // return $this->invoice->isPaid();
        return true;
    }

    public function toWebPush($notifiable, $notification) {
        $list = $this->item->lists;

        return (new WebPushMessage)
            ->title($list->name . 'geändert')
            ->icon('/favicon.ico')
            ->body($this->item->name . ' wurde ' . $this->eventToText() . '.')
            ->action('Liste öffnen', 'open_list')
            ->options(['TTL' => 1000])
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
            // ->badge()
            // ->dir()
            // ->image()
            // ->lang()
            // ->renotify()
            // ->requireInteraction()
            // ->tag()
            // ->vibrate()
    }

    function eventToText() {
        switch ($this->type) {
            case ListsChangeEvent::Added:
                return 'hinzugefügt';
            case ListsChangeEvent::Done:
                return 'erledigt';
            
            default:
                return 'verändert';
        }
    }

    static function fromPushRow($pushRow, ListsItem $item) {
        $newState = $pushRow['newDocumentState'];
        $master = $pushRow['assumedMasterState'];

        if (!$master) {
            return new ListsChanged($item, ListsChangeEvent::Added);
        } else if ($newState['done'] !== $master['done'] && $item->done) {
            return new ListsChanged($item, ListsChangeEvent::Done);
        }

        return new ListsChanged($item, ListsChangeEvent::Changed);
    }
}

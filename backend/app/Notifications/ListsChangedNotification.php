<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

use NotificationChannels\WebPush\WebPushMessage;

use App\WebPush\MyWebPushChannel;
use App\Models\Lists;
use App\Models\User;

class ListsChangedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private Lists $lists,
        private int $items,
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
        $actor = explode(' ', $this->actor->name)[0];

        return (new WebPushMessage)
            ->title($this->lists->name . ' geändert')
            ->icon('/icons/Icon-64.png')
            ->body($actor . ' hat ' . $this->items . ' Einträge geändert.')
            ->action('Liste öffnen', 'open_list')
            ->options([
                'TTL' => 1000,
                'urgency' => 'normal'
            ])
            ->data(['onActionClick' => [
                "default" => [
                    "operation" => "navigateLastFocusedOrOpen",
                    "url" => "/user/lists/" . $this->lists->id
                ],
                "open_list" => [
                    "operation" => "navigateLastFocusedOrOpen",
                    "url" => "/user/lists/" . $this->lists->id
                ]
            ]]);
    }
}

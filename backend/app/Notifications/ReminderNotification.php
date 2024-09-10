<?php

namespace App\Notifications;

use Carbon\Carbon;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

use NotificationChannels\WebPush\WebPushMessage;

use App\WebPush\MyWebPushChannel;
use App\Models\ListItem;

class ReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private ListItem $item
    ) { }

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

        return $settings->receive_push && $settings->receive_reminder;
    }

    public function toWebPush($notifiable, $notification) {
        $list = $this->item->lists;

        return (new WebPushMessage)
            ->title($this->item->name)
            ->icon('/favicon.ico')
            ->body($this->getTime())
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
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function getTime() {
        $due = null;
        if ($this->item->due) {
            $due = $this->item->due->setTimezone($this->item->timezone);
        }

        if (
            $due &&
            $due->format('Y-m-d') === Carbon::now($this->item->timezone)->format('Y-m-d')
        ) {
            return 'Heute um ' . $due->format('H:i');
        } else if ($due) {
            return 'Am ' . $due->format('d.m. H:i');
        } else {
            return 'Erinnerung';
        }
    }
}

<?php

namespace App\Providers;

use Illuminate\Notifications\Notification;
use Minishlink\WebPush\Subscription;
use NotificationChannels\WebPush\WebPushChannel;

class MyWebPushChannel extends WebPushChannel {
    
    /**
     * Send the given notification.
     *
     * @param  mixed  $notifiable
     * @param  \Illuminate\Notifications\Notification  $notification
     * @return void
     */
    public function send($notifiable, Notification $notification)
    {
        /** @var \Illuminate\Database\Eloquent\Collection $subscriptions */
        $subscriptions = $notifiable->routeNotificationFor('WebPush', $notification);

        if ($subscriptions->isEmpty()) {
            return;
        }

        /** @var \NotificationChannels\WebPush\WebPushMessage $message */
        $message = $notification->toWebPush($notifiable, $notification);
        $payload = json_encode($message->toArray());
        $options = $message->getOptions();

        /** @var \NotificationChannels\WebPush\PushSubscription $subscription */
        foreach ($subscriptions as $subscription) {
            if ($notification->shouldSendPush($notifiable, $subscription->endpoint)) {
                $this->webPush->queueNotification(new Subscription(
                    $subscription->endpoint,
                    $subscription->public_key,
                    $subscription->auth_token,
                    $subscription->content_encoding
                ), $payload, $options);
            }
        }

        $reports = $this->webPush->flush();

        $this->handleReports($reports, $subscriptions, $message);
    }
}
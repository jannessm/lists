<?php

namespace App\WebPush;

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
        $payload = json_encode(["notification" => $message->toArray()]);
        $options = $message->getOptions();
        
        $webpush = config('webpush');
        $publicKey = $webpush['vapid']['public_key'];
        $privateKey = $webpush['vapid']['private_key'];

        $auth['VAPID'] = compact('publicKey', 'privateKey');
        $auth['VAPID']['subject'] = $webpush['vapid']['subject'];

        if (empty($auth['VAPID']['subject'])) {
            $auth['VAPID']['subject'] = url('/');
        }

        /** @var \NotificationChannels\WebPush\PushSubscription $subscription */
        foreach ($subscriptions as $subscription) {
            if ($notification->shouldSendPush($notifiable, $subscription->endpoint)) {
                $this->webPush->queueNotification(new Subscription(
                    $subscription->endpoint,
                    $subscription->public_key,
                    $subscription->auth_token,
                    $subscription->content_encoding
                ), $payload, $options, $auth);
            }
        }

        $reports = $this->webPush->flush();

        $this->handleReports($reports, $subscriptions, $message);
    }
}
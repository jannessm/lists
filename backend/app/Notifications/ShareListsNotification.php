<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

use App\Models\Lists;

class ShareListsNotification extends Notification
{
    use Queueable;

    private Lists $lists;

    /**
     * Create a new notification instance.
     */
    public function __construct(String $id)
    {
        $this->lists = Lists::where('id', $id)->first();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = $this->confirmationUrl();

        return (new MailMessage)
            ->greeting('Hallo!')
            ->subject($this->lists->name . ' freigegeben')
            ->line('Liste '.$this->lists->name.' wurde dir von '.$notifiable->name.' freigegeben.')
            ->line('Klicke auf den Knopf um der Liste "'.$this->lists->name.'" beizutreten.')
            ->action('Liste beitreten', $url)
            ->salutation("Mit freundlichen Grüßen");
    }

    public function confirmationUrl() {
        return URL::signedRoute('share-lists.confirm', [
            'id' => $this->lists->id,
            'hash' => sha1('test')
        ]);
    }
}

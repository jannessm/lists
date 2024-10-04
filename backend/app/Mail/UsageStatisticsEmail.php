<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\HtmlString;
use Illuminate\Support\Collection;

class UsageStatisticsEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(private int $all_users,
                                private Collection $new_users,
                                private int $unverified_users,
                                private int $new_items,
                                private Collection $new_items_by_user,
                                private int $deleted_items)
    {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Lists]: Statistics',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $mail = (new MailMessage)->greeting('Neue Statistiken sind da!')
            ->line(new HtmlString('<h2>Benutzer</h2>'))
            ->line('Es sind '.$this->all_users.' Benutzer registriert.')
            ->line($this->unverified_users.' haben ihre Email noch nicht verifiziert.')
            ->line(count($this->new_users).' haben sich neu registriert.')
            ->line(new HtmlString('<hr>'));
        
        foreach($this->new_users as $u) {
            $mail->line($u->name);
        }
        
        $mail->line(new HtmlString('<hr>'))
            ->line(new HtmlString('<h2>Items</h2>'))
            ->line($this->new_items.' neue Einträge wurden angelegt.')
            ->line($this->deleted_items.' sind seit länger als einer Woche gelöscht.')
            ->line(new HtmlString('<hr>'));
        
        $mail->line('Top users:');
        foreach($this->new_items_by_user as $new_items) {
            $mail->line($new_items->name.' mit '.$new_items->new_items.' neuen Einträgen.');
        }
        $mail->line(new HtmlString('<hr>'));
        
        return new Content(
            htmlString: $mail->render()
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

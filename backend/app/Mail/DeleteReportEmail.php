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

class DeleteReportEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(private int $deleted_items,
                                private int $deleted_lists,
                                private int $deleted_users=0)
    {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Lists]: Delete Report',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $mail = (new MailMessage)->greeting('Delete Report!')
            ->line('Es wurden '.$this->deleted_items.' Einträge gelöscht.')
            ->line('Es wurden '.$this->deleted_lists.' Listen gelöscht.')
            ->line('Es wurden '.$this->deleted_users.' Benutzer gelöscht.');
        
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

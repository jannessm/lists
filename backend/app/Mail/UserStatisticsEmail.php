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

class Statistics extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(private int $all_users,
                                private int $new_users,
                                private int $unverified_users)
    {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Lists]: User Statistics',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $user = Auth::user();
        
        return new Content(
            htmlString: (new MailMessage)->greeting('Neue Statistiken sind da!')
                ->line('Die App wird von '.$this->all_users.' benutzt.')
                ->line($this->unverified_users.' haben ihre Email noch nicht verifiziert.')
                ->line($this->new_users.' haben sich neu registriert.')
                ->salutation('Mit freundlichen Grüßen')
                ->render()
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

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

class InvitationEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Einladung zu Lists',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $user = Auth::user();
        
        return new Content(
            htmlString: (new MailMessage)->greeting('Hallo!')
                ->line('Du wurdest von '.$user->name.' eingeladen die App Lists zu nutzen. Registriere dich jetzt und erstelle ToDo und Einkaufslisten.')
                ->action('Registrieren', route('register'))
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

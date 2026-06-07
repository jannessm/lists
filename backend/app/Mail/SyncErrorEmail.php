<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Queue\SerializesModels;

class SyncErrorEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        private string $userEmail,
        private string $userId,
        private string $errorMessage,
        private array $errorDetails = []
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '[Lists]: Sync Error Report',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $mail = (new MailMessage)
            ->greeting('Sync Error Report')
            ->line('Ein Benutzer hat einen Fehler beim Synchronisieren erlebt.')
            ->line('**Benutzer Email:** ' . $this->userEmail)
            ->line('**Benutzer ID:** ' . $this->userId)
            ->line('**Fehlermeldung:** ' . $this->errorMessage);

        if (!empty($this->errorDetails)) {
            $mail->line('**Fehlerdetails:**');
            foreach ($this->errorDetails as $key => $value) {
                $mail->line('- ' . $key . ': ' . json_encode($value));
            }
        }

        $mail->line('Bitte überprüfen Sie die Logs für weitere Details.');
        
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

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

use App\Notifications\ShareListsNotification;

class ShareListsEmail extends Mailable
{
    use Queueable, SerializesModels;

    private MailMessage $notification;
    private String $recipientEmail;

    /**
     * Create a new message instance.
     */
    public function __construct(String $id, String $recipientEmail) 
    {
        $user = Auth::user();
        $this->recipientEmail = $recipientEmail;
        
        // Create a mock notifiable object with the recipient email
        $notifiable = new \stdClass();
        $notifiable->email = $recipientEmail;
        $notifiable->name = $user->name;
        
        $this->notification = (new ShareListsNotification($id))->toMail($notifiable);
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->notification->subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->notification->render()
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

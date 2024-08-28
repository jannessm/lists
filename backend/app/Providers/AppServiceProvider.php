<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

use NotificationChannels\WebPush\ReportHandlerInterface;
use NotificationChannels\WebPush\ReportHandler;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        VerifyEmail::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->greeting('Hallo!')
                ->subject('Emailadresse Bestätigen')
                ->line('Klicke auf den Knopf um deine Emailadresse zu bestätigen.')
                ->action('Emailadresse bestätigen', $url)
                ->salutation("Mit freundlichen Grüßen");
        });

        ResetPassword::toMailUsing(function (object $notifiable, string $url) {
            return (new MailMessage)
                ->greeting('Hallo!')
                ->subject('Passwort Zurücksetzen')
                ->line('Nutze den Link um dein Passwort zurückzusetzen.')
                ->action('Passwort zurücksetzen', $url)
                ->line('Der Link ist 60 Minuten gültig. Sollte keine Anfrage gestellt worden sein, ist keine weitere Aktion nötig.')
                ->salutation("Mit freundlichen Grüßen");
        });

        $this->app->when(MyWebPushChannel::class)
            ->needs(ReportHandlerInterface::class)
            ->give(ReportHandler::class);
    }
}

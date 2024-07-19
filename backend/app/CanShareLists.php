<?php

namespace App;

use Illuminate\Support\Facades\Mail;

use App\Notifications\ShareListsNotification;
use App\Mail\InvitationEmail;
use App\Mail\ShareListsEmail;
use App\Models\User;

trait CanShareLists
{
    public function confirmShareLists() {

    }

    public function sendShareEmailNotification(String $id, String $email) {
        $recipient = User::where('email', $email)->first();

        if (!!$recipient) {
            $recipient->notify(new ShareListsNotification($id));
        } else {
            Mail::to($email)->send(new InvitationEmail);
            Mail::to($email)->send(new ShareListsEmail($id));
        }
    }
}
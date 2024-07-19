<?php

namespace App;

use Illuminate\Support\Facades\Mail;
use Nuwave\Lighthouse\Execution\Utils\Subscription;

use App\Notifications\ShareListsNotification;
use App\Mail\InvitationEmail;
use App\Mail\ShareListsEmail;
use App\Models\User;
use App\Models\Lists;

trait CanShareLists
{
    public function hasAccessToLists(String $lists_id) {
        $lists = Lists::where('id', $lists_id)->first();

        if ($lists) {
            $users = count($lists->users()->filter(function ($val) {
                $val->id === $this->id;
            })->values()->all());
            return $users > 0;
        }
        
        return false;
    }

    public function confirmShareLists(String $listsId) {
        $lists = Lists::where('id', $listsId)->first();

        if ($lists) {
            $lists->sharedWith()->attach($this);

            // set updated at to trigger resync
            $lists->updated_at = $this->freshTimestamp();
            $lists->save();

            foreach($lists->items->all() as $item) {
                $item->updated_at = $item->freshTimestamp();
                $item->save();
            }

            if (!$this->hasVerifiedEmail()) {
                $this->markEmailAsVerified();
            }

            Subscription::broadcast('streamLists', collect([$lists])->all());
            Subscription::broadcast('streamItems', $lists->items->all());
            
            return true;
        }
        return false;
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
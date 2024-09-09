<?php

namespace App;

use Illuminate\Support\Facades\Mail;
use Nuwave\Lighthouse\Execution\Utils\Subscription;

use App\Notifications\ShareListsNotification;
use App\Mail\InvitationEmail;
use App\Mail\ShareListsEmail;
use App\Models\User;
use App\Models\Lists;
use App\Events\UserChanged;
use App\Events\ListsChanged;

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

    /**
     * if a list is found =>
     *   - add current user to this list
     *   - stream users of list to refresh their lists property
     *   - stream list to update users at the frontend
     *   - mark users email as verified
     */
    public function confirmShareLists(String $lists_id) {
        $lists = Lists::where('id', $lists_id)->first();

        if ($lists && !$this->hasAccessToLists($lists_id)) {
            $lists->sharedWith()->attach($this);

            $this->dispatchChanges($lists);
            
            return true;
        }
        return false;
    }

    /**
     * if a list is found and the acting user is the creator of this list =>
     *   - remove user from list
     *   - stream list to update their users property
     *   - stream all old users to update their lists property
     */
    public function unshareLists(String $lists_id, String $user_id) {
        $lists = Lists::where('id', $lists_id)->first();

        if (!!$user_id &&
            ($this->id === $lists->createdBy->id ||
             $this->id === $user_id)
        ) {
            $old_users = $lists->users()->all();

            // remove user from list
            $lists->sharedWith()->detach($user_id);
            
            $this->dispatchChanges($lists, $old_users);

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

    private function dispatchChanges(Lists $lists, $old_users = null) {
        // refresh timestamps to trigger resync
        $lists->updated_at = $this->freshTimestamp();
        $lists->save();

        foreach($lists->users() as $user) {
            $user->updated_at = $this->freshTimestamp();
            $user->save();
        }

        if ($old_users !== null) {
            UserChanged::dispatch($old_users);
        } else {
            UserChanged::dispatch($lists->users()->all());
        }
        ListsChanged::dispatch([$lists]);
    }
}
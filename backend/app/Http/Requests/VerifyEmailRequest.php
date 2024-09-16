<?php

namespace App\Http\Requests;

use Laravel\Fortify\Http\Requests\VerifyEmailRequest as VerifyEmailRequestFortify;

use App\Models\User;

class VerifyEmailRequest extends VerifyEmailRequestFortify
{
    public $user = null;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $this->user = User::where('id', $this->route('id'))->first();

        if (!$this->user) {
            return false;
        }

        if (! hash_equals(sha1($this->user->getEmailForVerification()), (string) $this->route('hash'))) {
            return false;
        }

        return true;
    }
}

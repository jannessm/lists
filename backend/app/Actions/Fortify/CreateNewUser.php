<?php

namespace App\Actions\Fortify;

use App\Models\User;
use App\Services\MagicLinkService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    public function __construct(private MagicLinkService $magicLink) {}

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name'              => ['required', 'string', 'max:255'],
            'email'             => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique(User::class),
            ],
            'email_confirmation' => ['required', 'string', 'same:email'],
        ])->validate();

        $user = User::create([
            'name'  => $input['name'],
            'email' => $input['email'],
        ]);

        event(new Registered($user));

        $this->magicLink->sendCode($user);

        return $user;
    }
}

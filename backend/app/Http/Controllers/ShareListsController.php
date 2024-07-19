<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ShareListsController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     *
     * @param  \Laravel\Fortify\Http\Requests\VerifyEmailRequest  $request
     * @return \Laravel\Fortify\Contracts\VerifyEmailResponse
     */
    public function __invoke(VerifyEmailRequest $request)
    {
        // if ($request->user()->hasVerifiedEmail()) {
        //     return app(VerifyEmailResponse::class);
        // }

        // if ($request->user()->markEmailAsVerified()) {
        //     event(new Verified($request->user()));
        // }

        // return app(VerifyEmailResponse::class);
    }
}

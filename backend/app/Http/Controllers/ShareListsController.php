<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\EmailVerificationNotificationSentResponse;

use App\Models\Lists;

class ShareListsController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     *
     * @param  \Laravel\Fortify\Http\Requests\VerifyEmailRequest  $request
     * @return \Laravel\Fortify\Contracts\VerifyEmailResponse
     */
    public function confirm(Request $request, String $id)
    {
        if ($request->user()->hasAccessToLists($id) || 
            $request->user()->confirmShareLists($id)
        ) {
            return redirect()->intended('');
        }

        return new JsonReponse('', 400);
    }

    public function unshare(Request $request, String $lists_id) {
        $request->user()->unshareLists($lists_id, $request->input('user'));

        return new JsonResponse('', 201);
    }

    /**
     * Send a share lists verification notification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, String $id)
    {
        // if ($request->user()->hasVerifiedEmail()) {
        //     return new JsonResponse('', 204);
        // }

        $recipient = json_decode($request->getContent())->email;

        $request->user()->sendShareEmailNotification($id, $recipient);

        return '';
    }
}

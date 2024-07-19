<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Laravel\Fortify\Contracts\EmailVerificationNotificationSentResponse;

class ShareListNotificationController extends Controller
{
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

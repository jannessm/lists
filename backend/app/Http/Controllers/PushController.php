<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PushController extends Controller
{
    function subscribe(Request $request) {
        $endpoint = $request->input('endpoint');
        $key = $request->input('key');
        $token = $request->input('token');

        $user = $request->user();
        if ($user) {
            $user->updatePushSubscription($endpoint, $key, $token);
        }

    }

    function unsubscribe(Request $request) {
        $endpoint = $request->input('endpoint');

        $user = $request->user();
        if ($user) {
            $user->deletePushSubscription($endpoint);
        }
    }
}

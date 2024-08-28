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

        $user->updatePushSubscription($endpoint, $key, $token);
    }

    function unsubscribe(Request $request) {
        $endpoint = $request->input('endpoint');

        $request->user()->deletePushSubscription($endpoint);
    }
}

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Auth\MustVerifyEmail;

use Symfony\Component\HttpFoundation\Response;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware("web")->get('auth', function(Request $request) {
    $user = Auth::user();
    return ["loggedIn" => $user !== null];
});

Route::middleware(["web"])->get('email/verified', function(Request $request) {
    $user = $request->user();
    if (!!$user && $user instanceof MustVerifyEmail && $user->hasVerifiedEmail()) {
        return ["verified" => true];
    }
    return ["verified" => false];
});
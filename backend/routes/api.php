<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

use App\Http\Controllers\Auth\MagicLinkController;
use App\Http\Controllers\PushController;
use App\Http\Controllers\ShareListsController;
use App\Events\UserChanged;


$verificationLimiter = config('fortify.limiters.verification', '6,1');

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
    if ($user === null) {
        return ["loggedIn" => null];
    }
    return ["loggedIn" => $user->id];
});



/**
 * Passwordless auth routes
 */

// Override Fortify's login route with our custom passwordless login
Route::middleware(["web"])->post('login', [MagicLinkController::class, 'login']);

Route::middleware(["web"])->post('auth/verify-code', [MagicLinkController::class, 'verifyCode']);
Route::middleware(["web"])->post('auth/resend-code', [MagicLinkController::class, 'resendCode']);



/**
 * User routes
 */

Route::middleware(["web"])->post('user/change-email', function(Request $request) {
    $user = $request->user();

    $newEmail = $request->input('newEmail');

    $usersWithNewEmail = DB::table('users')->where('email', $newEmail)->count();

    if ($usersWithNewEmail > 0) {
        return ['status' => 'email already used'];
    }

    $user->email = $newEmail;
    $user->email_verified_at = null;
    $user->save();

    UserChanged::dispatch([$user]);

    return ['status' => 'ok'];
});




/**
 * share lists routes
 */

Route::get('share-lists/confirm/{id}/{hash}', [ShareListsController::class, 'confirm'])
            ->middleware(['web', 'signed', 'throttle:'.$verificationLimiter])
            ->name('share-lists.confirm');

Route::post('unshare-lists/{id}', [ShareListsController::class, 'unshare'])
            ->middleware(['web', 'throttle:'.$verificationLimiter])
            ->name('unshare-lists');

Route::post('email/share-lists-notification/{id}', [ShareListsController::class, 'store'])
    ->middleware(["web", 'throttle:'.$verificationLimiter])
    ->name('share-lists.send');



/**
 * push notifications
 */
Route::post('push/subscribe', [PushController::class, 'subscribe'])
    ->middleware(['web', 'throttle:'.$verificationLimiter])
    ->name('push.subscribe');

Route::post('push/unsubscribe', [PushController::class, 'unsubscribe'])
->middleware(['web', 'throttle:'.$verificationLimiter])
->name('push.unsubscribe');




Route::get('grocery-categories', function(Request $request) {
    $handle = fopen(resource_path() . '/grocery_categories.tsv', 'rb');
    $f = [];
    while (!feof($handle)) {
        $f[] = fgets($handle);
    }
    
    // read categories
    $header = str_getcsv($f[0], "\t");
    foreach($header as $h) {
        $data[$h] = [];
    }

    array_splice($f, 0, 1);

    foreach ($f as $row) {
        $row = str_getcsv($row, "\t");
        foreach($row as $col => $val) {
            if ($val) {
                //remove diacritics, trim, lowercase
                $val = strtolower(trim($val));
                $regexp = '/&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml|caron);/i';
                $val = html_entity_decode(preg_replace($regexp, '$1', htmlentities($val)));
                
                array_push($data[$header[$col]], $val);
            }
        }
    }

    return $data;
});
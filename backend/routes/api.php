<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Auth\MustVerifyEmail;

use Laravel\Fortify\Http\Controllers\VerifyEmailController;
use Laravel\Fortify\RoutePath;

use Symfony\Component\HttpFoundation\Response;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

use App\Http\Controllers\PushController;
use App\Http\Controllers\ShareListsController;


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
 * email routes
 */

Route::middleware(["web"])->get('email/verified', function(Request $request) {
    $user = $request->user();
    if (!!$user && $user instanceof MustVerifyEmail && $user->hasVerifiedEmail()) {
        return ["verified" => true];
    }
    return ["verified" => false];
});

Route::get(RoutePath::for('verification.verify', '/email/verify/{id}/{hash}'), [VerifyEmailController::class, '__invoke'])
    ->middleware(['signed', 'throttle:'.$verificationLimiter])
    ->name('verification.verify');

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
    $user->sendEmailVerificationNotification();

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
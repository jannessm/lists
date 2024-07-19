<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Auth\MustVerifyEmail;

use Symfony\Component\HttpFoundation\Response;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

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
    return ["loggedIn" => $user !== null];
});

Route::middleware(["web"])->get('email/verified', function(Request $request) {
    $user = $request->user();
    if (!!$user && $user instanceof MustVerifyEmail && $user->hasVerifiedEmail()) {
        return ["verified" => true];
    }
    return ["verified" => false];
});

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

    Subscription::broadcast('streamMe', [$user]);

    return ['status' => 'ok'];
});

Route::get('share-lists/confirm/{id}/{hash}', [ShareListsController::class, 'confirm'])
            ->middleware(['web', 'signed', 'throttle:'.$verificationLimiter])
            ->name('share-lists.confirm');

Route::post('email/share-lists-notification/{id}', [ShareListsController::class, 'store'])
    ->middleware(["web", 'throttle:'.$verificationLimiter])
    ->name('share-lists.send');

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
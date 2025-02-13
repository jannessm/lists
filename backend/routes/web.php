<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Response;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

$routes = ['', 'user', 'user/lists', 'user/lists/{id}', 'user/settings', 'cookies', 'graphql', 'forgot-password'];

$ngIndex = function () {
    return response(File::get(public_path() . '/ng-dist/browser/index.html'))->header('Content-Type', 'text/html; charset=UTF-8');
};

foreach ($routes as $route) {
    Route::get('/' . $route, $ngIndex);
}

Route::get('/reset-password', $ngIndex)->name('password.reset');

Route::get('/login', $ngIndex)->name('login');
Route::get('/register', $ngIndex)->name('register');

Route::get('/{file}', function(string $file) {
    $filename = public_path() . '/ng-dist/browser/' . $file;

    if (substr($filename, -2) === "js") {
        $mime = "application/javascript; charset=UTF-8";
    } else if (substr($filename, -3) === "css") {
        $mime = "text/css; charset=UTF-8";
    } else {
        $mime = mime_content_type($filename);
    }

    return response(File::get($filename))->header('Content-Type', $mime);

})->where('file', '.+\.(css|js|png|ico|webmanifest|json|ttf|woff2|html|map)');

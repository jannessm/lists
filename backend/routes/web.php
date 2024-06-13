<?php

use Illuminate\Support\Facades\Route;
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

$routes = ['', 'login', 'register', 'dashboard'];

foreach ($routes as $route) {
    Route::get('/' . $route, function() {
        return response(File::get(public_path() . '/ng-dist/browser/index.html'))->header('Content-Type', 'text/html; charset=UTF-8');
    });
}

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

})->where('file', '.+\.(css|js|png|ico)');
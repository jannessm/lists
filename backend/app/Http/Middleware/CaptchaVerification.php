<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CaptchaVerification
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $url = url()->current();

        if (str_ends_with($url, 'login') || str_ends_with($url, 'register')) {
            $request->validate([
                'captcha' => 'required|HCaptcha',
            ]);
        }
        return $next($request);
    }
}

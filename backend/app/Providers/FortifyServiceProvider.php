<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Contracts\LoginResponse;
use Laravel\Fortify\Contracts\LogoutResponse;
use Laravel\Fortify\Contracts\RegisterResponse;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->instance(LogoutResponse::class, new class implements LogoutResponse {
            public function toResponse($request)
            {
                return response("");
            }
        });

        $this->app->instance(LoginResponse::class, new class implements LoginResponse {
            public function toResponse($request)
            {
                // Check for pending list invitation
                if ($request->session()->has('pending_list_invitation')) {
                    $invitation = $request->session()->get('pending_list_invitation');
                    $user = $request->user();

                    // Verify email matches
                    if ($user && $user->email === $invitation['email']) {
                        // Confirm the list invitation
                        $user->confirmShareLists($invitation['list_id']);
                        $request->session()->forget('pending_list_invitation');
                    }
                }

                return response("");
            }
        });

        $this->app->instance(RegisterResponse::class, new class implements RegisterResponse {
            public function toResponse($request)
            {
                // After registration the user is NOT yet fully authenticated.
                // Log them back out — full auth happens only after code verification.
                auth()->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                // Check for pending list invitation
                if ($request->session()->has('pending_list_invitation')) {
                    $invitation = $request->session()->get('pending_list_invitation');
                    $user = $request->user();

                    if ($user && $user->email === $invitation['email']) {
                        $user->confirmShareLists($invitation['list_id']);
                        $request->session()->forget('pending_list_invitation');
                    }
                }

                return response()->json(['status' => 'code_sent'], 201);
            }
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::createUsersUsing(CreateNewUser::class);

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });
    }
}

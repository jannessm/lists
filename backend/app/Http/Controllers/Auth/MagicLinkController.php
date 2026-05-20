<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\MagicLinkService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class MagicLinkController extends Controller
{
    public function __construct(private MagicLinkService $magicLink) {}

    /**
     * POST /api/login
     * Passwordless login: look up user by email, send magic link code.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $email = strtolower(trim($request->input('email')));
        $user = User::where('email', $email)->first();

        // Always return the same response to prevent user enumeration
        if ($user) {
            $this->magicLink->sendCode($user);
        }

        return response()->json(['status' => 'code_sent']);
    }

    /**
     * POST /api/auth/verify-code
     * Verify a magic link code entered manually inside the PWA.
     */
    public function verifyCode(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $email = strtolower(trim($request->input('email')));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['error' => 'invalid_code'], 422);
        }

        $record = $this->magicLink->verifyCode($user, $request->input('code'));

        if (!$record) {
            // Check if too many attempts (code was just invalidated)
            return response()->json(['error' => 'invalid_code'], 422);
        }

        // Mark email as verified on first successful code entry
        if (!$user->email_verified_at) {
            $user->email_verified_at = now();
            $user->save();
        }

        // Fully authenticate the user
        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return response()->json(['success' => true]);
    }

    /**
     * GET /auth/verify?code=ABC123
     * Clickable link from email – verifies code and redirects to app.
     */
    public function verifyLink(Request $request)
    {
        $code  = $request->query('code', '');
        $email = $request->query('email', '');

        $user = User::where('email', strtolower(trim($email)))->first();

        if ($user) {
            $record = $this->magicLink->verifyCode($user, $code);

            if ($record) {
                if (!$user->email_verified_at) {
                    $user->email_verified_at = now();
                    $user->save();
                }

                Auth::login($user, remember: true);
                $request->session()->regenerate();

                return redirect('/');
            }
        }

        return redirect('/login?error=invalid_code');
    }

    /**
     * POST /api/auth/resend-code
     * Rate-limited resend of a magic link code (by IP, max 3 per 10 min).
     */
    public function resendCode(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
        ]);

        $key = 'resend-code:' . $request->ip();

        if (RateLimiter::tooManyAttempts($key, 3)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'error'      => 'too_many_requests',
                'retry_after' => $seconds,
            ], 429);
        }

        RateLimiter::hit($key, 600); // 10 minutes decay

        $email = strtolower(trim($request->input('email')));
        $user = User::where('email', $email)->first();

        if ($user) {
            $this->magicLink->sendCode($user);
        }

        return response()->json(['status' => 'code_sent']);
    }
}

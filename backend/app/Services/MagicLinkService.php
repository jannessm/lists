<?php

namespace App\Services;

use App\Mail\MagicLinkMail;
use App\Models\MagicLinkCode;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class MagicLinkService
{
    const CODE_TTL_MINUTES = 15;
    const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const CODE_LENGTH = 6;

    /**
     * Generate a 6-character alphanumeric code, invalidate previous unused codes
     * for the user, persist the hashed code, and send the magic link email.
     *
     * Returns the plaintext code (only used for testing; production code emails it).
     */
    public function sendCode(User $user): string
    {
        // Invalidate previous unused/unexpired codes for this user
        MagicLinkCode::where('user_id', $user->id)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->update(['used_at' => now()]);

        $plaintext = $this->generateCode();
        $hash = hash('sha256', strtoupper($plaintext));

        MagicLinkCode::create([
            'user_id'    => $user->id,
            'code'       => $hash,
            'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
        ]);

        Mail::to($user->email)->send(new MagicLinkMail($plaintext, $user));

        return $plaintext;
    }

    /**
     * Verify a submitted code for a given user.
     *
     * Returns the MagicLinkCode record on success, or null on failure.
     * On failure, the attempts counter is incremented; on the 10th failure the code
     * is immediately invalidated.
     */
    public function verifyCode(User $user, string $submitted): ?MagicLinkCode
    {
        $hash = hash('sha256', strtoupper(trim($submitted)));

        $record = MagicLinkCode::where('user_id', $user->id)
            ->where('code', $hash)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            // Increment attempts on the most recent active code (brute-force guard)
            $active = MagicLinkCode::where('user_id', $user->id)
                ->whereNull('used_at')
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if ($active) {
                $active->increment('attempts');

                if ($active->attempts >= 10) {
                    $active->update(['used_at' => now()]);
                }
            }

            return null;
        }

        if ($record->attempts >= 10) {
            $record->update(['used_at' => now()]);
            return null;
        }

        // Mark as used
        $record->update(['used_at' => now()]);

        return $record;
    }

    private function generateCode(): string
    {
        $chars = self::CODE_CHARS;
        $code = '';
        for ($i = 0; $i < self::CODE_LENGTH; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        return $code;
    }
}

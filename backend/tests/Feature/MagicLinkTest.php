<?php

namespace Tests\Feature;

use App\Mail\MagicLinkMail;
use App\Models\MagicLinkCode;
use App\Models\User;
use App\Services\MagicLinkService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class MagicLinkTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Bypass HCaptcha validation — we test magic-link logic, not captcha itself
        $this->withoutMiddleware(\App\Http\Middleware\CaptchaVerification::class);
    }

    // -------------------------------------------------------------------------
    // Registration
    // -------------------------------------------------------------------------

    public function test_registration_requires_name_email_and_email_confirmation(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name'    => 'Alice',
            'email'   => 'alice@example.com',
            // missing email_confirmation
            'captcha' => 'test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email_confirmation']);
    }

    public function test_registration_rejects_mismatched_email_confirmation(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name'               => 'Alice',
            'email'              => 'alice@example.com',
            'email_confirmation' => 'different@example.com',
            'captcha'            => 'test',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email_confirmation']);
    }

    public function test_registration_sends_magic_link_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name'               => 'Alice',
            'email'              => 'alice@example.com',
            'email_confirmation' => 'alice@example.com',
            'captcha'            => 'test',
        ]);

        $response->assertStatus(201);
        $response->assertJson(['status' => 'code_sent']);

        Mail::assertSent(MagicLinkMail::class, function ($mail) {
            return $mail->hasTo('alice@example.com');
        });
    }

    public function test_registration_does_not_require_password(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/register', [
            'name'               => 'Alice',
            'email'              => 'alice@example.com',
            'email_confirmation' => 'alice@example.com',
            'captcha'            => 'test',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'alice@example.com']);
    }

    public function test_registration_user_is_not_authenticated_after_registration(): void
    {
        Mail::fake();

        $this->postJson('/api/register', [
            'name'               => 'Alice',
            'email'              => 'alice@example.com',
            'email_confirmation' => 'alice@example.com',
            'captcha'            => 'test',
        ]);

        $this->assertGuest();
    }

    public function test_registration_creates_magic_link_code_in_db(): void
    {
        Mail::fake();

        $this->postJson('/api/register', [
            'name'               => 'Alice',
            'email'              => 'alice@example.com',
            'email_confirmation' => 'alice@example.com',
            'captcha'            => 'test',
        ]);

        $user = User::where('email', 'alice@example.com')->first();
        $this->assertNotNull($user);
        $this->assertDatabaseHas('magic_link_codes', ['user_id' => $user->id]);
    }

    // -------------------------------------------------------------------------
    // Login
    // -------------------------------------------------------------------------

    public function test_login_requires_only_email(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/login', []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
    }

    public function test_login_sends_code_email_for_existing_user(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'bob@example.com']);

        $response = $this->postJson('/api/login', ['email' => 'bob@example.com']);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'code_sent']);

        Mail::assertSent(MagicLinkMail::class, fn ($m) => $m->hasTo('bob@example.com'));
    }

    public function test_login_returns_code_sent_for_nonexistent_user_to_prevent_enumeration(): void
    {
        Mail::fake();

        $response = $this->postJson('/api/login', ['email' => 'nobody@example.com']);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'code_sent']);
        Mail::assertNothingSent();
    }

    public function test_login_does_not_authenticate_the_user(): void
    {
        Mail::fake();
        User::factory()->create(['email' => 'bob@example.com']);

        $this->postJson('/api/login', ['email' => 'bob@example.com']);

        $this->assertGuest();
    }

    // -------------------------------------------------------------------------
    // Verify-code endpoint (POST /api/auth/verify-code)
    // -------------------------------------------------------------------------

    public function test_verify_code_authenticates_user_with_valid_code(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'carol@example.com']);
        $service = app(MagicLinkService::class);
        $plainCode = $service->sendCode($user);

        $response = $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => $plainCode,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertAuthenticatedAs($user);
    }

    public function test_verify_code_rejects_wrong_code(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'carol@example.com']);
        $service = app(MagicLinkService::class);
        $service->sendCode($user);

        $response = $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => 'XXXXXX',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['error' => 'invalid_code']);
        $this->assertGuest();
    }

    public function test_verify_code_rejects_expired_code(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'carol@example.com']);

        // Create an expired code
        $expired = MagicLinkCode::create([
            'user_id'    => $user->id,
            'code'       => hash('sha256', 'ABCDEF'),
            'expires_at' => now()->subMinutes(1),
        ]);

        $response = $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => 'ABCDEF',
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    public function test_verify_code_rejects_already_used_code(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'carol@example.com']);

        MagicLinkCode::create([
            'user_id'    => $user->id,
            'code'       => hash('sha256', 'ABCDEF'),
            'expires_at' => now()->addMinutes(15),
            'used_at'    => now(),
        ]);

        $response = $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => 'ABCDEF',
        ]);

        $response->assertStatus(422);
    }

    public function test_verify_code_is_case_insensitive(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'carol@example.com']);

        // Store uppercase hash
        MagicLinkCode::create([
            'user_id'    => $user->id,
            'code'       => hash('sha256', 'ABCDEF'),
            'expires_at' => now()->addMinutes(15),
        ]);

        // Submit lowercase
        $response = $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => 'abcdef',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
    }

    public function test_verify_code_invalidates_after_10_wrong_attempts(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'carol@example.com']);
        $service = app(MagicLinkService::class);
        $plainCode = $service->sendCode($user);

        // 9 wrong attempts
        for ($i = 0; $i < 9; $i++) {
            $this->postJson('/api/auth/verify-code', [
                'email' => 'carol@example.com',
                'code'  => 'XXXXXX',
            ])->assertStatus(422);
        }

        // 10th wrong attempt invalidates the code
        $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => 'XXXXXX',
        ])->assertStatus(422);

        // Now the correct code should also fail (code is invalidated)
        $response = $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => $plainCode,
        ]);

        $response->assertStatus(422);
        $this->assertGuest();
    }

    public function test_verify_code_marks_email_as_verified(): void
    {
        Mail::fake();
        $user = User::factory()->unverified()->create(['email' => 'carol@example.com']);
        $this->assertNull($user->email_verified_at);

        $service = app(MagicLinkService::class);
        $plainCode = $service->sendCode($user);

        $this->postJson('/api/auth/verify-code', [
            'email' => 'carol@example.com',
            'code'  => $plainCode,
        ])->assertStatus(200);

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    // -------------------------------------------------------------------------
    // GET /auth/verify (clickable email link)
    // -------------------------------------------------------------------------

    public function test_verify_link_redirects_to_verify_code_page(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'dave@example.com']);
        $service = app(MagicLinkService::class);
        $plainCode = $service->sendCode($user);

        $response = $this->get('/auth/verify?code=' . $plainCode . '&email=dave%40example.com');

        // Should redirect to verify-code page with code and email parameters
        $response->assertRedirect('/verify-code?code=' . $plainCode . '&email=dave%40example.com');
        // User is not authenticated yet (will be authenticated by frontend via API)
        $this->assertGuest();
    }

    public function test_verify_link_redirects_to_verify_code_even_with_invalid_code(): void
    {
        $response = $this->get('/auth/verify?code=XXXXXX&email=nobody%40example.com');

        // Should redirect to verify-code page (frontend will handle the error)
        $response->assertRedirect('/verify-code?code=XXXXXX&email=nobody%40example.com');
        $this->assertGuest();
    }

    // -------------------------------------------------------------------------
    // Resend-code endpoint (POST /api/auth/resend-code)
    // -------------------------------------------------------------------------

    public function test_resend_code_sends_new_code_and_invalidates_old(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'eve@example.com']);
        $service = app(MagicLinkService::class);
        $service->sendCode($user);

        $this->assertEquals(1, MagicLinkCode::where('user_id', $user->id)->whereNull('used_at')->count());

        $response = $this->postJson('/api/auth/resend-code', ['email' => 'eve@example.com']);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'code_sent']);

        // Old code was invalidated, only the new one is active
        $this->assertEquals(1, MagicLinkCode::where('user_id', $user->id)->whereNull('used_at')->count());

        Mail::assertSent(MagicLinkMail::class);
    }

    public function test_resend_code_is_rate_limited(): void
    {
        Mail::fake();
        $user = User::factory()->create(['email' => 'eve@example.com']);

        // Allow 3 requests then expect 429
        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/auth/resend-code', ['email' => 'eve@example.com'])
                 ->assertStatus(200);
        }

        $this->postJson('/api/auth/resend-code', ['email' => 'eve@example.com'])
             ->assertStatus(429);
    }

    // -------------------------------------------------------------------------
    // MagicLinkService unit-style tests
    // -------------------------------------------------------------------------

    public function test_service_generates_6_char_uppercase_code(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $service = app(MagicLinkService::class);

        $code = $service->sendCode($user);

        $this->assertMatchesRegularExpression('/^[A-Z0-9]{6}$/', $code);
    }

    public function test_service_stores_hash_not_plaintext(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $service = app(MagicLinkService::class);

        $plainCode = $service->sendCode($user);
        $record = MagicLinkCode::where('user_id', $user->id)->latest()->first();

        $this->assertNotEquals($plainCode, $record->code);
        $this->assertEquals(hash('sha256', $plainCode), $record->code);
    }

    public function test_service_invalidates_previous_code_on_resend(): void
    {
        Mail::fake();
        $user = User::factory()->create();
        $service = app(MagicLinkService::class);

        $service->sendCode($user);
        $this->assertEquals(1, MagicLinkCode::where('user_id', $user->id)->whereNull('used_at')->count());

        $service->sendCode($user);
        $this->assertEquals(1, MagicLinkCode::where('user_id', $user->id)->whereNull('used_at')->count());
    }
}

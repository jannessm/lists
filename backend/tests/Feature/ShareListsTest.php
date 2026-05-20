<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use App\Models\User;
use App\Models\Lists;
use App\Notifications\ShareListsNotification;

class ShareListsTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that an unauthenticated user can access the share confirmation link
     * and is redirected to login with pending invitation stored in session.
     */
    public function test_unauthenticated_user_can_access_share_link(): void
    {
        // Create a user and a list
        $owner = User::factory()->create();
        $list = Lists::factory()->create(['created_by' => $owner->id, 'name' => 'Test List']);
        
        // Create a recipient email
        $recipientEmail = 'recipient@example.com';
        
        // Generate a signed URL for the invitation
        $notification = new ShareListsNotification($list->id);
        $notifiable = new \stdClass();
        $notifiable->email = $recipientEmail;
        $url = $notification->confirmationUrl($notifiable);
        
        // Access the URL without authentication
        $response = $this->get($url);
        
        // Should redirect to login
        $response->assertRedirect('/login');
        
        // Check that invitation is stored in session
        $this->assertTrue(session()->has('pending_list_invitation'));
        $invitation = session()->get('pending_list_invitation');
        $this->assertEquals($list->id, $invitation['list_id']);
        $this->assertEquals($recipientEmail, $invitation['email']);
    }

    /**
     * Test that an authenticated user can directly confirm the invitation.
     */
    public function test_authenticated_user_can_confirm_invitation(): void
    {
        // Create owner and list
        $owner = User::factory()->create();
        $list = Lists::factory()->create(['created_by' => $owner->id, 'name' => 'Test List']);
        
        // Create recipient user
        $recipient = User::factory()->create();
        
        // Generate a signed URL for the invitation
        $notification = new ShareListsNotification($list->id);
        $url = $notification->confirmationUrl($recipient);
        
        // Access the URL as authenticated user
        $response = $this->actingAs($recipient)->get($url);
        
        // Should redirect successfully
        $response->assertRedirect('');
        
        // User should now have access to the list
        $this->assertTrue($recipient->hasAccessToLists($list->id));
    }

    /**
     * Test that pending invitation is confirmed after login.
     */
    public function test_pending_invitation_confirmed_after_login(): void
    {
        // Create owner and list
        $owner = User::factory()->create();
        $list = Lists::factory()->create(['created_by' => $owner->id, 'name' => 'Test List']);
        
        // Create recipient user
        $recipient = User::factory()->create();
        
        // Store pending invitation in session
        $this->session([
            'pending_list_invitation' => [
                'list_id' => $list->id,
                'email' => $recipient->email,
                'hash' => sha1($list->name)
            ]
        ]);
        
        // Simulate login by calling the login response
        $request = \Illuminate\Http\Request::create('/login', 'POST');
        $request->setLaravelSession(session());
        $request->setUserResolver(function () use ($recipient) {
            return $recipient;
        });
        
        // Trigger login response manually
        $loginResponse = app(\Laravel\Fortify\Contracts\LoginResponse::class);
        $loginResponse->toResponse($request);
        
        // User should now have access to the list
        $this->assertTrue($recipient->hasAccessToLists($list->id));
        
        // Session should be cleared
        $this->assertFalse(session()->has('pending_list_invitation'));
    }
}

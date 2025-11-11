<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Laravel\Fortify\Contracts\EmailVerificationNotificationSentResponse;

use App\Models\Lists;

class ShareListsController extends Controller
{
    /**
     * Confirm share lists invitation.
     * 
     * Can be called by authenticated or unauthenticated users.
     * If unauthenticated, stores the invitation and redirects to login.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function confirm(Request $request, String $id, Response $response)
    {
        $user = $request->user();
        
        // If user is authenticated
        if ($user) {
            if ($user->hasAccessToLists($id) || 
                $user->confirmShareLists($id)
            ) {
                return redirect()->intended('');
            }
            return $response->setStatusCode(400);
        }
        
        // If user is not authenticated, store invitation in session and redirect to login
        $email = $request->query('email');
        
        if ($email) {
            // Store the pending invitation in session
            $request->session()->put('pending_list_invitation', [
                'list_id' => $id,
                'email' => $email,
                'hash' => $request->query('hash')
            ]);
            
            // Redirect to login page
            return redirect('/login?message=Please login to accept the list invitation');
        }
        
        return $response->setStatusCode(400);
    }

    public function unshare(Request $request, String $lists_id, Response $response) {
        $request->user()->unshareLists($lists_id, $request->input('user'));

        return $response->setStatusCode(201);
    }

    /**
     * Send a share lists verification notification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, String $id)
    {
        // if ($request->user()->hasVerifiedEmail()) {
        //     return new JsonResponse('', 204);
        // }

        $recipient = json_decode($request->getContent())->email;

        $request->user()->sendShareEmailNotification($id, $recipient);

        return '';
    }
}

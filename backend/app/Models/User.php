<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\HasApiTokens;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

class User extends Authenticatable implements MustVerifyEmail {
    use HasApiTokens, HasFactory, Notifiable, HasUlids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'theme'
    ];
    
    /**
     * default values
     * 
     * @var array
     */
    protected $attributes = [
        '_deleted' => false,
        'theme' => 'auto'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        '_deleted' => 'boolean'
    ];

    public function lists(): BelongsToMany {
        return $this->belongsToMany(Lists::class);
    }

    // public function pushResolver($_, $args) {
    //     $upserts = [];
    //     $conflicts = [];

    //     foreach($args['usersPushRow'] as $user) {
    //         $newState = $user['newDocumentState'];
    //         $assumedMaster = $user['assumedMasterState'];
    //         $masterUser = NULL;

    //         $newState['user_id'] = $newState['user']['id'];
    //         unset($newState['user']);
    //         $assumedMaster['user_id'] = $assumedMaster['user']['id'];
    //         unset($assumedMaster['user']);
            
    //         if (array_key_exists($this->primaryKey, $assumedMaster)) {
    //             $masterUser = User::find($assumedMaster[$this->primaryKey]);
    //         }

    //         # record not found => new Instance
    //         if (!$masterUser) {
    //             array_push($upserts, ['new' => $newState, 'old' => null]);
            
    //         # $masterUser != Null
    //         } else {
    //             $conflict = FALSE;
    //             foreach ($assumedMaster as $param => $val) {
    //                 if ($masterUser[$param] != $val && $param != 'user') {
    //                     array_push($conflicts, $masterUser);
    //                     $conflict = TRUE;
    //                     break;
    //                 }
    //             }

    //             if (!$conflict) {
    //                 array_push($upserts, ['new' => $newState, 'old' => $masterUser]);
    //             }
    //         }
    //     }

    //     if (count($upserts) > 0) {
    //         User::upsert($upserts, ["id"]);
    //         $ids = array_column($upserts, 'id');
    //         $updatedUsers = User::whereIn('id', $ids)->orderBy('updated_at')->get()->all();
    //         Subscription::broadcast('streamUsers', $updatedUsers);
    //     }

    //     return $conflicts;
    // }

    public function pushMeResolver($_, $args) {
        $upserts = [];
        $conflicts = [];

        foreach($args['mePushRow'] as $user) {
            $newState = $user['newDocumentState'];
            $assumedMaster = $user['assumedMasterState'];
            $masterUser = NULL;
            
            if ($newState[$this->primaryKey] !== Auth::id()) {
                throw new ErrorException('cannot push other users than me');
            }

            $masterUser = User::find($assumedMaster[$this->primaryKey]);
            
            $conflict = FALSE;
            foreach ($assumedMaster as $param => $val) {
                if ($masterUser[$param] != $val) {
                    array_push($conflicts, $masterUser);
                    $conflict = TRUE;
                    break;
                }
            }

            if (!$conflict) {
                $newState['password'] = $masterUser->password;
                array_push($upserts, ['new' => $newState, 'master' => $masterUser]);
            }
        }

        if (count($upserts) > 0) {
            $newStates = array_column($upserts, 'new');
            User::upsert($newStates, ['id']);
            $ids = array_column($newStates, 'id');
            $updatedMe = User::whereIn('id', $ids)->orderBy('updated_at')->get()->all();
            Subscription::broadcast('streamMe', $updatedMe);

            foreach($upserts as $key => $state) {
                if ($state['new']['email'] !== $state['master']['email']) {
                    $updatedMe[$key]->sendEmailVerificationNotification();
                }
            }
        }

        return $conflicts;
    }

}

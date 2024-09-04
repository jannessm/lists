<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\HasApiTokens;
use NotificationChannels\WebPush\HasPushSubscriptions;

use Illuminate\Support\Facades\DB;
use Nuwave\Lighthouse\Execution\Utils\Subscription;

use App\CanShareLists;
use App\WebPush\HasPushSettings;

class User extends Authenticatable implements MustVerifyEmail, CanResetPassword {
    use HasApiTokens,
        HasFactory,
        Notifiable,
        HasUlids,
        CanShareLists,
        HasPushSubscriptions,
        HasPushSettings;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'theme',
        'default_list'
    ];
    
    /**
     * default values
     * 
     * @var array
     */
    protected $attributes = [
        '_deleted' => false,
        'theme' => 'auto',
        'default_list' => null
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

    public function createdLists(): HasMany {
        return $this->hasMany(Lists::class, 'created_by');
    }

    public function sharedLists(): BelongsToMany {
        return $this->belongsToMany(Lists::class, 'lists_user');
    }

    public function lists() {
        return $this->createdLists->merge($this->sharedLists);
    }

    public function listItems() {
        $lists = $this->lists()->select('id')->all();
        $listsIds = array_column($lists, 'id');
        return ListItem::whereIn('lists_id', $listsIds);
    }

    public function friends() {
        $users = $this->lists()->map(function ($val) {
            return $val->users();
        })->flatten()->unique('id')
        ->filter(function ($val, $key) {
            return $val->id !== Auth::id();
        });
        return $users;
    }

    public function pushMeResolver($_, $args) {
        $upserts = [];
        $conflicts = [];

        foreach($args['rows'] as $user) {
            $newState = $user['newDocumentState'];
            $assumedMaster = $user['assumedMasterState'];
            $masterUser = NULL;
            
            if ($newState[$this->primaryKey] !== Auth::id()) {
                throw new ErrorException('cannot push other users than me');
            }

            $masterUser = User::find($assumedMaster[$this->primaryKey]);
            
            $conflict = FALSE;
            foreach ($assumedMaster as $param => $val) {
                // compare timestamps
                if (in_array($param, ["created_at", "updated_at"])) {
                    $conflict = $masterUser[$param]->ne($val);
                } else if ($masterUser[$param] != $val) {
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
        }

        return $conflicts;
    }

}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
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

    public function pushResolver($_, $args) {
        $upserts = [];
        $conflicts = [];

        foreach($args['usersPushRow'] as $task) {
            $newState = $task['newDocumentState'];
            $assumedMaster = $task['assumedMasterState'];
            $masterTask = NULL;

            $newState['user_id'] = $newState['user']['id'];
            unset($newState['user']);
            $assumedMaster['user_id'] = $assumedMaster['user']['id'];
            unset($assumedMaster['user']);
            
            if (array_key_exists($this->primaryKey, $assumedMaster)) {
                $masterTask = Task::find($assumedMaster[$this->primaryKey]);
            }

            # record not found => new Instance
            if (!$masterTask) {
                array_push($upserts, $newState);
            
            # $masterTask != Null
            } else {
                $conflict = FALSE;
                foreach ($assumedMaster as $param => $val) {
                    if ($masterTask[$param] != $val && $param != 'user') {
                        array_push($conflicts, $masterTask);
                        $conflict = TRUE;
                        break;
                    }
                }

                if (!$conflict) {
                    array_push($upserts, $newState);
                }
            }
        }

        if (count($upserts) > 0) {
            Task::upsert($upserts, ["id"]);
            $ids = array_column($upserts, 'id');
            $updatedTasks = Task::whereIn('id', $ids)->orderBy('updated_at')->get()->all();
            Subscription::broadcast('streamTasks', $updatedTasks);
        }

        return $conflicts;
    }

    public function pushMeResolver($_, $args) {
        $upserts = [];
        $conflicts = [];

        foreach($args['mesPushRow'] as $user) {
            if ($user[$this->primaryKey] !== Auth::id()) {
                continue;
            }

            $newState = $user['newDocumentState'];
            $assumedMaster = $user['assumedMasterState'];
            $masterTask = NULL;
            
            $masterTask = User::find($assumedMaster[$this->primaryKey]);
            
            $conflict = FALSE;
            foreach ($assumedMaster as $param => $val) {
                if ($masterTask[$param] != $val && $param != 'user') {
                    array_push($conflicts, $masterTask);
                    $conflict = TRUE;
                    break;
                }
            }

            if (!$conflict) {
                array_push($upserts, $newState);
            }
        }

        if (count($upserts) > 0) {
            User::upsert($upserts, ["id"]);
            $ids = array_column($upserts, 'id');
            $updatedTasks = User::whereIn('id', $ids)->orderBy('updated_at')->get()->all();
            Subscription::broadcast('streamMe', $updatedTasks);
        }

        return $conflicts;
    }

}

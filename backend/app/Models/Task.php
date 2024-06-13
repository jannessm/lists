<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\Utils\Subscription;

class Task extends Model
{
    use HasFactory, HasUlids;

    /**
     * default values
     * 
     * @var array
     */
    protected $attributes = [
        '_deleted' => false,
        'done' => false,
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'done',
        'user_id'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'done' => 'boolean',
        '_deleted' => 'boolean'
    ];

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function pushResolver($_, $args) {
        $upserts = [];
        $conflicts = [];

        foreach($args['tasksPushRow'] as $task) {
            $newState = $task['newDocumentState'];
            $assumedMaster = $task['assumedMasterState'];
            $masterTask = NULL;

            # set user_id if not exists
            if (!array_key_exists('user', $newState)) {
                $newState['user'] = ['id' => Auth::id()];
            }

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
}

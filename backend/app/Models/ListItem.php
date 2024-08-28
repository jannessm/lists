<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;

use Nuwave\Lighthouse\Execution\Utils\Subscription;

class ListItem extends Model
{
    use HasFactory, HasUlids;

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'done' => false,
        '_deleted' => false,
    ];

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = [];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'reminder' => 'datetime',
        'due' => 'datetime',
        'done' => 'boolean',
        '_deleted' => 'boolean'
    ];

    public function lists(): BelongsTo {
        return $this->belongsTo(Lists::class);
    }

    public function createdBy(): BelongsTo {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function pushResolver($_, $args) {
        $user = Auth::user();

        $upserts = [];
        $conflicts = [];

        foreach($args['rows'] as $item) {
            $conflict = FALSE;
            $newState = $item['newDocumentState'];

            if (array_key_exists('assumedMasterState', $item)) {
                $assumedMaster = $item['assumedMasterState'];
                $masterItem = ListItem::find($assumedMaster[$this->primaryKey]);

                foreach ($assumedMaster as $param => $val) {
                    switch($param) {
                        case "createdBy":
                        case "lists":
                            $conflict = $masterItem[$param]->id !== $val['id'];
                            break;
                        case "created_at":
                        case "updated_at":
                            $conflict = False; // ignore timestamps since they are only set by backend
                            break;
                        case "due":
                        case "reminder":
                            if (!!$val && !!$masterItem[$param]) {
                                $conflict = !$val->eq($masterItem[$param]);
                                break;
                            }
                        default:
                            $conflict = $masterItem[$param] !== $val;
                    }

                    if ($conflict) {
                        array_push($conflicts, $masterItem);
                        break;
                    }
                }
            } else {
                $newState['createdBy'] = ["id" => $user->id];
            }

            if (!$conflict) {
                $newState['created_by'] = $newState['createdBy']['id'];
                $newState['lists_id'] = $newState['lists']['id'];
                unset($newState['createdBy']);
                unset($newState['lists']);
                unset($newState['created_at']);
                unset($newState['updated_at']);
                array_push($upserts, $newState);
            }
        }

        if (count($upserts) > 0) {
            ListItem::upsert($upserts, ['id']);
            $ids = array_column($upserts, 'id');
            $updatedItems = ListItem::whereIn('id', $ids)->orderBy('updated_at')->get()->all();
            Subscription::broadcast('streamItems', $updatedItems);

            foreach($updatedItems as $updatedItem) {
                foreach($args['rows'] as $item) {
                    if ($updatedItem->id === $item['newDocumentState']['id']) {
                        $otherUsers = $updatedItem->lists
                            ->users()
                            ->whereNotIn('id', [$user->id]);
                        $notification = ListsChanged::fromPushRow($item);
                        
                        Notification::send($otherUsers, $notification);
                        break;
                    }
                }
            }
        }

        return $conflicts;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

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

        foreach($args['listItemPushRow'] as $item) {
            $conflict = FALSE;
            $newState = $item['newDocumentState'];

            if (array_key_exists('assumedMasterState', $item)) {
                $assumedMaster = $item['assumedMasterState'];
                $masterItem = Lists::find($assumedMaster[$this->primaryKey]);

                foreach ($assumedMaster as $param => $val) {
                    if ($masterItem[$param] != $val) {
                        array_push($conflicts, $masterItem);
                        $conflict = TRUE;
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
                array_push($upserts, $newState);
            }
        }

        if (count($upserts) > 0) {
            ListItem::upsert($upserts, ['id']);
            $ids = array_column($upserts, 'id');
            $updatedItems = ListItems::whereIn('id', $ids)->orderBy('updated_at')->get()->all();
            Subscription::broadcast('streamLists', $updatedItems);
        }

        return $conflicts;
    }
}

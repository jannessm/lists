<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use Illuminate\Support\Facades\Auth;
use Nuwave\Lighthouse\Execution\Utils\Subscription;


class Lists extends Model
{
    use HasFactory, HasUlids;

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'is_shopping_list' => false,
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
        'is_shopping_list' => 'boolean',
        '_deleted' => 'boolean'
    ];

    public function items(): HasMany {
        return $this->hasMany(ListItem::class);
    }

    public function sharedWith(): BelongsToMany {
        return $this->belongsToMany(User::class);
    }

    public function createdBy(): BelongsTo {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function users() {
        return collect([$this->createdBy])->merge($this->sharedWith);
    }

    public function pushResolver($_, $args) {
        $user = Auth::user();

        $upserts = [];
        $conflicts = [];

        foreach($args['listsPushRow'] as $list) {
            $conflict = FALSE;
            $newState = $list['newDocumentState'];

            if (array_key_exists('assumedMasterState', $list)) {
                $assumedMaster = $list['assumedMasterState'];
                $masterList = Lists::find($assumedMaster[$this->primaryKey]);

                foreach ($assumedMaster as $param => $val) {

                    switch($param) {
                        case "createdBy":
                            $conflict = $masterList[$param]->id !== $val['id'];
                            break;
                        case "sharedWith":
                            $ids = array_column($val, 'id');
                            $conflict = array_reduce($masterList[$param],
                                function ($carry, $item) use ($ids) {
                                    return in_array($item['id'], $ids) && $carry;
                                }, true);
                            break;
                        case "created_at":
                        case "updated_at":
                            $conflict = $masterList[$param]->ne($val);
                            break;
                        default:
                            $conflict = $masterList[$param] !== $val;
                    }

                    if ($conflict) {
                        array_push($conflicts, $masterList);
                        break;
                    }
                }
            } else {
                $newState['createdBy'] = ["id" => $user->id];
            }

            if (!$conflict) {
                $newState['created_by'] = $newState['createdBy']['id'];
                unset($newState['createdBy']);
                unset($newState['sharedWith']);
                array_push($upserts, $newState);
            }
        }

        if (count($upserts) > 0) {
            Lists::upsert($upserts, ['id']);
            $ids = array_column($upserts, 'id');
            $updatedLists = Lists::whereIn('id', $ids)->orderBy('updated_at')->get()->all();
            Subscription::broadcast('streamLists', $updatedLists);
        }

        return $conflicts;
    }
}

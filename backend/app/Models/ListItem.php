<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Support\Facades\Auth;

use App\Events\ListItemChanged;

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

    public function localeDueTime($format) {
        return $this->due->setTimezone($this->timezone)->format($format);
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
                        case "description":
                            if (!!$val) {
                                $conflict = $masterItem[$param] !== $val;
                            } else {
                                $conflict = !$val !== !$masterItem[$param];
                            }
                            break;
                        case "due":
                        case "reminder":
                            if (!!$val && !!$masterItem[$param]) {
                                $conflict = !$val->eq($masterItem[$param]);
                                break;
                            } else {
                                $conflict = $masterItem[$param] !== $val;
                            }
                        default:
                            $conflict = $masterItem[$param] !== $val;
                    }

                    if ($conflict) {
//                        var_dump($param, $val, $masterItem[$param], !$val, !$masterItem[$param]);
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

                // check if name exceeds limit split it
                $newState = ListItem::splitName($newState);

                array_push($upserts, $newState);
            }
        }

        if (count($upserts) > 0) {
            ListItem::upsert($upserts, ['id']);
            $ids = array_column($upserts, 'id');
            $updatedItems = ListItem::whereIn('id', $ids)->orderBy('updated_at')->get()->all();

            ListItemChanged::dispatch($updatedItems, $args['rows'], $user);
        }

        return $conflicts;
    }

    static public function splitName($newState, $max_len=50) {
        $parts = explode(' ', $newState['name']);
        $newName = [];
        $newNameLen = -1; // first has no space in front
        $newDescription = [];
        $was_domain = false;
        foreach ($parts as $part) {
            $parsed = parse_url($part);
            $is_valid_url = !!$parsed && array_key_exists('host', $parsed);

            // if $part is url and no domain was parsed yet ($was_domain) => set host as name
            // and move the url to the description
            if (!$was_domain && $is_valid_url && count($newName) === 0) {
                array_push($newName, substr($parsed['host'], 0, $max_len));
                array_push($newDescription, $part);
                $was_domain = true;

            // if $part is url and there is name parts move url to description
            } elseif (!$was_domain && $is_valid_url) {
                array_push($newDescription, $part);
                $was_domain = true;

            // if $part is no url and adding it to the previous name parts is still valid
            } elseif (!$was_domain && $newNameLen + strlen($part) + 1 <= $max_len) {
                array_push($newName, $part);
                $newNameLen += strlen($part) + 1;

            // else add $part to the description
            } else {
                array_push($newDescription, $part);
            }
        }

        $newState['name'] = join(' ', $newName);

        $newDescriptionJoined = join(' ', $newDescription);
        $newDescription = [];
        if (strlen($newDescriptionJoined) > 0) {
            array_push($newDescription, $newDescriptionJoined);
        }
        if (!!$newState['description'] && strlen($newState['description']) > 0) {
            array_push($newDescription, $newState['description']);
        }
        $newState['description'] = join("\n\n", $newDescription);

        return $newState;
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Illuminate\Support\Facades\Auth;

use NotificationChannels\WebPush\PushSubscription;

class PushSettings extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'receive_push',
        'receive_lists_changed',
        'receive_reminder',
        'user_id',
        'push_subscription_id'
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'receive_push' => true,
        'receive_lists_changed' => true,
        'receive_reminder' => true,
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'receive_push' => 'boolean',
        'receive_lists_changed' => 'boolean',
        'receive_reminder' => 'boolean',
    ];

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function pushSubscription(): BelongsTo {
        return $this->belongsTo(PushSubscription::class);
    }

    public function pushResolver($_, $args) {
        $user = Auth::user();

        $settings = $user->getPushSettings($args['settings']['endpoint']);

        if (!$settings) {
            return null;
        }

        $settings->fill([
            'receive_push' => $args['settings']['receivePush'],
            'receive_lists_changed' => $args['settings']['receiveListsChanged'],
            'receive_reminder' => $args['settings']['receiveReminder'],
        ]);
        $settings->save();
        return $settings;
    }

    public function queryResolver($_, $args) {
        $user = Auth::user();

        if($args['endpoint']) {
            $settings = $user->getPushSettings($args['endpoint']);

            if (!!$settings) {
                return $settings;
            }

            $pushSubscription = $user->getPushSubscription($args['endpoint']);

            if ($pushSubscription) {
                return PushSettings::create([
                    'user_id' => $user->id,
                    'push_subscription_id' => $pushSubscription->id
                ]);
            }
        }

        return null;
    }
}

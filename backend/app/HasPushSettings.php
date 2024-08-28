<?php

namespace App;

use Illuminate\Database\Eloquent\Relations\HasMany;

use App\Models\PushSettings;

trait HasPushSettings
{
    public function allPushSettings() {
        return $this->hasMany(PushSettings::class);
    }
    
    public function getPushSettings(String $endpoint) {
        return $this->allPushSettings->filter(
            function ($item) use ($endpoint) {
                return $item->pushSubscription->endpoint === $endpoint;
            }
        )->first();
    }

    public function getPushSubscription(String $endpoint) {
        foreach($this->pushSubscriptions as $sub) {
            if ($sub->endpoint === $endpoint) {
                return $sub;
            }
        }
        return null;
    }
}

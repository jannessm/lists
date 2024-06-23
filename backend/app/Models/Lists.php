<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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
        return $this->belongsTo(User::class);
    }
}

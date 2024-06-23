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

    public function created_by(): BelongsTo {
        return $this->belongsTo(User::class);
    }
}

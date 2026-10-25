<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Author extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'bio',
        'avatar',
        'is_default',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
        ];
    }

    /**
     * The "booted" method of the model.
     * Enforce that at most one author can be set as default.
     */
    protected static function booted(): void
    {
        static::saving(function (Author $author) {
            if ($author->is_default) {
                // Remove default status from all other authors
                static::where('id', '!=', $author->id ?? 0)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }
        });
    }

    public function books(): HasMany
    {
        return $this->hasMany(Book::class);
    }
}

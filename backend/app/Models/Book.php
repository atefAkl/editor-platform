<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'subtitle',
        'slug',
        'description',
        'introduction',
        'author_id',
        'declared_publication_date',
        'cover_image_path',
        'book_file_path',
        'book_file_type',
        'book_file_size',
        'workflow_status',
        'publication_status',
        'created_by',
        'published_by',
        'published_at',
        'cancelled_by',
        'cancelled_at',
        'last_content_updated_at',
        'copied_from_book_id',
    ];

    protected function casts(): array
    {
        return [
            'declared_publication_date' => 'date',
            'published_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'last_content_updated_at' => 'datetime',
            'book_file_size' => 'integer',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(Author::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function publisher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function copiedFrom(): BelongsTo
    {
        return $this->belongsTo(Book::class, 'copied_from_book_id');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(BookReview::class)->orderBy('created_at', 'desc');
    }

    public function publicationHistory(): HasMany
    {
        return $this->hasMany(BookPublicationHistory::class)->orderBy('created_at', 'desc');
    }

    /**
     * Scope query to only books that are publicly visible according to platform rules.
     */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query->where('workflow_status', 'approved')
                     ->where('publication_status', 'published');
    }
}

<?php

namespace App\Services;

use App\Models\Author;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthorService
{
    /**
     * Set an author as default inside an atomic transaction with row locking
     * to safely prevent concurrency race conditions.
     */
    public function setAsDefault(Author $author): Author
    {
        return DB::transaction(function () use ($author) {
            // Lock authors table records to prevent race conditions
            Author::where('is_default', true)
                ->lockForUpdate()
                ->update(['is_default' => false]);

            $author->is_default = true;
            $author->save();

            return $author;
        });
    }

    /**
     * Get the current default author, or the earliest active author if none marked.
     */
    public function getDefaultAuthor(): ?Author
    {
        return Author::where('is_default', true)->first()
            ?? Author::orderBy('id', 'asc')->first();
    }
}

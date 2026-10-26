<?php

namespace App\Services;

use App\Models\Book;
use App\Models\User;
use App\Exceptions\InvalidWorkflowTransitionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookService
{
    /**
     * Monitored content fields that trigger demotion to draft if changed on a published/approved book.
     */
    protected array $contentFields = [
        'title',
        'subtitle',
        'description',
        'introduction',
        'category',
        'author_id',
        'declared_publication_date',
        'cover_image_path',
        'book_file_path',
    ];

    /**
     * Create a new draft book record.
     */
    public function createDraft(array $data, User $creator, ?UploadedFile $coverImage = null, ?UploadedFile $bookFile = null): Book
    {
        return DB::transaction(function () use ($data, $creator, $coverImage, $bookFile) {
            // Store cover image if provided
            $coverPath = null;
            if ($coverImage) {
                $coverPath = $coverImage->store('books/covers', 'public');
            }

            // Store book file if provided (stored in private local disk)
            $filePath = null;
            $fileType = null;
            $fileSize = null;
            if ($bookFile) {
                $filePath = $bookFile->store('books/files', 'local');
                $fileType = $bookFile->getMimeType();
                $fileSize = $bookFile->getSize();
            }

            // Generate unique slug
            $baseSlug = Str::slug($data['title']);
            $slug = $baseSlug ?: 'book';
            $counter = 1;
            while (Book::where('slug', $slug)->exists()) {
                $slug = ($baseSlug ?: 'book') . '-' . $counter++;
            }

            return Book::create([
                'title' => $data['title'],
                'subtitle' => $data['subtitle'] ?? null,
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'introduction' => $data['introduction'] ?? null,
                'category' => $data['category'] ?? 'novels',
                'author_id' => $data['author_id'],
                'declared_publication_date' => $data['declared_publication_date'] ?? null,
                'cover_image_path' => $coverPath,
                'book_file_path' => $filePath,
                'book_file_type' => $fileType,
                'book_file_size' => $fileSize,
                'workflow_status' => 'draft',
                'publication_status' => 'unpublished',
                'created_by' => $creator->id,
                'last_content_updated_at' => now(),
            ]);
        });
    }

    /**
     * Update an existing book with dirty content change detection.
     */
    public function updateBook(Book $book, array $data, User $actor, ?UploadedFile $newCoverImage = null, ?UploadedFile $newBookFile = null): Book
    {
        if ($book->publication_status === 'publication_cancelled') {
            throw new InvalidWorkflowTransitionException("لا يمكن تعديل كتاب أُلغي نشره نهائياً.");
        }

        return DB::transaction(function () use ($book, $data, $actor, $newCoverImage, $newBookFile) {
            // Handle new cover upload
            if ($newCoverImage) {
                $newCoverPath = $newCoverImage->store('books/covers', 'public');
                $data['cover_image_path'] = $newCoverPath;
            }

            // Handle new book file upload
            if ($newBookFile) {
                $newFilePath = $newBookFile->store('books/files', 'local');
                $data['book_file_path'] = $newFilePath;
                $data['book_file_type'] = $newBookFile->getMimeType();
                $data['book_file_size'] = $newBookFile->getSize();
            }

            // Update title & slug if title changed
            if (isset($data['title']) && $data['title'] !== $book->title) {
                $baseSlug = Str::slug($data['title']);
                $slug = $baseSlug ?: 'book';
                $counter = 1;
                while (Book::where('slug', $slug)->where('id', '!=', $book->id)->exists()) {
                    $slug = ($baseSlug ?: 'book') . '-' . $counter++;
                }
                $data['slug'] = $slug;
            }

            $book->fill($data);

            // Check if any protected content field was modified
            $hasContentChanged = $book->isDirty($this->contentFields);

            if ($hasContentChanged) {
                $book->last_content_updated_at = now();

                // If currently published or temporarily unpublished, demote to draft and unpublished
                if (in_array($book->publication_status, ['published', 'temporarily_unpublished'])) {
                    $previousPublicationStatus = $book->publication_status;
                    $book->workflow_status = 'draft';
                    $book->publication_status = 'unpublished';

                    $book->publicationHistory()->create([
                        'user_id' => $actor->id,
                        'event' => 'demoted_to_draft',
                        'previous_publication_status' => $previousPublicationStatus,
                        'new_publication_status' => 'unpublished',
                        'notes' => 'تمت إعادة الكتاب للمسودة لإجراء تعديل جوهري في المحتوى',
                        'created_at' => now(),
                    ]);
                } elseif ($book->workflow_status === 'approved') {
                    // If approved but not yet published, modify requires re-review
                    $book->workflow_status = 'draft';
                }
            }

            $book->save();

            return $book;
        });
    }
}

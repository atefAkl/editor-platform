<?php

namespace App\Services;

use App\Models\Book;
use App\Models\User;
use App\Models\BookPublicationHistory;
use App\Exceptions\InvalidWorkflowTransitionException;
use App\Exceptions\PublicationValidationException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BookWorkflowService
{
    /**
     * Submit a draft or changes-requested book for review.
     */
    public function submitForReview(Book $book, User $actor, ?string $comments = null): Book
    {
        if (!in_array($book->workflow_status, ['draft', 'changes_requested'])) {
            throw new InvalidWorkflowTransitionException("لا يمكن إرسال الكتاب للمراجعة إلا إذا كان في حالة مسودة أو بانتظار تعديلات.");
        }

        if ($book->publication_status === 'publication_cancelled') {
            throw new InvalidWorkflowTransitionException("لا يمكن مراجعة كتاب أُلغي نشره نهائياً.");
        }

        return DB::transaction(function () use ($book, $actor, $comments) {
            $isResubmission = $book->workflow_status === 'changes_requested';
            $book->workflow_status = 'in_review';
            $book->save();

            $book->reviews()->create([
                'user_id' => $actor->id,
                'action' => $isResubmission ? 'resubmitted' : 'submitted',
                'comments' => $comments,
                'created_at' => now(),
            ]);

            return $book;
        });
    }

    /**
     * Request changes on a book currently in review.
     */
    public function requestChanges(Book $book, User $actor, string $comments): Book
    {
        if ($book->workflow_status !== 'in_review') {
            throw new InvalidWorkflowTransitionException("لا يمكن طلب تعديلات إلا على كتاب قيد المراجعة حالياً.");
        }

        if (empty(trim($comments))) {
            throw new InvalidWorkflowTransitionException("يجب تقديم ملاحظات توضيحية عند طلب تعديلات على الكتاب.");
        }

        return DB::transaction(function () use ($book, $actor, $comments) {
            $book->workflow_status = 'changes_requested';
            $book->save();

            $book->reviews()->create([
                'user_id' => $actor->id,
                'action' => 'changes_requested',
                'comments' => $comments,
                'created_at' => now(),
            ]);

            return $book;
        });
    }

    /**
     * Approve a book that is currently in review.
     */
    public function approve(Book $book, User $actor, ?string $comments = null): Book
    {
        if ($book->workflow_status !== 'in_review') {
            throw new InvalidWorkflowTransitionException("لا يمكن اعتماد الكتاب إلا بعد خضوعه للمراجعة (حالة: قيد المراجعة).");
        }

        return DB::transaction(function () use ($book, $actor, $comments) {
            $book->workflow_status = 'approved';
            $book->save();

            $book->reviews()->create([
                'user_id' => $actor->id,
                'action' => 'approved',
                'comments' => $comments,
                'created_at' => now(),
            ]);

            return $book;
        });
    }

    /**
     * Publish an approved book.
     */
    public function publish(Book $book, User $actor, ?string $notes = null): Book
    {
        // 1. Workflow state validation
        if ($book->workflow_status !== 'approved') {
            throw new PublicationValidationException("لا يمكن نشر الكتاب إلا بعد اعتماده تحريرياً بالكامل.");
        }

        // 2. Publication state validation
        if (!in_array($book->publication_status, ['unpublished', 'temporarily_unpublished'])) {
            throw new InvalidWorkflowTransitionException("حالة النشر الحالية للكتاب لا تسمح بالنشر.");
        }

        // 3. Mandatory asset checks
        if (empty($book->title)) {
            throw new PublicationValidationException("يجب تحديد عنوان صالح للكتاب قبل النشر.");
        }

        if (empty($book->author_id) || !$book->author()->exists()) {
            throw new PublicationValidationException("يجب ربط الكتاب بمؤلف صالح ونشط قبل النشر.");
        }

        if (empty($book->cover_image_path) || !Storage::disk('public')->exists($book->cover_image_path)) {
            throw new PublicationValidationException("لا يمكن نشر الكتاب دون وجود صورة غلاف صالحة.");
        }

        if (empty($book->book_file_path) || !Storage::disk('local')->exists($book->book_file_path)) {
            throw new PublicationValidationException("لا يمكن نشر الكتاب دون وجود ملف كتاب صالح ومرفوع.");
        }

        return DB::transaction(function () use ($book, $actor, $notes) {
            $prevStatus = $book->publication_status;
            $isFirstPublication = empty($book->published_at);

            $book->publication_status = 'published';
            if ($isFirstPublication) {
                $book->published_at = now();
                $book->published_by = $actor->id;
            }
            $book->save();

            $book->publicationHistory()->create([
                'user_id' => $actor->id,
                'event' => $isFirstPublication ? 'published' : 'republished',
                'previous_publication_status' => $prevStatus,
                'new_publication_status' => 'published',
                'notes' => $notes,
                'created_at' => now(),
            ]);

            return $book;
        });
    }

    /**
     * Temporarily unpublish a currently published book.
     */
    public function unpublish(Book $book, User $actor, ?string $notes = null): Book
    {
        if ($book->publication_status !== 'published') {
            throw new InvalidWorkflowTransitionException("لا يمكن إيقاف النشر إلا لكتاب منشور حالياً.");
        }

        return DB::transaction(function () use ($book, $actor, $notes) {
            $prevStatus = $book->publication_status;
            $book->publication_status = 'temporarily_unpublished';
            $book->save();

            $book->publicationHistory()->create([
                'user_id' => $actor->id,
                'event' => 'temporarily_unpublished',
                'previous_publication_status' => $prevStatus,
                'new_publication_status' => 'temporarily_unpublished',
                'notes' => $notes,
                'created_at' => now(),
            ]);

            return $book;
        });
    }

    /**
     * Republish a temporarily unpublished book without requiring a new review,
     * provided content has remained untouched.
     */
    public function republish(Book $book, User $actor, ?string $notes = null): Book
    {
        if ($book->publication_status !== 'temporarily_unpublished') {
            throw new InvalidWorkflowTransitionException("لا يمكن إعادة النشر إلا لكتاب موقوف النشر مؤقتاً.");
        }

        return $this->publish($book, $actor, $notes ?? 'إعادة نشر بعد إيقاف مؤقت');
    }

    /**
     * Permanently cancel publication of a book.
     */
    public function cancelPublication(Book $book, User $actor, ?string $notes = null): Book
    {
        if (!in_array($book->publication_status, ['published', 'temporarily_unpublished'])) {
            throw new InvalidWorkflowTransitionException("لا يمكن إلغاء النشر نهائياً إلا لكتاب منشور أو موقوف النشر مؤقتاً.");
        }

        return DB::transaction(function () use ($book, $actor, $notes) {
            $prevStatus = $book->publication_status;
            $book->publication_status = 'publication_cancelled';
            $book->cancelled_at = now();
            $book->cancelled_by = $actor->id;
            $book->save();

            $book->publicationHistory()->create([
                'user_id' => $actor->id,
                'event' => 'cancelled',
                'previous_publication_status' => $prevStatus,
                'new_publication_status' => 'publication_cancelled',
                'notes' => $notes,
                'created_at' => now(),
            ]);

            return $book;
        });
    }

    /**
     * Safely copy a permanently cancelled book into a brand new draft record.
     */
    public function copyCancelledBook(Book $sourceBook, User $actor): Book
    {
        if ($sourceBook->publication_status !== 'publication_cancelled') {
            throw new InvalidWorkflowTransitionException("لا يمكن نسخ الكتاب إلا إذا كانت حالته ملغى النشر نهائياً.");
        }

        return DB::transaction(function () use ($sourceBook, $actor) {
            // Clone physical cover image safely
            $newCoverPath = null;
            if ($sourceBook->cover_image_path && Storage::disk('public')->exists($sourceBook->cover_image_path)) {
                $ext = pathinfo($sourceBook->cover_image_path, PATHINFO_EXTENSION);
                $newCoverPath = 'books/covers/copy_' . Str::random(16) . ($ext ? '.' . $ext : '');
                Storage::disk('public')->copy($sourceBook->cover_image_path, $newCoverPath);
            }

            // Clone physical book file safely
            $newFilePath = null;
            if ($sourceBook->book_file_path && Storage::disk('local')->exists($sourceBook->book_file_path)) {
                $ext = pathinfo($sourceBook->book_file_path, PATHINFO_EXTENSION);
                $newFilePath = 'books/files/copy_' . Str::random(16) . ($ext ? '.' . $ext : '');
                Storage::disk('local')->copy($sourceBook->book_file_path, $newFilePath);
            }

            // Generate fresh unique slug
            $baseSlug = Str::slug($sourceBook->title);
            $newSlug = $baseSlug . '-' . Str::lower(Str::random(5));
            while (Book::where('slug', $newSlug)->exists()) {
                $newSlug = $baseSlug . '-' . Str::lower(Str::random(5));
            }

            $newDraft = Book::create([
                'title' => $sourceBook->title,
                'subtitle' => $sourceBook->subtitle,
                'slug' => $newSlug,
                'description' => $sourceBook->description,
                'introduction' => $sourceBook->introduction,
                'author_id' => $sourceBook->author_id,
                'declared_publication_date' => $sourceBook->declared_publication_date,
                'cover_image_path' => $newCoverPath,
                'book_file_path' => $newFilePath,
                'book_file_type' => $sourceBook->book_file_type,
                'book_file_size' => $sourceBook->book_file_size,
                'workflow_status' => 'draft',
                'publication_status' => 'unpublished',
                'created_by' => $actor->id,
                'copied_from_book_id' => $sourceBook->id,
                'last_content_updated_at' => now(),
            ]);

            return $newDraft;
        });
    }
}

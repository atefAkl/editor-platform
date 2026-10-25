<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BookWorkflowController extends Controller
{
    public function __construct(
        protected BookWorkflowService $workflowService
    ) {}

    /**
     * Submit draft for review.
     */
    public function submitReview(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.submit_review');

        $validated = $request->validate([
            'comments' => ['nullable', 'string', 'max:1000'],
        ]);

        $book = $this->workflowService->submitForReview(
            $book,
            $request->user(),
            $validated['comments'] ?? null
        );

        return $this->success($book, 'تم إرسال الكتاب للمراجعة بنجاح.');
    }

    /**
     * Request changes on a book under review.
     */
    public function requestChanges(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.review');

        $validated = $request->validate([
            'comments' => ['required', 'string', 'max:2000'],
        ], [
            'comments.required' => 'يجب كتابة أسباب وملاحظات طلب التعديلات.',
        ]);

        $book = $this->workflowService->requestChanges(
            $book,
            $request->user(),
            $validated['comments']
        );

        return $this->success($book, 'تمت إعادة الكتاب لطلب التعديلات بنجاح.');
    }

    /**
     * Approve book.
     */
    public function approve(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.approve');

        $validated = $request->validate([
            'comments' => ['nullable', 'string', 'max:1000'],
        ]);

        $book = $this->workflowService->approve(
            $book,
            $request->user(),
            $validated['comments'] ?? null
        );

        return $this->success($book, 'تم اعتماد الكتاب وتأهيله للنشر بنجاح.');
    }

    /**
     * Publish approved book.
     */
    public function publish(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.publish');

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $book = $this->workflowService->publish(
            $book,
            $request->user(),
            $validated['notes'] ?? null
        );

        return $this->success($book, 'تم نشر الكتاب على المنصة بنجاح.');
    }

    /**
     * Temporarily unpublish book.
     */
    public function unpublish(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.unpublish');

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $book = $this->workflowService->unpublish(
            $book,
            $request->user(),
            $validated['notes'] ?? null
        );

        return $this->success($book, 'تم إيقاف نشر الكتاب مؤقتاً بنجاح.');
    }

    /**
     * Republish temporarily unpublished book.
     */
    public function republish(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.publish');

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $book = $this->workflowService->republish(
            $book,
            $request->user(),
            $validated['notes'] ?? null
        );

        return $this->success($book, 'تمت إعادة نشر الكتاب بنجاح.');
    }

    /**
     * Permanently cancel publication.
     */
    public function cancelPublication(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.cancel_publication');

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $book = $this->workflowService->cancelPublication(
            $book,
            $request->user(),
            $validated['notes'] ?? null
        );

        return $this->success($book, 'تم إلغاء نشر الكتاب نهائياً وأرشفته.');
    }

    /**
     * Copy cancelled book into new draft.
     */
    public function copy(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.copy');

        $newDraft = $this->workflowService->copyCancelledBook(
            $book,
            $request->user()
        );

        return $this->success(
            $newDraft->load('author:id,name'),
            'تم نسخ الكتاب بنجاح كمسودة جديدة.',
            201
        );
    }
}

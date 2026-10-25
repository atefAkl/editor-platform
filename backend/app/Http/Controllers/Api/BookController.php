<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Services\BookService;
use App\Services\AuthorService;
use App\Http\Requests\StoreBookRequest;
use App\Http\Requests\UpdateBookRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BookController extends Controller
{
    public function __construct(
        protected BookService $bookService,
        protected AuthorService $authorService
    ) {}

    /**
     * List books with search and filters.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('books.view');

        $query = Book::with(['author:id,name', 'creator:id,name'])
            ->orderBy('id', 'desc');

        // Filters
        if ($request->filled('workflow_status')) {
            $query->where('workflow_status', $request->query('workflow_status'));
        }

        if ($request->filled('publication_status')) {
            $query->where('publication_status', $request->query('publication_status'));
        }

        if ($request->filled('author_id')) {
            $query->where('author_id', $request->query('author_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('subtitle', 'like', "%{$search}%");
            });
        }

        $books = $query->paginate(15);

        return $this->success($books, 'تم جلب قائمة الكتب بنجاح.');
    }

    /**
     * Store a new draft book record.
     */
    public function store(StoreBookRequest $request): JsonResponse
    {
        $data = $request->validated();

        // If author_id is omitted, fallback to default author
        if (empty($data['author_id'])) {
            $defaultAuthor = $this->authorService->getDefaultAuthor();
            $data['author_id'] = $defaultAuthor?->id;
        }

        $book = $this->bookService->createDraft(
            $data,
            $request->user(),
            $request->file('cover_image'),
            $request->file('book_file')
        );

        return $this->success(
            $book->load('author:id,name'),
            'تم إنشاء مسودة الكتاب بنجاح.',
            201
        );
    }

    /**
     * Show full book details including reviews and publication audit logs.
     */
    public function show(Request $request, Book $book): JsonResponse
    {
        $this->authorize('books.view');

        $book->load([
            'author',
            'creator:id,name',
            'publisher:id,name',
            'canceller:id,name',
            'copiedFrom:id,title',
            'reviews.user:id,name',
            'publicationHistory.user:id,name',
        ]);

        // Build allowed action flags for user
        $user = $request->user();
        $allowedActions = [
            'can_update' => $user->can('books.update') && $book->publication_status !== 'publication_cancelled',
            'can_submit_review' => $user->can('books.submit_review') && in_array($book->workflow_status, ['draft', 'changes_requested']),
            'can_review' => $user->can('books.review') && $book->workflow_status === 'in_review',
            'can_approve' => $user->can('books.approve') && $book->workflow_status === 'in_review',
            'can_publish' => $user->can('books.publish') && $book->workflow_status === 'approved' && in_array($book->publication_status, ['unpublished', 'temporarily_unpublished']),
            'can_unpublish' => $user->can('books.unpublish') && $book->publication_status === 'published',
            'can_cancel_publication' => $user->can('books.cancel_publication') && in_array($book->publication_status, ['published', 'temporarily_unpublished']),
            'can_copy' => $user->can('books.copy') && $book->publication_status === 'publication_cancelled',
        ];

        return $this->success([
            'book' => $book,
            'allowed_actions' => $allowedActions,
        ], 'تم جلب تفاصيل الكتاب بنجاح.');
    }

    /**
     * Update book metadata and assets.
     */
    public function update(UpdateBookRequest $request, Book $book): JsonResponse
    {
        $book = $this->bookService->updateBook(
            $book,
            $request->validated(),
            $request->user(),
            $request->file('cover_image'),
            $request->file('book_file')
        );

        return $this->success(
            $book->fresh(['author:id,name']),
            'تم تحديث بيانات الكتاب بنجاح.'
        );
    }
}

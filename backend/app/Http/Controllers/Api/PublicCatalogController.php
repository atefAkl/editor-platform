<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\Author;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PublicCatalogController extends Controller
{
    /**
     * Categories metadata map for Arabic display.
     */
    public const CATEGORIES = [
        ['key' => 'all', 'label' => 'الكل'],
        ['key' => 'novels', 'label' => 'روايات'],
        ['key' => 'short_stories', 'label' => 'قصص قصيرة'],
        ['key' => 'poetry', 'label' => 'دواوين'],
        ['key' => 'articles', 'label' => 'مقالات'],
    ];

    /**
     * Get public publications catalog with category filtering and search.
     */
    public function publications(Request $request): JsonResponse
    {
        $primaryAuthor = Author::where('is_default', true)->first()
            ?? Author::orderBy('id', 'asc')->first();

        $query = Book::publiclyVisible()->with('author:id,name,bio');

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('subtitle', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $books = $query->orderBy('published_at', 'desc')->get();

        return $this->success([
            'author' => $primaryAuthor,
            'books' => $books,
            'categories' => self::CATEGORIES,
            'active_category' => $request->get('category', 'all'),
        ], 'تم جلب المؤلفات والكتب بنجاح.');
    }

    /**
     * Legacy/Homepage summary catalog.
     */
    public function home(Request $request): JsonResponse
    {
        return $this->publications($request);
    }

    /**
     * Get single publicly visible book details.
     */
    public function bookDetails(string $slug): JsonResponse
    {
        $book = Book::publiclyVisible()
            ->where('slug', $slug)
            ->with('author:id,name,bio')
            ->firstOrFail();

        return $this->success($book, 'تم جلب تفاصيل الكتاب بنجاح.');
    }
}

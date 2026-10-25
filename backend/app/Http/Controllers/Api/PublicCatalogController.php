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
     * Get public homepage catalog (author info + publicly visible books).
     */
    public function home(Request $request): JsonResponse
    {
        $primaryAuthor = Author::where('is_default', true)->first()
            ?? Author::orderBy('id', 'asc')->first();

        $books = Book::publiclyVisible()
            ->with('author:id,name,bio')
            ->orderBy('published_at', 'desc')
            ->get();

        return $this->success([
            'author' => $primaryAuthor,
            'books' => $books,
        ], 'تم جلب مكتبة الكتب بنجاح.');
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

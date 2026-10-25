<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Services\AuthorService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AuthorController extends Controller
{
    public function __construct(
        protected AuthorService $authorService
    ) {}

    /**
     * List all authors for selection dropdowns.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('books.view');

        $authors = Author::orderBy('is_default', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return $this->success($authors, 'تم جلب قائمة المؤلفين بنجاح.');
    }

    /**
     * Update an author's metadata.
     */
    public function update(Request $request, Author $author): JsonResponse
    {
        $this->authorize('books.update');

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        if (!empty($validated['is_default'])) {
            $this->authorService->setAsDefault($author);
            unset($validated['is_default']);
        }

        $author->update($validated);

        return $this->success($author->fresh(), 'تم تحديث بيانات المؤلف بنجاح.');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostComment;
use App\Models\Author;
use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class FeedController extends Controller
{
    /**
     * Get social feed stream for homepage.
     */
    public function index(Request $request): JsonResponse
    {
        $primaryAuthor = Author::where('is_default', true)->first()
            ?? Author::orderBy('id', 'asc')->first();

        $posts = Post::with([
                'author:id,name,bio,avatar',
                'book:id,title,slug,cover_image_path,category',
                'comments' => function ($query) {
                    $query->latest()->limit(5);
                }
            ])
            ->orderBy('is_pinned', 'desc')
            ->orderBy('published_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate($request->get('per_page', 15));

        // Get count of published books for stats
        $publishedBooksCount = Book::publiclyVisible()->count();
        $totalPostsCount = Post::count();

        return $this->success([
            'author' => $primaryAuthor,
            'stats' => [
                'published_books' => $publishedBooksCount,
                'total_posts' => $totalPostsCount,
            ],
            'posts' => $posts->items(),
            'pagination' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'total' => $posts->total(),
            ],
        ], 'تم جلب خلاصة الأخبار بنجاح.');
    }

    /**
     * Get single post dedicated details with full discussion thread.
     */
    public function show($id): JsonResponse
    {
        $post = Post::with([
                'author:id,name,bio,avatar',
                'book:id,title,slug,cover_image_path,category',
                'comments' => function ($query) {
                    $query->orderBy('created_at', 'asc');
                }
            ])
            ->findOrFail($id);

        return $this->success($post, 'تم جلب المنشور وتفاصيله بنجاح.');
    }

    /**
     * Publish a new post to the feed.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpeg,png,webp,gif', 'max:5120'],
            'book_id' => ['nullable', 'exists:books,id'],
            'is_pinned' => ['nullable', 'boolean'],
            'author_id' => ['nullable', 'exists:authors,id'],
        ], [
            'content.required' => 'نص المنشور مطلوب.',
            'image.image' => 'يجب أن يكون الملف المرفوع صورة صالحة.',
            'image.max' => 'الحد الأقصى لحجم الصورة هو 5 ميجابايت.',
        ]);

        $authorId = $validated['author_id'] ?? null;
        if (!$authorId) {
            $defaultAuthor = Author::where('is_default', true)->first()
                ?? Author::orderBy('id', 'asc')->first();
            $authorId = $defaultAuthor ? $defaultAuthor->id : 1;
        }

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('posts', 'public');
        }

        $post = Post::create([
            'author_id' => $authorId,
            'user_id' => $request->user()?->id,
            'content' => $validated['content'],
            'image_path' => $imagePath,
            'book_id' => $validated['book_id'] ?? null,
            'is_pinned' => $request->boolean('is_pinned'),
            'published_at' => now(),
        ]);

        $post->load(['author:id,name,bio,avatar', 'book:id,title,slug,cover_image_path,category']);

        return $this->success($post, 'تم نشر المنشور على الخلاصة بنجاح.', 201);
    }

    /**
     * Add a comment to a feed post.
     */
    public function addComment(Request $request, $id): JsonResponse
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'author_name' => ['nullable', 'string', 'max:100'],
            'content' => ['required', 'string', 'max:1000'],
        ], [
            'content.required' => 'نص التعليق مطلوب.',
            'content.max' => 'يجب ألا يتجاوز التعليق 1000 حرف.',
        ]);

        $userName = $request->user()?->name ?? $validated['author_name'] ?? 'قارئ متفاعل';

        $comment = $post->comments()->create([
            'user_id' => $request->user()?->id,
            'author_name' => $userName,
            'content' => $validated['content'],
        ]);

        $post->increment('comments_count');

        return $this->success([
            'comment' => $comment,
            'comments_count' => $post->fresh()->comments_count,
        ], 'تمت إضافة تعليقك بنجاح.');
    }

    /**
     * Increment like reaction on a post.
     */
    public function like($id): JsonResponse
    {
        $post = Post::findOrFail($id);
        $post->increment('likes_count');

        return $this->success([
            'likes_count' => $post->fresh()->likes_count,
        ], 'تم تسجيل التفاعل بنجاح.');
    }
}

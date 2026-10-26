<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Author;
use App\Models\Book;
use App\Models\Post;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FeedAndPublicationsApiTest extends TestCase
{
    use RefreshDatabase;

    protected Author $author;
    protected Book $publishedBook;

    protected function setUp(): void
    {
        parent::setUp();

        $this->author = Author::create([
            'name' => 'المؤلف الأساسي',
            'slug' => 'primary-author',
            'bio' => 'نبذة الكاتب',
            'is_default' => true,
        ]);

        $user = User::factory()->create();

        $this->publishedBook = Book::create([
            'title' => 'رواية تجريبية',
            'slug' => 'test-novel',
            'category' => 'novels',
            'description' => 'وصف الرواية',
            'author_id' => $this->author->id,
            'workflow_status' => 'approved',
            'publication_status' => 'published',
            'published_at' => now(),
            'created_by' => $user->id,
        ]);
    }

    public function test_can_fetch_public_feed_stream(): void
    {
        Post::create([
            'author_id' => $this->author->id,
            'content' => 'منشور تجريبي للاختبار',
            'likes_count' => 5,
            'comments_count' => 1,
            'published_at' => now(),
        ]);

        $response = $this->getJson('/api/feed');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'author',
                    'stats',
                    'posts',
                    'pagination',
                ]
            ]);
    }

    public function test_can_like_a_post(): void
    {
        $post = Post::create([
            'author_id' => $this->author->id,
            'content' => 'منشور للإعجاب',
            'likes_count' => 10,
            'published_at' => now(),
        ]);

        $response = $this->postJson("/api/feed/{$post->id}/like");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.likes_count', 11);
    }

    public function test_can_add_comment_to_post(): void
    {
        $post = Post::create([
            'author_id' => $this->author->id,
            'content' => 'منشور للتعليق',
            'comments_count' => 0,
            'published_at' => now(),
        ]);

        $response = $this->postJson("/api/feed/{$post->id}/comments", [
            'author_name' => 'قارئ مهتم',
            'content' => 'تعليق رائع وهادف',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.comment.content', 'تعليق رائع وهادف')
            ->assertJsonPath('data.comments_count', 1);

        $this->assertDatabaseHas('post_comments', [
            'post_id' => $post->id,
            'author_name' => 'قارئ مهتم',
            'content' => 'تعليق رائع وهادف',
        ]);
    }

    public function test_can_filter_publications_by_category(): void
    {
        // Another book in poetry
        $user = User::first();
        Book::create([
            'title' => 'ديوان شعر تجريبي',
            'slug' => 'test-poetry',
            'category' => 'poetry',
            'description' => 'قصائد',
            'author_id' => $this->author->id,
            'workflow_status' => 'approved',
            'publication_status' => 'published',
            'published_at' => now(),
            'created_by' => $user->id,
        ]);

        // Filter by novels
        $response = $this->getJson('/api/catalog/publications?category=novels');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.books')
            ->assertJsonPath('data.books.0.category', 'novels');

        // Filter by poetry
        $responsePoetry = $this->getJson('/api/catalog/publications?category=poetry');
        $responsePoetry->assertStatus(200)
            ->assertJsonCount(1, 'data.books')
            ->assertJsonPath('data.books.0.category', 'poetry');

        // Filter all
        $responseAll = $this->getJson('/api/catalog/publications?category=all');
        $responseAll->assertStatus(200)
            ->assertJsonCount(2, 'data.books');
    }
}

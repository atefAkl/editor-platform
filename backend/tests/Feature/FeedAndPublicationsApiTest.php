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
    protected User $creatorUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->author = Author::create([
            'name' => 'المؤلف الأساسي',
            'slug' => 'primary-author',
            'bio' => 'نبذة الكاتب',
            'is_default' => true,
        ]);

        $this->creatorUser = User::factory()->create([
            'name' => 'المؤلف المشرف',
            'email' => 'author@example.com',
        ]);

        // Assign author role and permissions
        $role = Role::create(['name' => 'author', 'slug' => 'author', 'description' => 'Author Role']);
        $permBooks = Permission::create(['name' => 'books.create', 'slug' => 'books-create', 'description' => 'Create books']);
        $role->permissions()->attach($permBooks);
        $this->creatorUser->roles()->attach($role);

        $this->publishedBook = Book::create([
            'title' => 'رواية تجريبية',
            'slug' => 'test-novel',
            'category' => 'novels',
            'description' => 'وصف الرواية',
            'author_id' => $this->author->id,
            'workflow_status' => 'approved',
            'publication_status' => 'published',
            'published_at' => now(),
            'created_by' => $this->creatorUser->id,
        ]);
    }

    public function test_can_fetch_public_feed_stream(): void
    {
        Post::create([
            'author_id' => $this->author->id,
            'type' => 'thought',
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
            'type' => 'thought',
            'content' => 'منشور للإعجاب',
            'likes_count' => 10,
            'published_at' => now(),
        ]);

        $response = $this->postJson("/api/feed/{$post->id}/like");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.likes_count', 11);
    }

    public function test_guest_cannot_comment_on_post(): void
    {
        $post = Post::create([
            'author_id' => $this->author->id,
            'type' => 'thought',
            'content' => 'منشور للتعليق',
            'comments_count' => 0,
            'published_at' => now(),
        ]);

        // Unauthenticated request should fail
        $response = $this->postJson("/api/feed/{$post->id}/comments", [
            'content' => 'تعليق كزائر غير مسجل',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_add_comment_to_post(): void
    {
        $post = Post::create([
            'author_id' => $this->author->id,
            'type' => 'thought',
            'content' => 'منشور للتعليق',
            'comments_count' => 0,
            'published_at' => now(),
        ]);

        $reader = User::factory()->create(['name' => 'قارئ مهتم']);

        $response = $this->actingAs($reader)->postJson("/api/feed/{$post->id}/comments", [
            'content' => 'تعليق رائع وهادف',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.comment.content', 'تعليق رائع وهادف')
            ->assertJsonPath('data.comments_count', 1);

        $this->assertDatabaseHas('post_comments', [
            'post_id' => $post->id,
            'user_id' => $reader->id,
            'author_name' => 'قارئ مهتم',
            'content' => 'تعليق رائع وهادف',
        ]);
    }

    public function test_guest_cannot_create_post(): void
    {
        $response = $this->postJson('/api/feed', [
            'type' => 'article',
            'title' => 'مقال تجريبي',
            'content' => 'محتوى المقال',
        ]);

        $response->assertStatus(401);
    }

    public function test_authorized_user_can_create_post(): void
    {
        $response = $this->actingAs($this->creatorUser)->postJson('/api/feed', [
            'type' => 'article',
            'title' => 'مقال فكري جديد',
            'content' => '<p>محتوى المقال بتنسيق غني</p>',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', 'مقال فكري جديد')
            ->assertJsonPath('data.type', 'article');
    }

    public function test_can_update_platform_and_author_settings(): void
    {
        $response = $this->actingAs($this->creatorUser)->postJson('/api/settings', [
            '_method' => 'PUT',
            'author_name' => 'أ.د. عاطف عقل',
            'author_bio' => 'نبذة محدثة عن المؤلف',
            'site_name' => 'منصة الكاتب الأدبية المعتمدة',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('authors', [
            'id' => $this->author->id,
            'name' => 'أ.د. عاطف عقل',
        ]);
    }

    public function test_can_register_new_reader_with_real_email_and_password(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'قارئ أدبي جديد',
            'email' => 'newreader@example.com',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'قارئ أدبي جديد')
            ->assertJsonPath('data.email', 'newreader@example.com');

        $this->assertDatabaseHas('users', [
            'email' => 'newreader@example.com',
            'name' => 'قارئ أدبي جديد',
        ]);

        $this->assertAuthenticated();
    }
}

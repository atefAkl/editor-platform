<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Author;
use App\Models\Book;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\AuthorSeeder;

class BookApiEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $editorUser;
    protected Author $author;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            AdminUserSeeder::class,
            RolePermissionSeeder::class,
            AuthorSeeder::class,
        ]);

        $this->adminUser = User::where('email', env('ADMIN_EMAIL', 'admin@platform.test'))->first();
        $this->author = Author::where('is_default', true)->first();

        // Editor user with editor role only
        $editorRole = Role::where('slug', 'editor')->first();
        $this->editorUser = User::factory()->create();
        $this->editorUser->roles()->sync([$editorRole->id]);

        Storage::fake('public');
        Storage::fake('local');
    }

    public function test_can_list_authors(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson('/api/authors');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.name', 'المؤلف الأساسي');
    }

    public function test_admin_can_create_draft_book(): void
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/books', [
                'title' => 'كتاب جديد عبر الـ API',
                'description' => 'وصف تفصيلي',
                'author_id' => $this->author->id,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.workflow_status', 'draft')
            ->assertJsonPath('data.publication_status', 'unpublished');

        $this->assertDatabaseHas('books', ['title' => 'كتاب جديد عبر الـ API']);
    }

    public function test_editor_can_submit_for_review_but_cannot_publish(): void
    {
        $book = Book::create([
            'title' => 'كتاب المحرر',
            'slug' => 'editor-book',
            'author_id' => $this->author->id,
            'created_by' => $this->editorUser->id,
            'workflow_status' => 'draft',
            'publication_status' => 'unpublished',
        ]);

        // Editor submits review -> Allowed (200)
        $submitRes = $this->actingAs($this->editorUser)
            ->postJson("/api/books/{$book->id}/submit-review", [
                'comments' => 'جاهز للتدقيق',
            ]);
        $submitRes->assertStatus(200);

        // Editor attempts to publish -> Denied (403 Forbidden)
        $publishRes = $this->actingAs($this->editorUser)
            ->postJson("/api/books/{$book->id}/publish");
        $publishRes->assertStatus(403);
    }

    public function test_full_api_editorial_and_publication_flow(): void
    {
        // 1. Create with assets
        $cover = UploadedFile::fake()->image('cover.jpg');
        $file = UploadedFile::fake()->create('book.pdf', 100, 'application/pdf');

        $createRes = $this->actingAs($this->adminUser)
            ->postJson('/api/books', [
                'title' => 'رواية النشر الكامل',
                'author_id' => $this->author->id,
                'cover_image' => $cover,
                'book_file' => $file,
            ]);
        $createRes->assertStatus(201);
        $bookId = $createRes->json('data.id');

        // 2. Submit for review
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/submit-review")
            ->assertStatus(200);

        // 3. Request changes
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/request-changes", ['comments' => 'عدل المقدمة'])
            ->assertStatus(200);

        // 4. Resubmit
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/submit-review", ['comments' => 'تم التعديل'])
            ->assertStatus(200);

        // 5. Approve
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/approve")
            ->assertStatus(200);

        // 6. Publish
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/publish")
            ->assertStatus(200)
            ->assertJsonPath('data.publication_status', 'published');

        // 7. Temporary unpublish
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/unpublish")
            ->assertStatus(200)
            ->assertJsonPath('data.publication_status', 'temporarily_unpublished');

        // 8. Republish
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/republish")
            ->assertStatus(200)
            ->assertJsonPath('data.publication_status', 'published');

        // 9. Cancel publication permanently
        $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/cancel-publication")
            ->assertStatus(200)
            ->assertJsonPath('data.publication_status', 'publication_cancelled');

        // 10. Copy cancelled book
        $copyRes = $this->actingAs($this->adminUser)
            ->postJson("/api/books/{$bookId}/copy");
        $copyRes->assertStatus(201)
            ->assertJsonPath('data.workflow_status', 'draft')
            ->assertJsonPath('data.publication_status', 'unpublished')
            ->assertJsonPath('data.copied_from_book_id', $bookId);
    }
}

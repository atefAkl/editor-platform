<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Author;
use App\Models\Book;
use App\Services\BookService;
use App\Services\BookWorkflowService;
use App\Services\AuthorService;
use App\Exceptions\InvalidWorkflowTransitionException;
use App\Exceptions\PublicationValidationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\AuthorSeeder;

class BookStateMachineServiceTest extends TestCase
{
    use RefreshDatabase;

    protected BookService $bookService;
    protected BookWorkflowService $workflowService;
    protected AuthorService $authorService;
    protected User $adminUser;
    protected Author $author;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            AdminUserSeeder::class,
            RolePermissionSeeder::class,
            AuthorSeeder::class,
        ]);

        $this->bookService = new BookService();
        $this->workflowService = new BookWorkflowService();
        $this->authorService = new AuthorService();

        $this->adminUser = User::where('email', env('ADMIN_EMAIL', 'admin@platform.test'))->first();
        $this->author = Author::where('is_default', true)->first();

        Storage::fake('public');
        Storage::fake('local');
    }

    public function test_create_draft_starts_in_draft_and_unpublished(): void
    {
        $book = $this->bookService->createDraft([
            'title' => 'رواية تجريبية',
            'author_id' => $this->author->id,
            'description' => 'وصف الرواية',
        ], $this->adminUser);

        $this->assertEquals('draft', $book->workflow_status);
        $this->assertEquals('unpublished', $book->publication_status);
        $this->assertNull($book->cover_image_path);
        $this->assertNull($book->book_file_path);
    }

    public function test_workflow_editorial_lifecycle(): void
    {
        $book = $this->bookService->createDraft([
            'title' => 'كتاب دورة العمل',
            'author_id' => $this->author->id,
        ], $this->adminUser);

        // 1. Submit for review
        $book = $this->workflowService->submitForReview($book, $this->adminUser, 'يرجى مراجعة المسودة');
        $this->assertEquals('in_review', $book->workflow_status);
        $this->assertCount(1, $book->reviews()->get());

        // 2. Request changes
        $book = $this->workflowService->requestChanges($book, $this->adminUser, 'يرجى تعديل الفصل الأول');
        $this->assertEquals('changes_requested', $book->workflow_status);
        $this->assertCount(2, $book->reviews()->get());

        // 3. Resubmit
        $book = $this->workflowService->submitForReview($book, $this->adminUser, 'تمت التعديلات المطلوبة');
        $this->assertEquals('in_review', $book->workflow_status);
        $this->assertCount(3, $book->reviews()->get());

        // 4. Approve
        $book = $this->workflowService->approve($book, $this->adminUser, 'معتمد للنشر');
        $this->assertEquals('approved', $book->workflow_status);
        $this->assertCount(4, $book->reviews()->get());
    }

    public function test_cannot_publish_without_assets_or_approval(): void
    {
        $book = $this->bookService->createDraft([
            'title' => 'كتاب بدون غلاف',
            'author_id' => $this->author->id,
        ], $this->adminUser);

        // Cannot publish draft
        $this->expectException(PublicationValidationException::class);
        $this->workflowService->publish($book, $this->adminUser);
    }

    public function test_publish_unpublish_and_republish_lifecycle(): void
    {
        // Create draft with fake assets
        $coverFile = UploadedFile::fake()->image('cover.jpg');
        $pdfFile = UploadedFile::fake()->create('book.pdf', 1000, 'application/pdf');

        $book = $this->bookService->createDraft([
            'title' => 'كتاب كامل الأصول',
            'author_id' => $this->author->id,
        ], $this->adminUser, $coverFile, $pdfFile);

        // Advance to approved
        $book = $this->workflowService->submitForReview($book, $this->adminUser);
        $book = $this->workflowService->approve($book, $this->adminUser);

        // Publish
        $book = $this->workflowService->publish($book, $this->adminUser, 'النشر الرسمي');
        $this->assertEquals('published', $book->publication_status);
        $this->assertNotNull($book->published_at);
        $originalPublishedAt = $book->published_at;

        // Temporarily unpublish
        $book = $this->workflowService->unpublish($book, $this->adminUser, 'إيقاف للصيانة');
        $this->assertEquals('temporarily_unpublished', $book->publication_status);
        $this->assertEquals('approved', $book->workflow_status);

        // Republish without review
        $book = $this->workflowService->republish($book, $this->adminUser);
        $this->assertEquals('published', $book->publication_status);
        $this->assertEquals($originalPublishedAt->toDateTimeString(), $book->published_at->toDateTimeString(), 'Original published_at must not be overwritten');
    }

    public function test_substantive_content_edit_on_published_book_demotes_to_draft(): void
    {
        $coverFile = UploadedFile::fake()->image('cover.jpg');
        $pdfFile = UploadedFile::fake()->create('book.pdf', 1000, 'application/pdf');

        $book = $this->bookService->createDraft([
            'title' => 'كتاب منشور للتعديل',
            'author_id' => $this->author->id,
        ], $this->adminUser, $coverFile, $pdfFile);

        $book = $this->workflowService->submitForReview($book, $this->adminUser);
        $book = $this->workflowService->approve($book, $this->adminUser);
        $book = $this->workflowService->publish($book, $this->adminUser);

        $this->assertEquals('published', $book->publication_status);

        // 1. Save with unchanged data (noop) -> state must NOT change
        $book = $this->bookService->updateBook($book, [
            'title' => 'كتاب منشور للتعديل',
        ], $this->adminUser);
        $this->assertEquals('published', $book->publication_status);
        $this->assertEquals('approved', $book->workflow_status);

        // 2. Save with actual substantive change -> must demote to draft and unpublished
        $book = $this->bookService->updateBook($book, [
            'title' => 'عنوان معدل جديد',
            'description' => 'تم تغيير الوصف',
        ], $this->adminUser);

        $this->assertEquals('draft', $book->workflow_status, 'Content edit must demote to draft');
        $this->assertEquals('unpublished', $book->publication_status, 'Content edit must unpublish book');
        $this->assertFalse(Book::publiclyVisible()->where('id', $book->id)->exists(), 'Demoted book must not be publicly visible');
    }

    public function test_permanent_cancellation_and_safe_cloning(): void
    {
        $coverFile = UploadedFile::fake()->image('cover.jpg');
        $pdfFile = UploadedFile::fake()->create('book.pdf', 1000, 'application/pdf');

        $book = $this->bookService->createDraft([
            'title' => 'كتاب للإلغاء والنسخ',
            'author_id' => $this->author->id,
        ], $this->adminUser, $coverFile, $pdfFile);

        $book = $this->workflowService->submitForReview($book, $this->adminUser);
        $book = $this->workflowService->approve($book, $this->adminUser);
        $book = $this->workflowService->publish($book, $this->adminUser);

        // Cancel permanently
        $book = $this->workflowService->cancelPublication($book, $this->adminUser, 'إلغاء نهائي لانتهاء الحقوق');
        $this->assertEquals('publication_cancelled', $book->publication_status);

        // Cannot republish cancelled book
        $this->expectException(InvalidWorkflowTransitionException::class);
        $this->workflowService->publish($book, $this->adminUser);
    }

    public function test_copying_cancelled_book_creates_independent_draft(): void
    {
        $coverFile = UploadedFile::fake()->image('cover.jpg');
        $pdfFile = UploadedFile::fake()->create('book.pdf', 1000, 'application/pdf');

        $book = $this->bookService->createDraft([
            'title' => 'كتاب أصل ملغى',
            'author_id' => $this->author->id,
        ], $this->adminUser, $coverFile, $pdfFile);

        $book = $this->workflowService->submitForReview($book, $this->adminUser);
        $book = $this->workflowService->approve($book, $this->adminUser);
        $book = $this->workflowService->publish($book, $this->adminUser);
        $book = $this->workflowService->cancelPublication($book, $this->adminUser);

        // Copy cancelled book
        $copiedBook = $this->workflowService->copyCancelledBook($book, $this->adminUser);

        $this->assertNotEquals($book->id, $copiedBook->id);
        $this->assertEquals('draft', $copiedBook->workflow_status);
        $this->assertEquals('unpublished', $copiedBook->publication_status);
        $this->assertEquals($book->id, $copiedBook->copied_from_book_id);
        $this->assertNull($copiedBook->published_at);
        $this->assertNull($copiedBook->cancelled_at);

        // Verify physical assets were cloned to new paths
        $this->assertNotEquals($book->cover_image_path, $copiedBook->cover_image_path);
        $this->assertNotEquals($book->book_file_path, $copiedBook->book_file_path);
        $this->assertTrue(Storage::disk('public')->exists($copiedBook->cover_image_path));
        $this->assertTrue(Storage::disk('local')->exists($copiedBook->book_file_path));
    }
}

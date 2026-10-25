<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Author;
use App\Models\Book;
use App\Models\BookReview;
use App\Models\BookPublicationHistory;
use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\AuthorSeeder;

class Phase1DataAndRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic system state
        $this->seed([
            AdminUserSeeder::class,
            RolePermissionSeeder::class,
            AuthorSeeder::class,
        ]);
    }

    public function test_multi_role_effective_permissions_union(): void
    {
        // 1. Create permissions
        $perm1 = Permission::firstOrCreate(['slug' => 'test.perm1'], ['name' => 'Perm 1']);
        $perm2 = Permission::firstOrCreate(['slug' => 'test.perm2'], ['name' => 'Perm 2']);
        $perm3 = Permission::firstOrCreate(['slug' => 'test.perm3'], ['name' => 'Perm 3']);

        // 2. Create roles
        $roleA = Role::firstOrCreate(['slug' => 'role_a'], ['name' => 'Role A']);
        $roleB = Role::firstOrCreate(['slug' => 'role_b'], ['name' => 'Role B']);

        $roleA->permissions()->sync([$perm1->id, $perm2->id]);
        $roleB->permissions()->sync([$perm2->id, $perm3->id]);

        // 3. Create user with both roles
        $user = User::factory()->create();
        $user->roles()->sync([$roleA->id, $roleB->id]);

        // 4. Verify Union Calculation
        $this->assertTrue($user->hasPermission('test.perm1'));
        $this->assertTrue($user->hasPermission('test.perm2'));
        $this->assertTrue($user->hasPermission('test.perm3'));
        $this->assertFalse($user->hasPermission('test.non_existent'));

        // 5. Verify Gate integration
        $this->assertTrue(Gate::forUser($user)->allows('test.perm1'));
        $this->assertTrue(Gate::forUser($user)->allows('test.perm2'));
        $this->assertTrue(Gate::forUser($user)->allows('test.perm3'));
        $this->assertFalse(Gate::forUser($user)->allows('test.non_existent'));
    }

    public function test_user_with_editor_role_is_denied_publisher_permissions(): void
    {
        // Create user with Editor role only
        $editorRole = Role::where('slug', 'editor')->first();
        $user = User::factory()->create();
        $user->roles()->sync([$editorRole->id]);

        // Assert allowed permissions for Editor
        $this->assertTrue($user->hasPermission('books.create'));
        $this->assertTrue(Gate::forUser($user)->allows('books.create'));
        $this->assertTrue($user->hasPermission('books.update'));

        // Assert DENIAL for Publisher-specific permissions
        $this->assertFalse(
            $user->hasPermission('books.publish'),
            'Editor must not have books.publish permission'
        );
        $this->assertFalse(
            Gate::forUser($user)->allows('books.publish'),
            'Gate must deny books.publish for editor user'
        );

        $this->assertFalse(
            $user->hasPermission('books.unpublish'),
            'Editor must not have books.unpublish permission'
        );
        $this->assertFalse(
            Gate::forUser($user)->allows('books.unpublish'),
            'Gate must deny books.unpublish for editor user'
        );

        $this->assertFalse(
            $user->hasPermission('books.cancel_publication'),
            'Editor must not have books.cancel_publication permission'
        );
        $this->assertFalse(
            Gate::forUser($user)->allows('books.cancel_publication'),
            'Gate must deny books.cancel_publication for editor user'
        );
    }

    public function test_admin_user_has_all_book_permissions_via_admin_role(): void
    {
        $adminEmail = env('ADMIN_EMAIL', 'admin@platform.test');
        $admin = User::where('email', $adminEmail)->first();

        $this->assertNotNull($admin, 'Admin user must exist from Seeder');

        $requiredPermissions = [
            'books.view',
            'books.create',
            'books.update',
            'books.submit_review',
            'books.review',
            'books.approve',
            'books.publish',
            'books.unpublish',
            'books.cancel_publication',
            'books.copy',
        ];

        foreach ($requiredPermissions as $perm) {
            $this->assertTrue(
                $admin->hasPermission($perm),
                "Admin user must possess permission: {$perm}"
            );
            $this->assertTrue(
                Gate::forUser($admin)->allows($perm),
                "Gate must authorize admin for: {$perm}"
            );
        }
    }

    public function test_author_entity_is_independent_from_admin_user(): void
    {
        $author = Author::where('is_default', true)->first();

        $this->assertNotNull($author, 'Default author record must exist in authors table');
        $this->assertEquals('المؤلف الأساسي', $author->name);
        $this->assertTrue($author->is_default);

        // Ensure Author model is stored in separate table from User
        $adminEmail = env('ADMIN_EMAIL', 'admin@platform.test');
        $admin = User::where('email', $adminEmail)->first();

        $this->assertNotEquals($author->name, $admin->name);
        $this->assertInstanceOf(Author::class, $author);
        $this->assertInstanceOf(User::class, $admin);
        $this->assertEquals('authors', $author->getTable());
        $this->assertEquals('users', $admin->getTable());
    }

    public function test_only_one_author_can_be_default(): void
    {
        // 1. Initially, seeded author is default
        $initialAuthor = Author::where('is_default', true)->first();
        $this->assertNotNull($initialAuthor);
        $this->assertTrue($initialAuthor->is_default);

        // 2. Create a second author with is_default = true
        $secondAuthor = Author::create([
            'name' => 'مؤلف ثانٍ',
            'slug' => 'second-author',
            'bio' => 'نبذة عن المؤلف الثاني',
            'is_default' => true,
        ]);

        // Refresh initial author from database
        $initialAuthor->refresh();

        // Verify initial author is no longer default, and second author is default
        $this->assertFalse($initialAuthor->is_default, 'Initial author must lose default status');
        $this->assertTrue($secondAuthor->is_default, 'Second author must be default');
        $this->assertEquals(1, Author::where('is_default', true)->count(), 'Exactly one author must be default');

        // 3. Update initial author back to default = true
        $initialAuthor->update(['is_default' => true]);
        $secondAuthor->refresh();

        $this->assertTrue($initialAuthor->is_default, 'Initial author must become default again');
        $this->assertFalse($secondAuthor->is_default, 'Second author must lose default status');
        $this->assertEquals(1, Author::where('is_default', true)->count(), 'Exactly one author must be default');

        // 4. Updating non-default fields should not alter default author count
        $secondAuthor->update(['name' => 'اسم معدل للمؤلف الثاني']);
        $initialAuthor->refresh();

        $this->assertTrue($initialAuthor->is_default);
        $this->assertFalse($secondAuthor->is_default);
        $this->assertEquals(1, Author::where('is_default', true)->count());
    }

    public function test_seeders_are_idempotent_and_can_run_repeatedly(): void
    {
        $initialRoleCount = Role::count();
        $initialPermissionCount = Permission::count();
        $initialAuthorCount = Author::count();
        $adminEmail = env('ADMIN_EMAIL', 'admin@platform.test');
        $admin = User::where('email', $adminEmail)->first();
        $initialAdminRoleCount = $admin->roles()->count();

        // Run seeders a second time
        $this->seed([
            AdminUserSeeder::class,
            RolePermissionSeeder::class,
            AuthorSeeder::class,
        ]);

        // Run seeders a third time
        $this->seed([
            AdminUserSeeder::class,
            RolePermissionSeeder::class,
            AuthorSeeder::class,
        ]);

        // Assert record counts have not changed (no duplicates created)
        $this->assertEquals($initialRoleCount, Role::count(), 'Role count must remain constant after reseeding');
        $this->assertEquals($initialPermissionCount, Permission::count(), 'Permission count must remain constant');
        $this->assertEquals($initialAuthorCount, Author::count(), 'Author count must remain constant');
        $this->assertEquals($initialAdminRoleCount, $admin->fresh()->roles()->count(), 'Admin role attachments must not duplicate');
        $this->assertEquals(1, Author::where('is_default', true)->count(), 'Single default author must be maintained');
    }

    public function test_book_model_relationships_and_audit_history(): void
    {
        $author = Author::where('is_default', true)->first();
        $user = User::first();

        $book = Book::create([
            'title' => 'كتاب تجريبي لاختبار البنية',
            'slug' => 'test-book-structure',
            'author_id' => $author->id,
            'created_by' => $user->id,
            'workflow_status' => 'draft',
            'publication_status' => 'unpublished',
        ]);

        $this->assertDatabaseHas('books', ['id' => $book->id]);
        $this->assertEquals($author->id, $book->author->id);
        $this->assertEquals($user->id, $book->creator->id);

        // Record a review entry
        $review = BookReview::create([
            'book_id' => $book->id,
            'user_id' => $user->id,
            'action' => 'submitted',
            'comments' => 'تم الإرسال للمراجعة الأولى',
        ]);

        $this->assertCount(1, $book->reviews);
        $this->assertEquals('submitted', $book->reviews->first()->action);

        // Record a publication history entry
        $history = BookPublicationHistory::create([
            'book_id' => $book->id,
            'user_id' => $user->id,
            'event' => 'published',
            'previous_publication_status' => 'unpublished',
            'new_publication_status' => 'published',
            'notes' => 'النشر الأول',
        ]);

        $this->assertCount(1, $book->publicationHistory);
        $this->assertEquals('published', $book->publicationHistory->first()->event);
    }
}

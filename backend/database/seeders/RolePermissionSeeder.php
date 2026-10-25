<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            ['name' => 'عرض الكتب', 'slug' => 'books.view', 'description' => 'الاطلاع على قائمة وتفاصيل الكتب'],
            ['name' => 'إنشاء كتاب', 'slug' => 'books.create', 'description' => 'إنشاء مسودة كتاب جديدة'],
            ['name' => 'تعديل كتاب', 'slug' => 'books.update', 'description' => 'تعديل بيانات وملفات الكتاب'],
            ['name' => 'إرسال للمراجعة', 'slug' => 'books.submit_review', 'description' => 'إرسال مسودة الكتاب للمراجعة والتدقيق'],
            ['name' => 'مراجعة كتاب', 'slug' => 'books.review', 'description' => 'فحص الكتاب وطلب تعديلات عليه'],
            ['name' => 'اعتماد كتاب', 'slug' => 'books.approve', 'description' => 'اعتماد الكتاب وتأهيله للنشر'],
            ['name' => 'نشر كتاب', 'slug' => 'books.publish', 'description' => 'نشر الكتاب على المنصة'],
            ['name' => 'إيقاف نشر كتاب', 'slug' => 'books.unpublish', 'description' => 'إيقاف نشر الكتاب مؤقتاً'],
            ['name' => 'إلغاء نشر نهائي', 'slug' => 'books.cancel_publication', 'description' => 'إلغاء نشر الكتاب نهائياً وأرشفته'],
            ['name' => 'نسخ كتاب ملغى', 'slug' => 'books.copy', 'description' => 'نسخ كتاب ملغى النشر إلى مسودة جديدة'],
        ];

        $permissionModels = [];
        foreach ($permissions as $perm) {
            $permissionModels[$perm['slug']] = Permission::firstOrCreate(
                ['slug' => $perm['slug']],
                ['name' => $perm['name'], 'description' => $perm['description']]
            );
        }

        // Roles
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'مدير عام', 'description' => 'يمتلك كامل الصلاحيات الإدارية']
        );
        $editorRole = Role::firstOrCreate(
            ['slug' => 'editor'],
            ['name' => 'محرر', 'description' => 'إنشاء وتعديل المسودات وإرسالها للمراجعة']
        );
        $reviewerRole = Role::firstOrCreate(
            ['slug' => 'reviewer'],
            ['name' => 'مراجع', 'description' => 'مراجعة الكتب واعتمادها أو طلب تعديلات']
        );
        $publisherRole = Role::firstOrCreate(
            ['slug' => 'publisher'],
            ['name' => 'ناشر', 'description' => 'نشر وإيقاف وإلغاء نشر الكتب']
        );

        // Attach Permissions to Roles
        // Admin: all permissions
        $adminRole->permissions()->sync(collect($permissionModels)->pluck('id'));

        // Editor
        $editorRole->permissions()->sync([
            $permissionModels['books.view']->id,
            $permissionModels['books.create']->id,
            $permissionModels['books.update']->id,
            $permissionModels['books.submit_review']->id,
            $permissionModels['books.copy']->id,
        ]);

        // Reviewer
        $reviewerRole->permissions()->sync([
            $permissionModels['books.view']->id,
            $permissionModels['books.review']->id,
            $permissionModels['books.approve']->id,
        ]);

        // Publisher
        $publisherRole->permissions()->sync([
            $permissionModels['books.view']->id,
            $permissionModels['books.publish']->id,
            $permissionModels['books.unpublish']->id,
            $permissionModels['books.cancel_publication']->id,
        ]);

        // Assign Admin role to existing admin user
        $adminEmail = env('ADMIN_EMAIL', 'admin@platform.test');
        $adminUser = User::where('email', $adminEmail)->first();
        if ($adminUser) {
            $adminUser->roles()->syncWithoutDetaching([$adminRole->id]);
        }
    }
}

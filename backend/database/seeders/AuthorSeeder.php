<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Author;

class AuthorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Author::firstOrCreate(
            ['slug' => 'primary-author'],
            [
                'name' => 'المؤلف الأساسي',
                'bio' => 'نبذة تعريفية أولية عن المؤلف ومشروعه الأدبي (قابلة للتعديل من لوحة الإدارة).',
                'is_default' => true,
            ]
        );
    }
}

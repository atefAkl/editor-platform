<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Author;
use App\Models\Book;
use App\Models\Post;
use App\Models\PostComment;

class FeedSeeder extends Seeder
{
    public function run(): void
    {
        $author = Author::where('is_default', true)->first()
            ?? Author::first();

        if (!$author) {
            return;
        }

        // Only seed if empty
        if (Post::count() > 0) {
            return;
        }

        $book = Book::first();

        // Post 1: Welcome & Literary Reflection (Pinned)
        $post1 = Post::create([
            'author_id' => $author->id,
            'content' => "أهلاً بكم في منصتي الرقمية ومنفذي الأدبي الجديد.\n\nهنا سأشارككم مسودات أفكاري، كواليس الكتابة، والنصوص التي لم تنشر بعد، بالإضافة إلى إشعارات الإصدارات الرسمية والنقاشات المباشرة حول كل ما يمس الكلمة والفكر.\n\nيسعدني جداً أن أقرأ تعليقاتكم وملاحظاتكم على كل منشور. مرحباً بكم في رحلتنا المشتركة! ✍️📖",
            'likes_count' => 24,
            'comments_count' => 2,
            'is_pinned' => true,
            'published_at' => now()->subDays(2),
        ]);

        $post1->comments()->createMany([
            [
                'author_name' => 'أحمد سمير',
                'content' => 'مبارك إطلاق المنصة يا أستاذنا، بانتظار جديدك وإبداعاتك دوماً!',
                'created_at' => now()->subDays(2)->addHours(3),
            ],
            [
                'author_name' => 'سارة محمود',
                'content' => 'خطوة ممتازة للاقتراب من القراء ومشاركتهم مسار الإبداع والتأليف.',
                'created_at' => now()->subDays(2)->addHours(5),
            ],
        ]);

        // Post 2: Book release announcement linked to existing book
        if ($book) {
            $post2 = Post::create([
                'author_id' => $author->id,
                'book_id' => $book->id,
                'content' => "يسعدني الإعلان عن توفر عملي الجديد «{$book->title}» في مكتبة المنصة.\n\nالكتاب يضم تأملات وفصولاً كُتبت على مدى شهور من العزلة والبحث. يمكنكم تصفح نبذة عن العمل ومعاينة التفاصيل الكاملة من الرابط المرفق أدناه.\n\nأتمنى لكم قراءة ماتعة وبانتظار انطباعاتكم!",
                'image_path' => $book->cover_image_path,
                'likes_count' => 45,
                'comments_count' => 3,
                'is_pinned' => false,
                'published_at' => now()->subHours(18),
            ]);

            $post2->comments()->createMany([
                [
                    'author_name' => 'محمود عزت',
                    'content' => 'قرأت الفصل الأول من الكتاب، أسلوب سردي ممتع وعميق كعادتك.',
                    'created_at' => now()->subHours(15),
                ],
                [
                    'author_name' => 'د. خالد إبراهيم',
                    'content' => 'إضافة حقيقية للمكتبة العربية المعاصرة. خالص التهاني والتقدير.',
                    'created_at' => now()->subHours(12),
                ],
                [
                    'author_name' => 'نورا حسن',
                    'content' => 'هل ستتوفر نسخة مطبوعة في المعرض القادم؟',
                    'created_at' => now()->subHours(8),
                ],
            ]);
        }

        // Post 3: Short literary piece / quote
        $post3 = Post::create([
            'author_id' => $author->id,
            'content' => "«الكتابة ليست مجرد ترف أو مهنة عابرة؛ إنها محاولة حثيثة لترتيب الفوضى التي تسكننا، ومنح الصوت لمن لا صوت لهم في صخب هذا العالم.»\n\n— من مسودات اليوم، بين قهوة الصباح وتأملات المغيب.",
            'likes_count' => 19,
            'comments_count' => 1,
            'is_pinned' => false,
            'published_at' => now()->subHours(4),
        ]);

        $post3->comments()->create([
            'author_name' => 'ياسمين فؤاد',
            'content' => 'كلمات تمس الوجدان وتلخص جوهر الأدب الصادق.',
            'created_at' => now()->subHours(2),
        ]);
    }
}

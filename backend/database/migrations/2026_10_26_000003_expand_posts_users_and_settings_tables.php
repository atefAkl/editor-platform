<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('type', 50)->default('thought')->after('author_id'); // thought (خاطرة), article (مقال), news (خبر), book_release (إصدار/مؤلف)
            $table->string('title', 255)->nullable()->after('type');
            $table->string('file_path', 255)->nullable()->after('image_path');
            $table->string('file_name', 255)->nullable()->after('file_path');
            $table->unsignedBigInteger('file_size')->nullable()->after('file_name');
            $table->index('type');
        });

        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key', 100)->unique();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar', 255)->nullable()->after('email');
            $table->text('bio')->nullable()->after('avatar');
            $table->json('reading_preferences')->nullable()->after('bio');
            $table->string('google_id', 100)->nullable()->after('reading_preferences');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'bio', 'reading_preferences', 'google_id']);
        });

        Schema::dropIfExists('platform_settings');

        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['type']);
            $table->dropColumn(['type', 'title', 'file_path', 'file_name', 'file_size']);
        });
    }
};

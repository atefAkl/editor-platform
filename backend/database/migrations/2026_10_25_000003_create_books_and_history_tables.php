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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title', 255);
            $table->string('subtitle', 255)->nullable();
            $table->string('slug', 255)->unique();
            $table->text('description')->nullable();
            $table->mediumText('introduction')->nullable();
            $table->foreignId('author_id')->constrained('authors')->restrictOnDelete();
            $table->date('declared_publication_date')->nullable();
            $table->string('cover_image_path', 255)->nullable();
            $table->string('book_file_path', 255)->nullable();
            $table->string('book_file_type', 50)->nullable();
            $table->unsignedBigInteger('book_file_size')->nullable();
            $table->string('workflow_status', 30)->default('draft');
            $table->string('publication_status', 30)->default('unpublished');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamp('last_content_updated_at')->nullable();
            $table->foreignId('copied_from_book_id')->nullable()->constrained('books')->nullOnDelete();
            $table->timestamps();

            $table->index(['workflow_status', 'publication_status']);
        });

        Schema::create('book_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 30); // submitted, approved, changes_requested, resubmitted
            $table->text('comments')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('book_publication_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('book_id')->constrained('books')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('event', 30); // published, temporarily_unpublished, republished, cancelled
            $table->string('previous_publication_status', 30);
            $table->string('new_publication_status', 30);
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('book_publication_history');
        Schema::dropIfExists('book_reviews');
        Schema::dropIfExists('books');
    }
};

<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\AuthorController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BookWorkflowController;
use App\Http\Controllers\Api\PublicCatalogController;
use App\Http\Controllers\Api\FeedController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\UserProfileController;

// Public Front-End Catalog Routes
Route::get('/catalog', [PublicCatalogController::class, 'publications']);
Route::get('/catalog/publications', [PublicCatalogController::class, 'publications']);
Route::get('/catalog/books/{slug}', [PublicCatalogController::class, 'bookDetails']);

// Public Social Media Feed & Discussion Routes
Route::get('/feed', [FeedController::class, 'index']);
Route::get('/feed/{id}', [FeedController::class, 'show']);
Route::post('/feed/{id}/like', [FeedController::class, 'like']);
Route::get('/settings', [SettingsController::class, 'get']);

// Public Auth routes (Credentials & Registration & Google Sign-In)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/auth/google', [UserProfileController::class, 'googleLogin']);

// Authenticated protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Feed comments & publishing (Restricted to logged-in users)
    Route::post('/feed', [FeedController::class, 'store']);
    Route::post('/feed/{id}/comments', [FeedController::class, 'addComment']);

    // User Profile (Public Reader & Admin staff)
    Route::get('/profile', [UserProfileController::class, 'get']);
    Route::put('/profile', [UserProfileController::class, 'update']);
    Route::put('/profile/password', [UserProfileController::class, 'updatePassword']);

    // Platform & Author Settings
    Route::put('/settings', [SettingsController::class, 'update']);

    // Authors
    Route::get('/authors', [AuthorController::class, 'index']);
    Route::put('/authors/{author}', [AuthorController::class, 'update']);

    // Books Core
    Route::get('/books', [BookController::class, 'index']);
    Route::post('/books', [BookController::class, 'store']);
    Route::get('/books/{book}', [BookController::class, 'show']);
    Route::match(['put', 'post'], '/books/{book}', [BookController::class, 'update']);

    // Book Editorial & Publication Lifecycle
    Route::post('/books/{book}/submit-review', [BookWorkflowController::class, 'submitReview']);
    Route::post('/books/{book}/request-changes', [BookWorkflowController::class, 'requestChanges']);
    Route::post('/books/{book}/approve', [BookWorkflowController::class, 'approve']);
    Route::post('/books/{book}/publish', [BookWorkflowController::class, 'publish']);
    Route::post('/books/{book}/unpublish', [BookWorkflowController::class, 'unpublish']);
    Route::post('/books/{book}/republish', [BookWorkflowController::class, 'republish']);
    Route::post('/books/{book}/cancel-publication', [BookWorkflowController::class, 'cancelPublication']);
    Route::post('/books/{book}/copy', [BookWorkflowController::class, 'copy']);
});

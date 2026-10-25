<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\AuthorController;
use App\Http\Controllers\Api\BookController;
use App\Http\Controllers\Api\BookWorkflowController;
use App\Http\Controllers\Api\PublicCatalogController;

// Public Front-End Catalog Routes (Publicly Visible Books only)
Route::get('/catalog', [PublicCatalogController::class, 'home']);
Route::get('/catalog/books/{slug}', [PublicCatalogController::class, 'bookDetails']);

// Public Auth routes
Route::post('/login', [AuthController::class, 'login']);

// Authenticated protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Authors
    Route::get('/authors', [AuthorController::class, 'index']);
    Route::put('/authors/{author}', [AuthorController::class, 'update']);

    // Books Core (Note: No DELETE route exists - permanent deletion is explicitly prohibited)
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

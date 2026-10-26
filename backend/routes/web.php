<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

/*
|--------------------------------------------------------------------------
| Public Storage Media Fallback Route (Shared Hosting Compatibility)
|--------------------------------------------------------------------------
| If the hosting environment does not support symbolic links (public/storage),
| this route transparently serves public files from storage/app/public.
*/
Route::get('/storage/{path}', function (string $path) {
    if (! Storage::disk('public')->exists($path)) {
        abort(404);
    }

    return Storage::disk('public')->response($path);
})->where('path', '.*');

/*
|--------------------------------------------------------------------------
| SPA Front-End (React build)
|--------------------------------------------------------------------------
| In production the compiled React app is copied into public/ :
|   public/app.html   -> the SPA shell (renamed from Vite's index.html so that
|                        Apache's DirectoryIndex never bypasses Laravel)
|   public/assets/*   -> hashed JS/CSS bundles (served directly by the web server)
|
| Every non-API path is answered with the SPA shell so React Router can handle
| deep links such as /publications, /posts/5 or /admin/books on page refresh.
*/
Route::get('/{any?}', function () {
    $shell = public_path('app.html');

    if (! file_exists($shell)) {
        return response('Front-end build not found. Run the deploy build script, or use the Vite dev server in development.', 404);
    }

    return response()->file($shell, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ]);
})->where('any', '^(?!api|sanctum|storage|up).*$');

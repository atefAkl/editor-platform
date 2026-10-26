<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Author;
use App\Models\PlatformSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    /**
     * Get public & general platform settings.
     */
    public function get(): JsonResponse
    {
        $primaryAuthor = Author::where('is_default', true)->first()
            ?? Author::orderBy('id', 'asc')->first();

        $settings = [
            'site_name' => PlatformSetting::get('site_name', 'منصة الكاتب الرقمية'),
            'tagline' => PlatformSetting::get('tagline', 'المنصة الأدبية لنشر المؤلفات والمقالات والأفكار'),
            'contact_email' => PlatformSetting::get('contact_email', 'author@example.com'),
            'facebook_url' => PlatformSetting::get('facebook_url', 'https://facebook.com'),
            'twitter_url' => PlatformSetting::get('twitter_url', 'https://x.com'),
            'author' => $primaryAuthor,
        ];

        return $this->success($settings, 'تم جلب الإعدادات بنجاح.');
    }

    /**
     * Update platform & author general settings (Admin only).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:255'],
            'author_bio' => ['nullable', 'string'],
            'author_avatar' => ['nullable', 'image', 'max:5120'],
            'site_name' => ['nullable', 'string', 'max:255'],
            'tagline' => ['nullable', 'string', 'max:500'],
            'contact_email' => ['nullable', 'email'],
            'facebook_url' => ['nullable', 'string', 'max:255'],
            'twitter_url' => ['nullable', 'string', 'max:255'],
        ]);

        $primaryAuthor = Author::where('is_default', true)->first()
            ?? Author::first();

        if ($primaryAuthor) {
            $primaryAuthor->name = $validated['author_name'];
            if (isset($validated['author_bio'])) {
                $primaryAuthor->bio = $validated['author_bio'];
            }
            if ($request->hasFile('author_avatar')) {
                $avatarPath = $request->file('author_avatar')->store('authors/avatars', 'public');
                $primaryAuthor->avatar = $avatarPath;
            }
            $primaryAuthor->save();
        }

        if (isset($validated['site_name'])) {
            PlatformSetting::set('site_name', $validated['site_name']);
        }
        if (isset($validated['tagline'])) {
            PlatformSetting::set('tagline', $validated['tagline']);
        }
        if (isset($validated['contact_email'])) {
            PlatformSetting::set('contact_email', $validated['contact_email']);
        }
        if (isset($validated['facebook_url'])) {
            PlatformSetting::set('facebook_url', $validated['facebook_url']);
        }
        if (isset($validated['twitter_url'])) {
            PlatformSetting::set('twitter_url', $validated['twitter_url']);
        }

        return $this->success([
            'author' => $primaryAuthor,
            'site_name' => PlatformSetting::get('site_name'),
            'tagline' => PlatformSetting::get('tagline'),
            'contact_email' => PlatformSetting::get('contact_email'),
            'facebook_url' => PlatformSetting::get('facebook_url'),
            'twitter_url' => PlatformSetting::get('twitter_url'),
        ], 'تم تحديث الإعدادات وبيانات المؤلف بنجاح.');
    }
}

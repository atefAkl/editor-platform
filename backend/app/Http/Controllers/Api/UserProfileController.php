<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class UserProfileController extends Controller
{
    /**
     * Get authenticated user profile.
     */
    public function get(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('roles.permissions');

        $permissions = $user->getAllPermissions();

        return $this->success([
            'user' => $user,
            'roles' => $user->roles->pluck('slug'),
            'permissions' => $permissions,
        ], 'تم جلب ملف المستخدم بنجاح.');
    }

    /**
     * Update profile details.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'reading_preferences' => ['nullable', 'array'],
            'avatar' => ['nullable', 'image', 'max:5120'],
        ]);

        $user->name = $validated['name'];
        if (array_key_exists('bio', $validated)) {
            $user->bio = $validated['bio'];
        }
        if (array_key_exists('reading_preferences', $validated)) {
            $user->reading_preferences = $validated['reading_preferences'];
        }

        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('users/avatars', 'public');
            $user->avatar = $avatarPath;
        }

        $user->save();

        return $this->success($user, 'تم تحديث الملف الشخصي بنجاح.');
    }

    /**
     * Update user password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'current_password.required' => 'كلمة المرور الحالية مطلوبة.',
            'password.required' => 'كلمة المرور الجديدة مطلوبة.',
            'password.min' => 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        if (!Hash::check($validated['current_password'], $user->password)) {
            return $this->error('كلمة المرور الحالية غير صحيحة.', [
                'current_password' => ['كلمة المرور الحالية غير صحيحة.']
            ], 422);
        }

        $user->password = Hash::make($validated['password']);
        $user->save();

        return $this->success(null, 'تم تغيير كلمة المرور بنجاح.');
    }

    /**
     * Reader / Audience Google authentication or simulated social login.
     *
     * SECURITY: This is a DEMO-ONLY simulated login. It trusts the email sent by the
     * client without verifying a Google ID token, so it would allow logging in as ANY
     * user (including admins). It is therefore hard-disabled outside the local env.
     * Replace with real Google OAuth (e.g. Laravel Socialite) before enabling in production.
     */
    public function googleLogin(Request $request): JsonResponse
    {
        if (! app()->environment('local')) {
            return $this->error('تسجيل الدخول بحساب جوجل غير مفعّل حالياً.', null, 404);
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'name' => ['required', 'string'],
            'google_id' => ['nullable', 'string'],
            'avatar' => ['nullable', 'string'],
        ]);

        $user = User::firstOrCreate(
            ['email' => $validated['email']],
            [
                'name' => $validated['name'],
                'password' => Hash::make(str()->random(24)),
                'google_id' => $validated['google_id'] ?? 'mock_google_id_' . time(),
                'avatar' => $validated['avatar'] ?? null,
            ]
        );

        Auth::login($user);
        $request->session()->regenerate();

        return $this->success([
            'user' => $user,
            'message' => 'تم تسجيل الدخول بحساب جوجل بنجاح.',
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Authenticate user with email and password.
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني المدخل غير صالح.',
            'password.required' => 'كلمة المرور مطلوبة.',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();
            $user = Auth::user();
            $user->load('roles.permissions');
            $data = $user->toArray();
            $data['roles'] = $user->roles->pluck('name')->all();
            $data['permissions'] = $user->getAllPermissions();

            return $this->success($data, 'تم تسجيل الدخول بنجاح.');
        }

        return $this->error('بيانات تسجيل الدخول غير صحيحة، يرجى التحقق من البريد وكلمة المرور.', null, 401);
    }

    /**
     * Real email registration for audience & readers.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'name.required' => 'الاسم مطلوب.',
            'name.max' => 'يجب ألا يتجاوز الاسم 255 حرفاً.',
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'البريد الإلكتروني غير صالح.',
            'email.unique' => 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول بدلاً من ذلك.',
            'password.required' => 'كلمة المرور مطلوبة.',
            'password.min' => 'يجب ألا تقل كلمة المرور عن 8 أحرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق مع كلمة المرور المدخلة.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Assign 'reader' role automatically
        $readerRole = Role::firstOrCreate(
            ['slug' => 'reader'],
            ['name' => 'قارئ', 'description' => 'عضو وقارئ عام للمنصة والمؤلفات']
        );
        $user->roles()->syncWithoutDetaching([$readerRole->id]);

        Auth::login($user);
        $request->session()->regenerate();

        $user->load('roles.permissions');
        $data = $user->toArray();
        $data['roles'] = $user->roles->pluck('name')->all();
        $data['permissions'] = $user->getAllPermissions();

        return $this->success($data, 'تم إنشاء حساب القارئ بنجاح، أهلاً بك في المنصة!', 201);
    }

    /**
     * Logout authenticated user.
     */
    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->success(null, 'تم تسجيل الخروج بنجاح.');
    }

    /**
     * Get current authenticated user profile and permissions.
     */
    public function user(Request $request)
    {
        $user = $request->user();
        $user->load('roles.permissions');
        $data = $user->toArray();
        $data['roles'] = $user->roles->pluck('name')->all();
        $data['permissions'] = $user->getAllPermissions();

        return $this->success($data);
    }
}

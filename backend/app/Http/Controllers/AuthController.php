<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();
            $user = Auth::user();
            $user->load('roles.permissions');
            $data = $user->toArray();
            $data['roles'] = $user->roles->pluck('name')->all();
            $data['permissions'] = $user->getAllPermissions();
            return $this->success($data, 'Logged in successfully');
        }

        return $this->error('The provided credentials do not match our records.', null, 401);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->success(null, 'Logged out successfully');
    }

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

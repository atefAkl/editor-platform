import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { Button } from '../components/atoms/Button';

export const AdminProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('name', name);
      formData.append('bio', bio);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await apiClient.post('/api/profile', formData);
      if (res.success) {
        setProfileSuccess('تم حفظ بيانات الملف الشخصي بنجاح.');
        await refreshUser();
      }
    } catch (err: any) {
      setProfileError(err.message || 'فشل في تحديث الملف الشخصي.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setSavingPassword(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    try {
      const res = await apiClient.put('/api/profile/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (res.success) {
        setPasswordSuccess('تم تغيير كلمة المرور بنجاح.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'فشل في تغيير كلمة المرور.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
        <p className="text-sm text-gray-500 mt-1">
          إدارة بياناتك الشخصية، الصلاحيات المسندة، وتأمين حساب المشرف.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4 text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-4xl shadow-sm overflow-hidden">
            {user?.avatar ? (
              <img src={`/storage/${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0) || 'م'
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900">{user?.name}</h2>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>

          <div className="pt-3 border-t border-gray-100 text-right space-y-2">
            <span className="text-xs font-bold text-gray-700 block">الأدوار المسندة:</span>
            <div className="flex flex-wrap gap-1">
              {user?.roles && user.roles.length > 0 ? (
                user.roles.map((r) => (
                  <span key={r} className="text-[11px] font-bold bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-0.5 rounded-full">
                    {r}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">عضو</span>
              )}
            </div>
          </div>
        </div>

        {/* Update Profile Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleProfileSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              تحديث المعلومات الأساسية
            </h3>

            {profileSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-sm font-semibold">
                ✓ {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm font-semibold">
                ✕ {profileError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الاسم</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">تحديث الصورة الشخصية</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="block w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">نبذة تعريفية</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="نبذة عن المشرف أو المحرر..."
                className="w-full p-3.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" disabled={savingProfile}>
                {savingProfile ? 'جاري الحفظ...' : 'حفظ البيانات'}
              </Button>
            </div>
          </form>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
              تغيير كلمة المرور
            </h3>

            {passwordSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-sm font-semibold">
                ✓ {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-sm font-semibold">
                ✕ {passwordError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور الحالية</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" disabled={savingPassword}>
                {savingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

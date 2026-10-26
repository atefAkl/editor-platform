import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { PlatformLayout } from '../templates/PlatformLayout';
import { Button } from '../components/atoms/Button';

const READING_GENRES = [
  { id: 'novels', label: 'روايات أدبية' },
  { id: 'short_stories', label: 'مجموعات قصصية' },
  { id: 'poetry', label: 'دواوين شعرية' },
  { id: 'articles', label: 'مقالات نقدية وفكرية' },
  { id: 'thoughts', label: 'خواطر وتأملات' },
];

export const PublicProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [preferences, setPreferences] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'purchases' | 'favorites'>('info');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setPreferences(user.reading_preferences || ['novels', 'articles']);
    }
  }, [user]);

  const toggleGenre = (genreId: string) => {
    setPreferences((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('name', name);
      formData.append('bio', bio);
      preferences.forEach((p) => formData.append('reading_preferences[]', p));
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await apiClient.post('/api/profile', formData);
      if (res.success) {
        setSuccessMsg('تم حفظ وتحديث بيانات ملفك الشخصي وتفضيلاتك بنجاح.');
        await refreshUser();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في حفظ البيانات.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <PlatformLayout>
        <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl shadow-sm border border-gray-200 text-center space-y-4">
          <span className="text-4xl">👤</span>
          <h2 className="text-xl font-bold text-gray-900">تسجيل الدخول مطلوب</h2>
          <p className="text-sm text-gray-500">يرجى تسجيل الدخول للوصول إلى ملفك الشخصي وتخصيص قراءاتك.</p>
        </div>
      </PlatformLayout>
    );
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-3xl shadow-sm overflow-hidden shrink-0">
            {user.avatar ? (
              <img src={`/storage/${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name.charAt(0)
            )}
          </div>

          <div className="flex-1 text-center sm:text-right space-y-1">
            <h1 className="text-2xl font-extrabold text-gray-900">{user.name}</h1>
            <p className="text-xs text-gray-500 font-medium">{user.email}</p>
            <p className="text-sm text-gray-600 mt-2 max-w-xl">
              {user.bio || 'قارئ أدبي متفاعل في منصة النشر الرقمية.'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'info'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            تعديل البيانات والتفضيلات
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            مكتبتي ومشترياتي الأدبية
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            المحفوظات وقائمتي القرائية
          </button>
        </div>

        {/* Tab 1: Info & Preferences Form */}
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-200 space-y-6">
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold">
                ✓ {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">
                ✕ {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  تحديث الصورة الشخصية (Avatar)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                نبذة عن القارئ واهتماماته
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب نبذة قصيرة عن نفسك واهتماماتك الأدبية..."
                className="w-full p-3.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden resize-none"
              />
            </div>

            {/* Reading preferences customization */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">تخصيص اهتمامات القراءة (Reading Preferences)</h3>
                <p className="text-xs text-gray-500">اختر التصنيفات الأدبية التي تفضل متابعتها في الخلاصة والمكتبة:</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {READING_GENRES.map((genre) => {
                  const isSelected = preferences.includes(genre.id);
                  return (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary-600 text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '} {genre.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button type="submit" variant="primary" disabled={saving} className="px-6">
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Purchases */}
        {activeTab === 'purchases' && (
          <div className="bg-white p-12 rounded-2xl shadow-xs border border-gray-200 text-center space-y-3">
            <span className="text-4xl block">💳</span>
            <h3 className="text-lg font-bold text-gray-900">سجل المشتريات والمؤلفات الرقمية</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              هذا القسم مجهز لتوثيق مشترياتك من الكتب والمؤلفات الحصرية وتحميل النسخ المدفوعة فور تدشين بوابة الدفع الإلكتروني.
            </p>
          </div>
        )}

        {/* Tab 3: Favorites */}
        {activeTab === 'favorites' && (
          <div className="bg-white p-12 rounded-2xl shadow-xs border border-gray-200 text-center space-y-3">
            <span className="text-4xl block">📑</span>
            <h3 className="text-lg font-bold text-gray-900">قائمة القراءة والمحفوظات</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              يمكنك هنا الوصول إلى المنشورات والمقالات التي قمت بحفظها للرجوع إليها لاحقاً.
            </p>
          </div>
        )}
      </div>
    </PlatformLayout>
  );
};

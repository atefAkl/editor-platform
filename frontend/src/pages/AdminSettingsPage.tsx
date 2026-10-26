import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { Button } from '../components/atoms/Button';

export const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Author fields
  const [authorName, setAuthorName] = useState('');
  const [authorBio, setAuthorBio] = useState('');
  const [currentAuthorAvatar, setCurrentAuthorAvatar] = useState<string | null>(null);
  const [authorAvatarFile, setAuthorAvatarFile] = useState<File | null>(null);

  // General settings
  const [siteName, setSiteName] = useState('');
  const [tagline, setTagline] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/settings');
      if (res.success && res.data) {
        const d = res.data;
        setSiteName(d.site_name || '');
        setTagline(d.tagline || '');
        setContactEmail(d.contact_email || '');
        setFacebookUrl(d.facebook_url || '');
        setTwitterUrl(d.twitter_url || '');

        if (d.author) {
          setAuthorName(d.author.name || '');
          setAuthorBio(d.author.bio || '');
          setCurrentAuthorAvatar(d.author.avatar || null);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في تحميل الإعدادات.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('author_name', authorName);
      formData.append('author_bio', authorBio);
      formData.append('site_name', siteName);
      formData.append('tagline', tagline);
      formData.append('contact_email', contactEmail);
      formData.append('facebook_url', facebookUrl);
      formData.append('twitter_url', twitterUrl);

      if (authorAvatarFile) {
        formData.append('author_avatar', authorAvatarFile);
      }

      const res = await apiClient.post('/api/settings', formData);
      if (res.success) {
        setSuccessMsg('تم حفظ وتحديث الإعدادات العامة وبيانات المؤلف بنجاح.');
        await fetchSettings();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل في حفظ الإعدادات.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full mb-2" />
        <p className="text-sm text-gray-500">جاري تحميل الإعدادات العامة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات العامة وهوية المؤلف</h1>
        <p className="text-sm text-gray-500 mt-1">
          ضبط اسم المؤلف الأساسي، النبذة الأدبية، وعناوين المنصة والروابط الاجتماعية.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs space-y-6">
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

        {/* Primary Author Identity Section */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <span>✍️</span>
            <span>بيانات وهوية المؤلف الأساسي</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                اسم المؤلف الأساسي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="مثال: د. عاطف عقل"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
              <p className="text-[11px] text-gray-400 mt-1">يظهر هذا الاسم في ترويسة المنصة وصفحة المؤلفات والخلاصة.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                صورة المؤلف الشخصية
              </label>
              <div className="flex items-center gap-3">
                {currentAuthorAvatar && (
                  <img
                    src={`/storage/${currentAuthorAvatar}`}
                    alt="صورة المؤلف"
                    className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAuthorAvatarFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              النبذة الأدبية والتعريفية عن المؤلف
            </label>
            <textarea
              rows={4}
              value={authorBio}
              onChange={(e) => setAuthorBio(e.target.value)}
              placeholder="اكتب نبذة تعريفية شاملة عن المؤلف، مسيرته، ومؤلفاته الأدبية..."
              className="w-full p-3.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden resize-none"
            />
          </div>
        </div>

        {/* Platform Settings Section */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <span>⚙️</span>
            <span>إعدادات وهوية المنصة الرقمية</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم المنصة الرقمية</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="منصة النشر الأدبي"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">بريد التواصل والدعم</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@author.com"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">الشعار اللفظي للمنصة (Tagline)</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="نافذة المؤلف الرسمية لنشر الأعمال الأدبية والتواصل المباشر مع القراء"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
            <span>🌐</span>
            <span>روابط التواصل الاجتماعي</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">صفحة فيسبوك الرسمية</label>
              <input
                type="text"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/author.page"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">حساب منصة X / تويتر</label>
              <input
                type="text"
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://x.com/author"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button type="submit" variant="primary" disabled={saving} className="px-8 font-bold">
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات بالكامل'}
          </Button>
        </div>
      </form>
    </div>
  );
};

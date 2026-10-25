import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from '../components/atoms/Button';

interface AuthorOption {
  id: number;
  name: string;
  is_default: boolean;
}

export const BookCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [authorId, setAuthorId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [declaredDate, setDeclaredDate] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch authors
    apiClient.get('/api/authors').then((res) => {
      if (res.success && res.data.length > 0) {
        setAuthors(res.data);
        const defaultAuthor = res.data.find((a: AuthorOption) => a.is_default) || res.data[0];
        setAuthorId(String(defaultAuthor.id));
      }
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      if (subtitle) formData.append('subtitle', subtitle);
      if (description) formData.append('description', description);
      if (introduction) formData.append('introduction', introduction);
      if (authorId) formData.append('author_id', authorId);
      if (declaredDate) formData.append('declared_publication_date', declaredDate);
      if (coverFile) formData.append('cover_image', coverFile);
      if (bookFile) formData.append('book_file', bookFile);

      // Using raw fetch for multipart form-data to let browser set boundary
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'حدث خطأ أثناء حفظ الكتاب.');
      }

      navigate(`/admin/books/${data.data.id}`);
    } catch (err: any) {
      setError(err.message || 'فشل في إنشاء مسودة الكتاب.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إنشاء مسودة كتاب جديدة</h1>
          <p className="text-sm text-gray-500 mt-1">
            يمكن حفظ المسودة بدون غلاف أو ملف كتاب، ورفعهما لاحقاً قبل الاعتماد والنشر.
          </p>
        </div>
        <Link to="/admin/books">
          <Button variant="secondary" size="sm">
            رجوع للقائمة
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              عنوان الكتاب <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: في أثر الغمام"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الفرعي (اختياري)</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="مثال: نصوص وتأملات في الأدب"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المؤلف <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name} {author.is_default ? '(المؤلف الأساسي)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النشر المعلن للكتاب (اختياري)</label>
            <input
              type="date"
              value={declaredDate}
              onChange={(e) => setDeclaredDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">وصف الكتاب</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نبذة عامة عن الكتاب..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">مقدمة الكتاب أو نص العينة (اختياري)</label>
            <textarea
              rows={4}
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              placeholder="مقدمة الكتاب..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              صورة الغلاف (اختياري للمسودة)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400 mt-1">PNG, JPEG, WEBP حتى 5MB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملف الكتاب (اختياري للمسودة)
            </label>
            <input
              type="file"
              accept="application/pdf,.epub"
              onChange={(e) => setBookFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400 mt-1">PDF, EPUB حتى 50MB (مخزن في مساحة خاصة آمنة)</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link to="/admin/books">
            <Button type="button" variant="secondary">
              إلغاء
            </Button>
          </Link>
          <Button type="submit" variant="primary" loading={loading}>
            حفظ المسودة
          </Button>
        </div>
      </form>
    </div>
  );
};

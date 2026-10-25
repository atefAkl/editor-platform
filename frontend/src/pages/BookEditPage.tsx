import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from '../components/atoms/Button';
import { WorkflowBadge, PublicationBadge } from '../components/atoms/Badge';

interface AuthorOption {
  id: number;
  name: string;
  is_default: boolean;
}

export const BookEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [authorId, setAuthorId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [declaredDate, setDeclaredDate] = useState('');
  const [currentCover, setCurrentCover] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);

  const [workflowStatus, setWorkflowStatus] = useState('draft');
  const [publicationStatus, setPublicationStatus] = useState('unpublished');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [authorsRes, bookRes] = await Promise.all([
          apiClient.get('/api/authors'),
          apiClient.get(`/api/books/${id}`),
        ]);

        if (authorsRes.success) {
          setAuthors(authorsRes.data);
        }

        if (bookRes.success) {
          const b = bookRes.data.book;
          setTitle(b.title || '');
          setSubtitle(b.subtitle || '');
          setDescription(b.description || '');
          setIntroduction(b.introduction || '');
          setDeclaredDate(b.declared_publication_date ? b.declared_publication_date.substring(0, 10) : '');
          setAuthorId(String(b.author_id));
          setCurrentCover(b.cover_image_path);
          setCurrentFile(b.book_file_path);
          setWorkflowStatus(b.workflow_status);
          setPublicationStatus(b.publication_status);
        }
      } catch (err: any) {
        setError(err.message || 'فشل في تحميل بيانات الكتاب.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('title', title);
      formData.append('author_id', authorId);
      if (subtitle) formData.append('subtitle', subtitle);
      if (description) formData.append('description', description);
      if (introduction) formData.append('introduction', introduction);
      if (declaredDate) formData.append('declared_publication_date', declaredDate);
      if (coverFile) formData.append('cover_image', coverFile);
      if (bookFile) formData.append('book_file', bookFile);

      const res = await fetch(`/api/books/${id}`, {
        method: 'POST', // using POST with _method=PUT for multipart support
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || 'حدث خطأ أثناء تعديل الكتاب.');
      }

      navigate(`/admin/books/${id}`);
    } catch (err: any) {
      setError(err.message || 'فشل في حفظ التعديلات.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-16 text-center rounded-xl border border-gray-200 text-gray-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full mb-3" />
        <p>جاري تحميل نموذج تعديل الكتاب...</p>
      </div>
    );
  }

  const isPublishedOrApproved = ['published', 'temporarily_unpublished'].includes(publicationStatus) || workflowStatus === 'approved';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/books" className="hover:underline">الكتب</Link>
            <span>/</span>
            <Link to={`/admin/books/${id}`} className="hover:underline">الكتاب #{id}</Link>
            <span>/</span>
            <span>تعديل</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">تعديل بيانات الكتاب</h1>
        </div>
        <div className="flex items-center gap-2">
          <WorkflowBadge status={workflowStatus} />
          <PublicationBadge status={publicationStatus} />
        </div>
      </div>

      {/* Warning Notice if Published */}
      {isPublishedOrApproved && (
        <div className="bg-amber-50 border-r-4 border-amber-500 p-4 rounded-xl text-amber-800 text-sm space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            ⚠️ تنبيه هام لدورة العمل:
          </p>
          <p>
            هذا الكتاب معتمد أو منشور حالياً. حفظ أي تعديل جوهري على المحتوى (العنوان، الوصف، الملفات، إلخ) 
            <strong> سيؤدي تلقائياً إلى سحبه من النشر وإعادته إلى مسودة (Draft)</strong> ليتطلب المراجعة والاعتماد مجدداً.
          </p>
        </div>
      )}

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان الفرعي</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النشر المعلن للكتاب</label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">المقدمة أو العينة</label>
            <textarea
              rows={4}
              value={introduction}
              onChange={(e) => setIntroduction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Cover image replace */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              صورة الغلاف (اختياري للاستبدال)
            </label>
            {currentCover && (
              <div className="mb-2">
                <span className="text-xs text-gray-400 block mb-1">الغلاف الحالي:</span>
                <img
                  src={`/storage/${currentCover}`}
                  alt="الغلاف الحالي"
                  className="w-24 h-32 object-cover rounded border border-gray-200"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400 mt-1">اتركه فارغاً للحفاظ على الغلاف الحالي</p>
          </div>

          {/* Book file replace */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ملف الكتاب (اختياري للاستبدال)
            </label>
            {currentFile ? (
              <div className="mb-2 text-xs text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                ✓ يوجد ملف كتاب مرفوع حالياً
              </div>
            ) : (
              <div className="mb-2 text-xs text-gray-400">لا يوجد ملف مرفوع حالياً</div>
            )}
            <input
              type="file"
              accept="application/pdf,.epub"
              onChange={(e) => setBookFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            <p className="text-xs text-gray-400 mt-1">اتركه فارغاً للحفاظ على الملف الحالي</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Link to={`/admin/books/${id}`}>
            <Button type="button" variant="secondary">
              إلغاء
            </Button>
          </Link>
          <Button type="submit" variant="primary" loading={submitting}>
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
};

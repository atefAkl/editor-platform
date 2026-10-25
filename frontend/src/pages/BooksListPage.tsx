import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { WorkflowBadge, PublicationBadge } from '../components/atoms/Badge';
import { Button } from '../components/atoms/Button';

export interface BookItem {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  workflow_status: string;
  publication_status: string;
  author?: { id: number; name: string };
  creator?: { id: number; name: string };
  cover_image_path?: string;
  created_at: string;
}

export const BooksListPage: React.FC = () => {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [workflowFilter, setWorkflowFilter] = useState('');
  const [publicationFilter, setPublicationFilter] = useState('');
  const navigate = useNavigate();

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (workflowFilter) params.append('workflow_status', workflowFilter);
      if (publicationFilter) params.append('publication_status', publicationFilter);

      const response = await apiClient.get(`/api/books?${params.toString()}`);
      if (response.success) {
        setBooks(response.data.data);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل قائمة الكتب');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [workflowFilter, publicationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الكتب ومسار النشر</h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة مسودات الكتب، المراجعة والاعتماد، والنشر وفق الصلاحيات المعتمدة.
          </p>
        </div>
        <Link to="/admin/books/create">
          <Button variant="primary">
            + إنشاء مسودة كتاب
          </Button>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-96 flex gap-2">
          <input
            type="text"
            placeholder="البحث بالعنوان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="submit" variant="secondary" size="sm">
            بحث
          </Button>
        </form>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={workflowFilter}
            onChange={(e) => setWorkflowFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع حالات سير العمل</option>
            <option value="draft">مسودة</option>
            <option value="in_review">قيد المراجعة</option>
            <option value="changes_requested">بحاجة لتعديلات</option>
            <option value="approved">معتمد</option>
          </select>

          <select
            value={publicationFilter}
            onChange={(e) => setPublicationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">جميع حالات النشر</option>
            <option value="unpublished">غير منشور</option>
            <option value="published">منشور</option>
            <option value="temporarily_unpublished">موقوف مؤقتاً</option>
            <option value="publication_cancelled">ملغى النشر</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Loading & Table State */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-gray-500">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full mb-3" />
          <p>جاري تحميل قائمة الكتب...</p>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-xl border border-gray-200 text-gray-500 space-y-4">
          <p className="text-lg font-medium text-gray-700">لا توجد كتب مسجلة حالياً</p>
          <p className="text-sm text-gray-500">ابدأ بإنشاء أول مسودة كتاب الآن للانطلاق في دورة المراجعة والنشر.</p>
          <Link to="/admin/books/create">
            <Button variant="primary" size="md">
              إنشاء أول مسودة
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-right">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">الكتاب</th>
                  <th className="px-6 py-3.5">المؤلف</th>
                  <th className="px-6 py-3.5">سير العمل التحريري</th>
                  <th className="px-6 py-3.5">حالة النشر</th>
                  <th className="px-6 py-3.5">تاريخ الإنشاء</th>
                  <th className="px-6 py-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{book.title}</div>
                      {book.subtitle && (
                        <div className="text-xs text-gray-500 mt-0.5">{book.subtitle}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {book.author?.name || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <WorkflowBadge status={book.workflow_status} />
                    </td>
                    <td className="px-6 py-4">
                      <PublicationBadge status={book.publication_status} />
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(book.created_at).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/admin/books/${book.id}`}>
                          <Button variant="secondary" size="sm">
                            إدارة وعرض
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Button } from '../components/atoms/Button';

interface PublicBook {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  description?: string;
  cover_image_path?: string;
  declared_publication_date?: string;
  published_at?: string;
  author?: {
    name: string;
    bio?: string;
  };
}

export const PublicHomePage: React.FC = () => {
  const [data, setData] = useState<{ author: any; books: PublicBook[] }>({
    author: null,
    books: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/api/catalog')
      .then((res) => {
        if (res.success) {
          setData(res.data);
        }
      })
      .catch((err) => setError(err.message || 'فشل في تحميل المكتبة'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-primary-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
              م
            </span>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              {data.author?.name || 'منصة المؤلف'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Button variant="secondary" size="sm">
                لوحة الإدارة
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-950 tracking-tight leading-tight">
            مكتبة الأعمال الأدبية والمؤلفات
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            {data.author?.bio ||
              'منصة رقمية مخصصة لعرض ونشر الكتب والمؤلفات والدراسات الأدبية والفكرية للمؤلف.'}
          </p>
        </div>
      </section>

      {/* Catalog Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">الكتب المنشورة</h2>
            <p className="text-sm text-gray-500 mt-1">تصفح أحدث الكتب والإصدارات المتاحة للقراءة</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-primary-50 text-primary-700 rounded-full border border-primary-200">
            {data.books.length} مؤلف متاح
          </span>
        </div>

        {loading ? (
          <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 text-gray-400">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full mb-3" />
            <p>جاري تحميل محتويات المكتبة...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 text-center">
            {error}
          </div>
        ) : data.books.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-2xl border border-gray-200 text-gray-500 space-y-3">
            <p className="text-xl font-bold text-gray-800">لا توجد كتب منشورة للعامة حالياً</p>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              يتم إعداد ومراجعة المسودات الجديدة حالياً، وستظهر هنا فور اعتمادها ونشرها رسمياً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.books.map((book) => (
              <article
                key={book.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Cover Preview */}
                <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden flex items-center justify-center border-b border-gray-100">
                  {book.cover_image_path ? (
                    <img
                      src={`/storage/${book.cover_image_path}`}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center p-4 text-gray-400">
                      <span className="text-4xl block mb-2">📖</span>
                      <span className="text-xs">غلاف غير متوفر</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-snug group-hover:text-primary-600 transition-colors">
                      {book.title}
                    </h3>
                    {book.subtitle && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{book.subtitle}</p>
                    )}
                    {book.description && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                        {book.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span>بقلم: {book.author?.name}</span>
                    <Link to={`/books/${book.slug}`}>
                      <span className="font-semibold text-primary-600 hover:text-primary-700">
                        التفاصيل والقراءة ←
                      </span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لـ {data.author?.name || 'المؤلف'}.</p>
        </div>
      </footer>
    </div>
  );
};

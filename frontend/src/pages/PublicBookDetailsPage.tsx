import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PlatformLayout } from '../templates/PlatformLayout';
import { Button } from '../components/atoms/Button';

export const PublicBookDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get(`/api/catalog/books/${slug}`)
      .then((res) => {
        if (res.success) {
          setBook(res.data);
        }
      })
      .catch((err) => setError(err.message || 'الكتاب غير موجود أو غير متاح للعرض.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6" dir="rtl">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <span className="text-4xl block">🔍</span>
          <h1 className="text-xl font-bold text-gray-900">الكتاب غير متاح</h1>
          <p className="text-sm text-gray-500">{error || 'لم نتمكن من العثور على هذا الكتاب ضمن المنشورات المعتمدة.'}</p>
          <Link to="/publications">
            <Button variant="primary" size="sm">
              العودة إلى المؤلفات
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PlatformLayout authorName={book.author?.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/publications" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-semibold">
            ← العودة إلى قائمة المؤلفات
          </Link>
          <Link to="/" className="text-xs text-gray-500 hover:text-gray-900 font-medium">
            عرض صفحة الأخبار ↗
          </Link>
        </div>
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xs p-6 sm:p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Cover Column */}
            <div className="flex flex-col items-center">
              <div className="w-full aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-md">
                {book.cover_image_path ? (
                  <img
                    src={`/storage/${book.cover_image_path}`}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    📖 غلاف غير متوفر
                  </div>
                )}
              </div>
            </div>

            {/* Info Column */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 inline-block mb-3">
                  مؤلف منشور ومعتمد
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 leading-tight">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-lg text-gray-500 mt-2 font-medium">{book.subtitle}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600 border-y border-gray-100 py-3">
                  <div>
                    <span className="text-gray-400 block">المؤلف:</span>
                    <span className="font-semibold text-gray-800">{book.author?.name}</span>
                  </div>
                  {book.declared_publication_date && (
                    <div>
                      <span className="text-gray-400 block">تاريخ الإصدار:</span>
                      <span className="font-semibold text-gray-800">{book.declared_publication_date}</span>
                    </div>
                  )}
                  {book.published_at && (
                    <div>
                      <span className="text-gray-400 block">تاريخ النشر بالمنصة:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(book.published_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {book.description && (
                <div className="space-y-2">
                  <h2 className="text-base font-bold text-gray-900">عن الكتاب</h2>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {book.description}
                  </p>
                </div>
              )}

              {/* Introduction / Sample Reading */}
              {book.introduction && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h2 className="text-base font-bold text-gray-900">مقدمة الكتاب أو نص العينة</h2>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 text-sm text-gray-800 leading-loose whitespace-pre-wrap font-serif">
                    {book.introduction}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  );
};

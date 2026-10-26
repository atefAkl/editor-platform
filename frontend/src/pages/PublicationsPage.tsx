import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PublicNavbar } from '../components/organisms/PublicNavbar';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';

interface PublicBook {
  id: number;
  title: string;
  subtitle?: string;
  slug: string;
  description?: string;
  category?: string;
  cover_image_path?: string;
  declared_publication_date?: string;
  published_at?: string;
  author?: {
    name: string;
    bio?: string;
  };
}

interface CategoryOption {
  key: string;
  label: string;
}

export const PublicationsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';

  const [books, setBooks] = useState<PublicBook[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([
    { key: 'all', label: 'الكل' },
    { key: 'novels', label: 'روايات' },
    { key: 'short_stories', label: 'قصص قصيرة' },
    { key: 'poetry', label: 'دواوين' },
    { key: 'articles', label: 'مقالات' },
  ]);
  const [author, setAuthor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks(activeCategory, searchQuery);
  }, [activeCategory]);

  const fetchBooks = (category: string, search: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (search) params.append('search', search);

    apiClient
      .get<{ author: any; books: PublicBook[]; categories?: CategoryOption[] }>(
        `/api/catalog/publications?${params.toString()}`
      )
      .then((res) => {
        if (res.success && res.data) {
          setBooks(res.data.books);
          setAuthor(res.data.author);
          if (res.data.categories) {
            setCategories(res.data.categories);
          }
        }
      })
      .catch((err) => setError(err.message || 'فشل في تحميل قائمة الكتب'))
      .finally(() => setLoading(false));
  };

  const handleCategoryChange = (key: string) => {
    if (key === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', key);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBooks(activeCategory, searchQuery);
  };

  const getCategoryLabel = (catKey?: string) => {
    switch (catKey) {
      case 'novels':
        return 'رواية';
      case 'short_stories':
        return 'مجموعة قصصية';
      case 'poetry':
        return 'ديوان شعر';
      case 'articles':
        return 'مقالات';
      default:
        return 'عمل أدبي';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans" dir="rtl">
      <PublicNavbar authorName={author?.name} />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 py-12 px-4 sm:px-6 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200/80 px-3.5 py-1 rounded-full uppercase tracking-wider">
            المكتبة الأدبية الرسمية
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
            مؤلفات وإصدارات {author?.name || 'الكاتب'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            تصفح جميع الروايات، والمجموعات القصصية، والدواوين الشعرية، والمقالات المنشورة رسمياً.
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-72 flex gap-2">
            <input
              type="text"
              placeholder="ابحث في العناوين..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
            />
            <Button type="submit" size="sm" variant="outline" className="text-xs font-semibold">
              بحث
            </Button>
          </form>
        </div>
      </div>

      {/* Main Catalog Grid */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {loading && (
          <div className="text-center py-20 space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500">جاري تحميل المؤلفات...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {!loading && books.length === 0 && (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 space-y-3">
            <div className="text-5xl">📚</div>
            <h3 className="text-lg font-bold text-gray-900">لا توجد مؤلفات مطابقة</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              لم نعثر على كتب في هذا التصنيف حالياً. يمكنك تجربة اختيار تصنيف آخر أو مسح البحث.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                handleCategoryChange('all');
              }}
            >
              عرض كافة المؤلفات
            </Button>
          </div>
        )}

        {!loading && books.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group hover:-translate-y-1"
              >
                {/* Book Cover Container with guaranteed working proxy */}
                <div className="h-64 sm:h-72 bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center p-4 relative overflow-hidden border-b border-gray-100">
                  {book.cover_image_path ? (
                    <img
                      src={`/storage/${book.cover_image_path}`}
                      alt={book.title}
                      className="h-full w-auto max-w-[85%] object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <div className="w-16 h-20 bg-gray-300 rounded-lg mx-auto shadow-inner flex items-center justify-center text-2xl font-bold text-gray-500">
                        📖
                      </div>
                      <span className="text-xs text-gray-400 block font-medium">
                        لا يوجد غلاف معتمد
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-primary-700 shadow-xs border border-gray-200/60">
                      {getCategoryLabel(book.category)}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-gray-900 text-lg group-hover:text-primary-600 transition-colors line-clamp-1">
                      {book.title}
                    </h3>
                    {book.subtitle && (
                      <p className="text-xs text-gray-500 font-medium line-clamp-1">
                        {book.subtitle}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mt-2">
                      {book.description || 'لا يوجد وصف متاح لهذا العمل حالياً.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-[11px] text-gray-400 font-medium">
                      {formatDate(book.declared_publication_date || book.published_at)}
                    </div>
                    <Link to={`/books/${book.slug}`}>
                      <Button variant="primary" size="sm" className="text-xs font-bold">
                        معاينة العمل ←
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة الكاتب والنشر الرقمي.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/" className="hover:text-primary-600">
              الرئيسية (الأخبار)
            </Link>
            <span>•</span>
            <Link to="/publications" className="hover:text-primary-600">
              المؤلفات والكتب
            </Link>
            <span>•</span>
            <Link to="/admin" className="hover:text-primary-600">
              لوحة الإدارة
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

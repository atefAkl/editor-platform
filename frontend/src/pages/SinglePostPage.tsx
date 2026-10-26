import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PublicNavbar } from '../components/organisms/PublicNavbar';
import { Button } from '../components/atoms/Button';

interface Comment {
  id: number;
  post_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

interface FullPost {
  id: number;
  author_id: number;
  content: string;
  image_path?: string | null;
  book_id?: number | null;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
  author?: {
    id: number;
    name: string;
    bio?: string;
  };
  book?: {
    id: number;
    title: string;
    slug: string;
    cover_image_path?: string;
    category?: string;
  };
  comments: Comment[];
}

export const SinglePostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentName, setCommentName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient
      .get<FullPost>(`/api/feed/${id}`)
      .then((res) => {
        if (res.success && res.data) {
          setPost(res.data);
        }
      })
      .catch((err) => setError(err.message || 'فشل في تحميل تفاصيل المنشور'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    setPost((prev) => (prev ? { ...prev, likes_count: prev.likes_count + 1 } : prev));
    try {
      await apiClient.post(`/api/feed/${post.id}/like`);
    } catch {}
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 3000);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await apiClient.post<{ comment: Comment; comments_count: number }>(
        `/api/feed/${post.id}/comments`,
        {
          author_name: commentName.trim() || 'قارئ متفاعل',
          content: commentContent.trim(),
        }
      );

      if (res.success && res.data) {
        setPost((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments_count: res.data.comments_count,
            comments: [...prev.comments, res.data.comment],
          };
        });
        setCommentContent('');
      }
    } catch (err: any) {
      alert(err.message || 'فشل في إرسال التعليق');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100/70 flex flex-col font-sans" dir="rtl">
      <PublicNavbar authorName={post?.author?.name} />

      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <span>📋</span>
          <span>تم نسخ رابط المنشور إلى الحافظة بنجاح!</span>
        </div>
      )}

      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-sm font-semibold text-gray-600 hover:text-primary-700 flex items-center gap-2"
          >
            <span>←</span>
            <span>العودة إلى خلاصة الأخبار</span>
          </Link>
          <Link to="/publications">
            <Button variant="outline" size="sm">
              تصفح الكتب والمؤلفات
            </Button>
          </Link>
        </div>

        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500 mt-2">جاري تحميل المنشور...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {!loading && post && (
          <div className="space-y-6">
            {/* Main Post Card */}
            <article className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                {/* Author Info */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-2xl shadow-xs">
                      {post.author?.name ? post.author.name.charAt(0) : 'م'}
                    </div>
                    <div>
                      <h2 className="font-extrabold text-xl text-gray-950">
                        {post.author?.name || 'المؤلف'}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        نُشر في {formatDate(post.published_at || post.created_at)}
                      </p>
                    </div>
                  </div>

                  {post.is_pinned && (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-bold">
                      📌 مثبت في الصفحة
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="text-gray-900 text-base sm:text-lg leading-relaxed whitespace-pre-line font-normal">
                  {post.content}
                </div>

                {/* Attached Image */}
                {post.image_path && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-900 flex items-center justify-center max-h-[550px]">
                    <img
                      src={`/storage/${post.image_path}`}
                      alt="صورة المنشور"
                      className="w-full h-auto max-h-[550px] object-contain"
                    />
                  </div>
                )}

                {/* Attached Book Link Card */}
                {post.book && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {post.book.cover_image_path ? (
                        <img
                          src={`/storage/${post.book.cover_image_path}`}
                          alt={post.book.title}
                          className="w-16 h-24 object-cover rounded-lg shadow-sm border border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-24 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-2xl">
                          📖
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-bold text-primary-700 bg-white px-2.5 py-1 rounded-md shadow-2xs">
                          عمل أدبي موصى به
                        </span>
                        <h3 className="font-extrabold text-lg text-gray-900 mt-1.5">
                          {post.book.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          تصفح تفاصيل الكتاب وقراءة النبذة والتعريف
                        </p>
                      </div>
                    </div>

                    <Link to={`/books/${post.book.slug}`}>
                      <Button variant="primary" size="sm">
                        معاينة العمل الكامل ←
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Interaction summary */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>❤️</span>
                    <span>{post.likes_count} إعجاباً</span>
                  </div>
                  <div className="font-semibold">
                    <span>{post.comments.length} تعليقات</span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleLike}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-red-600 transition-colors"
                  >
                    <span>👍</span>
                    <span>أعجبني</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span>↗️</span>
                    <span>مشاركة الرابط</span>
                  </button>
                </div>
              </div>
            </article>

            {/* Comments Thread Section */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200 space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
                التعليقات والانطباعات ({post.comments.length})
              </h3>

              {post.comments.length > 0 ? (
                <div className="space-y-4">
                  {post.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {c.author_name.charAt(0)}
                      </div>
                      <div className="flex-1 bg-gray-50 p-4 rounded-2xl rounded-tr-xs border border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-gray-900">
                            {c.author_name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(c.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2 whitespace-pre-line leading-relaxed">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">
                  لا توجد تعليقات حتى الآن. كن أول من يترك تعليقاً على هذا المنشور!
                </p>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="pt-6 border-t border-gray-100 space-y-4">
                <h4 className="text-sm font-bold text-gray-800">أضف تعليقك</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="اسمك الكريم (اختياري)..."
                    value={commentName}
                    onChange={(e) => setCommentName(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب تعليقك هنا بكل حرية وأدب..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="w-full p-4 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden resize-none"
                />
                <Button type="submit" variant="primary" disabled={submittingComment}>
                  {submittingComment ? 'جاري الإرسال...' : 'نشر التعليق'}
                </Button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

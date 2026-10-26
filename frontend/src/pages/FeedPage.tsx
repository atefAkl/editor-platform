import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { PublicNavbar } from '../components/organisms/PublicNavbar';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';

interface Comment {
  id: number;
  post_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

interface FeedPost {
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
    avatar?: string;
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

interface FeedData {
  author: any;
  stats: {
    published_books: number;
    total_posts: number;
  };
  posts: FeedPost[];
}

export const FeedPage: React.FC = () => {
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Post modal / form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [submittingPost, setSubmittingPost] = useState(false);

  // New comment input per post
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: { name: string; content: string } }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{ [key: number]: boolean }>({});
  const [copyToast, setCopyToast] = useState<string | null>(null);

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<FeedData>('/api/feed');
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل خلاصة الأخبار');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    // Optimistic UI update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
        ),
      };
    });

    try {
      await apiClient.post(`/api/feed/${postId}/like`);
    } catch (e) {
      // Revert if error
    }
  };

  const handleShare = (postId: number) => {
    const url = `${window.location.origin}/posts/${postId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopyToast('تم نسخ رابط المنشور بنجاح!');
      setTimeout(() => setCopyToast(null), 3000);
    }
  };

  const handleCommentSubmit = async (postId: number, e: React.FormEvent) => {
    e.preventDefault();
    const input = commentInputs[postId];
    if (!input || !input.content.trim()) return;

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await apiClient.post<{ comment: Comment; comments_count: number }>(
        `/api/feed/${postId}/comments`,
        {
          author_name: input.name?.trim() || 'قارئ متفاعل',
          content: input.content.trim(),
        }
      );

      if (res.success && res.data) {
        const newComment = res.data.comment;
        const newCount = res.data.comments_count;

        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            posts: prev.posts.map((p) => {
              if (p.id === postId) {
                return {
                  ...p,
                  comments_count: newCount,
                  comments: [...p.comments, newComment],
                };
              }
              return p;
            }),
          };
        });

        // Clear input
        setCommentInputs((prev) => ({
          ...prev,
          [postId]: { name: prev[postId]?.name || '', content: '' },
        }));
      }
    } catch (err: any) {
      alert(err.message || 'فشل في إضافة التعليق');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setSubmittingPost(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      if (postImage) {
        formData.append('image', postImage);
      }

      const res = await apiClient.post<FeedPost>('/api/feed', formData);
      if (res.success) {
        setPostContent('');
        setPostImage(null);
        setShowCreateModal(false);
        fetchFeed();
      }
    } catch (err: any) {
      alert(err.message || 'تعذر نشر المنشور');
    } finally {
      setSubmittingPost(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
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
      <PublicNavbar authorName={data?.author?.name} />

      {/* Copy notification toast */}
      {copyToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <span>📋</span>
          <span>{copyToast}</span>
        </div>
      )}

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        {/* Author Profile Banner / Hero */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-extrabold shadow-md shrink-0">
              {data?.author?.name ? data.author.name.charAt(0) : 'م'}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                    {data?.author?.name || 'المؤلف الأساسي'}
                    <span className="text-blue-500 text-lg" title="مؤلف موثق">
                      ✓
                    </span>
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">كاتب ومؤلف</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Link to="/publications">
                    <Button variant="primary" size="sm" className="shadow-xs font-semibold">
                      📖 تصفح مكتبة المؤلفات ({data?.stats?.published_books || 0})
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    className="font-semibold"
                  >
                    ✏️ نشر منشور
                  </Button>
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                {data?.author?.bio ||
                  'مرحباً بكم في صفحتي الرسمية. هنا أشارككم جديد الأفكار، والخواطر، والإصدارات الأدبية.'}
              </p>

              {/* Stats badges */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-gray-500 border-t border-gray-100">
                <span className="font-semibold text-gray-700">
                  📚 {data?.stats?.published_books || 0} أعمال منشورة
                </span>
                <span>•</span>
                <span className="font-semibold text-gray-700">
                  📰 {data?.stats?.total_posts || 0} منشوراً وتحديثاً
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Post Box (Facebook style) */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center shrink-0">
              {data?.author?.name ? data.author.name.charAt(0) : 'م'}
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 bg-gray-100 hover:bg-gray-200/80 transition-colors rounded-full px-5 py-2.5 text-right text-sm text-gray-500 cursor-pointer"
            >
              ماذا يدور في ذهنك يا أستاذنا؟ شارك القراء فكرة أو تحديثاً جديداً...
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16 space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500">جاري تحميل خلاصة الأخبار والمنشورات...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Feed Posts Stream */}
        {!loading && data && data.posts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
            <p className="text-lg text-gray-700 font-bold">لا توجد منشورات حتى الآن</p>
            <p className="text-sm text-gray-500">كن أول من يشارك من خلال زر "نشر منشور".</p>
          </div>
        )}

        {/* Posts List */}
        {!loading && data && (
          <div className="space-y-6">
            {data.posts.map((post) => {
              const areCommentsOpen =
                activeCommentsPostId === post.id || post.comments.length > 0;

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden transition-all hover:border-gray-300"
                >
                  {/* Post Header */}
                  <div className="p-4 sm:p-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-xs">
                        {post.author?.name ? post.author.name.charAt(0) : 'م'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base hover:text-primary-600 transition-colors">
                            {post.author?.name || 'المؤلف'}
                          </h3>
                          {post.is_pinned && (
                            <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                              📌 مثبت
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                          <span>{formatDate(post.published_at || post.created_at)}</span>
                          <span>•</span>
                          <span>عام 🌍</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/posts/${post.id}`}
                      className="text-xs text-gray-400 hover:text-primary-600 font-medium px-2 py-1 rounded-md hover:bg-gray-50"
                      title="عرض المنشور في صفحة مستقلة"
                    >
                      عرض كامل ↗
                    </Link>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 sm:px-5 pb-4 text-gray-800 text-[15px] leading-relaxed whitespace-pre-line font-normal">
                    {post.content}
                  </div>

                  {/* Post Attached Image (Covered via proxy /storage/...) */}
                  {post.image_path && (
                    <div className="border-t border-b border-gray-100 bg-gray-950 flex items-center justify-center max-h-[480px] overflow-hidden">
                      <img
                        src={`/storage/${post.image_path}`}
                        alt="صورة المنشور"
                        className="w-full h-auto max-h-[480px] object-contain hover:scale-[1.01] transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback display if not found
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Attached Book Link Card (if post is linked to a book) */}
                  {post.book && (
                    <div className="mx-4 sm:mx-5 mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/50 border border-blue-200/70 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {post.book.cover_image_path ? (
                          <img
                            src={`/storage/${post.book.cover_image_path}`}
                            alt={post.book.title}
                            className="w-14 h-20 object-cover rounded-lg shadow-xs border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-20 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-xl shrink-0">
                            📖
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-semibold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-md">
                            عمل أدبي مرتبط
                          </span>
                          <h4 className="font-bold text-gray-900 text-base mt-1">
                            {post.book.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            متاح الآن في مكتبة المؤلفات والكتب
                          </p>
                        </div>
                      </div>

                      <Link to={`/books/${post.book.slug}`}>
                        <Button variant="outline" size="sm" className="shrink-0 text-xs font-bold">
                          معاينة العمل ←
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Stats Counter Bar */}
                  <div className="px-4 sm:px-5 py-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px]">
                        ❤️
                      </span>
                      <span>{post.likes_count} إعجاباً</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span>{post.comments_count} تعليقاً</span>
                    </div>
                  </div>

                  {/* Facebook Action Buttons (Like / Comment / Share) */}
                  <div className="px-2 sm:px-4 py-1.5 border-t border-gray-100 grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors"
                    >
                      <span>👍</span>
                      <span>أعجبني</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveCommentsPostId(
                          activeCommentsPostId === post.id ? null : post.id
                        )
                      }
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-primary-700 transition-colors"
                    >
                      <span>💬</span>
                      <span>تعليق</span>
                    </button>

                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    >
                      <span>↗️</span>
                      <span>مشاركة</span>
                    </button>
                  </div>

                  {/* Comments Thread */}
                  {areCommentsOpen && (
                    <div className="bg-gray-50/70 p-4 sm:p-5 border-t border-gray-100 space-y-4">
                      {/* Comments List */}
                      {post.comments.length > 0 ? (
                        <div className="space-y-3">
                          {post.comments.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-700 font-bold flex items-center justify-center text-xs shrink-0">
                                {comment.author_name.charAt(0)}
                              </div>
                              <div className="flex-1 bg-white p-3 rounded-2xl rounded-tr-xs border border-gray-200/80 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-gray-900">
                                    {comment.author_name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 text-center py-2">
                          لا توجد تعليقات بعد. كن أول من يترك انطباعه!
                        </p>
                      )}

                      {/* Add Comment Input Form */}
                      <form
                        onSubmit={(e) => handleCommentSubmit(post.id, e)}
                        className="space-y-2 pt-2 border-t border-gray-200/60"
                      >
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            placeholder="اسمك (اختياري)..."
                            value={commentInputs[post.id]?.name || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: {
                                  name: e.target.value,
                                  content: prev[post.id]?.content || '',
                                },
                              }))
                            }
                            className="w-full sm:w-1/3 px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                          />
                          <div className="flex-1 flex gap-2">
                            <input
                              type="text"
                              required
                              placeholder="اكتب تعليقاً..."
                              value={commentInputs[post.id]?.content || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id]: {
                                    name: prev[post.id]?.name || '',
                                    content: e.target.value,
                                  },
                                }))
                              }
                              className="flex-1 px-3.5 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-hidden"
                            />
                            <Button
                              type="submit"
                              size="sm"
                              disabled={commentSubmitting[post.id]}
                              className="px-4 text-xs font-semibold"
                            >
                              {commentSubmitting[post.id] ? 'إرسال...' : 'نشر'}
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">إنشاء منشور جديد</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نص المنشور / الفكرة
                </label>
                <textarea
                  required
                  rows={5}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="شارك أفكارك الأدبية، مقتطفات من أعمالك، أو إعلاناتك الرسمية..."
                  className="w-full p-3.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  إرفاق صورة (اختياري)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submittingPost}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" disabled={submittingPost}>
                  {submittingPost ? 'جاري النشر...' : 'نشر الآن'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500 mt-12">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© {new Date().getFullYear()} جميع الحقوق محفوظة للكاتب ومنصة النشر الرقمية.</p>
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

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { PublicNavbar } from '../components/organisms/PublicNavbar';
import { RichTextEditor } from '../components/molecules/RichTextEditor';
import { Button } from '../components/atoms/Button';

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
  type?: 'thought' | 'article' | 'news' | 'book_release';
  title?: string;
  content: string;
  image_path?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_size?: number | null;
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
  const { user, can, hasRole, loginWithGoogle } = useAuth();

  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter tabs for feed
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');

  // Parallel Comprehensive Post Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [postType, setPostType] = useState<'thought' | 'article' | 'news' | 'book_release'>('thought');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postFile, setPostFile] = useState<File | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comments state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<number | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: number]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{ [key: number]: boolean }>({});
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Permission check: only authorized creator/admin can see & use creation box
  const canCreateContent = user && (
    can('books.create') ||
    can('news.publish') ||
    hasRole('admin') ||
    hasRole('author') ||
    hasRole('editor')
  );

  useEffect(() => {
    fetchFeed();
  }, [activeTypeFilter]);

  const fetchFeed = async () => {
    try {
      setLoading(true);
      const url = activeTypeFilter !== 'all' ? `/api/feed?type=${activeTypeFilter}` : '/api/feed';
      const res = await apiClient.get<FeedData>(url);
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
    } catch (e) {}
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
    if (!user) {
      alert('التعليق متاح فقط للأعضاء المسجلين دخول.');
      return;
    }

    const content = commentInputs[postId];
    if (!content || !content.trim()) return;

    setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await apiClient.post<{ comment: Comment; comments_count: number }>(
        `/api/feed/${postId}/comments`,
        { content: content.trim() }
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

        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (err: any) {
      alert(err.message || 'فشل في إضافة التعليق');
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) {
      alert('يرجى كتابة محتوى للمنشور.');
      return;
    }

    setSubmittingPost(true);
    try {
      const formData = new FormData();
      formData.append('type', postType);
      if (postTitle) formData.append('title', postTitle);
      formData.append('content', postContent);
      if (isPinned) formData.append('is_pinned', '1');
      if (postImage) formData.append('image', postImage);
      if (postFile) formData.append('file', postFile);

      const res = await apiClient.post<FeedPost>('/api/feed', formData);
      if (res.success) {
        setPostTitle('');
        setPostContent('');
        setPostImage(null);
        setPostFile(null);
        setIsPinned(false);
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
      return new Date(dateStr).toLocaleDateString('ar-EG', {
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

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'book_release':
        return <span className="bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md">مؤلف أدبي</span>;
      case 'article':
        return <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md">مقال فكري</span>;
      case 'news':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md">خبر وتحديث</span>;
      case 'thought':
      default:
        return <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-md">خاطرة أدبية</span>;
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
        {/* Author Profile Hero Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-gray-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center text-4xl font-extrabold shadow-md shrink-0 overflow-hidden">
              {data?.author?.avatar ? (
                <img src={`/storage/${data.author.avatar}`} alt={data.author.name} className="w-full h-full object-cover" />
              ) : (
                data?.author?.name ? data.author.name.charAt(0) : 'م'
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                    {data?.author?.name || 'المؤلف الأساسي'}
                    <span className="text-blue-500 text-lg" title="مؤلف معتمد">✓</span>
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">كاتب ومؤلف</p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Link to="/publications">
                    <Button variant="primary" size="sm" className="shadow-xs font-semibold">
                      📖 تصفح مكتبة المؤلفات ({data?.stats?.published_books || 0})
                    </Button>
                  </Link>

                  {/* Creator-only Action Button */}
                  {canCreateContent && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateModal(true)}
                      className="font-semibold text-primary-700 border-primary-300 hover:bg-primary-50"
                    >
                      ✏️ نشر عمل / مقال جديد
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
                {data?.author?.bio || 'مرحباً بكم في صفحتي الرسمية. هنا أشارككم جديد الأفكار، والخواطر، والإصدارات الأدبية.'}
              </p>

              {/* Stats badges */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-gray-500 border-t border-gray-100">
                <span className="font-semibold text-gray-700">
                  📚 {data?.stats?.published_books || 0} أعمال منشورة
                </span>
                <span>•</span>
                <span className="font-semibold text-gray-700">
                  📰 {data?.stats?.total_posts || 0} منشوراً وخاطرة
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Creator-Only Quick Publish Bar (Hidden for guests & normal readers) */}
        {canCreateContent && (
          <div className="bg-white rounded-2xl p-4 shadow-xs border border-primary-200 bg-gradient-to-r from-primary-50/40 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white font-bold flex items-center justify-center shrink-0 shadow-2xs">
                {user?.name ? user.name.charAt(0) : 'م'}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 transition-colors rounded-full px-5 py-2.5 text-right text-sm text-gray-600 cursor-pointer shadow-2xs flex items-center justify-between"
              >
                <span>شارك القراء مؤلفاً جديداً، مقالة فكرية، خبراً، أو خاطرة أدبية...</span>
                <span className="text-primary-600 font-bold text-xs bg-primary-50 px-3 py-1 rounded-full">
                  فتح النموذج الشامل ←
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Feed Type Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          {[
            { key: 'all', label: 'كافة المنشورات' },
            { key: 'book_release', label: 'مؤلفات وإصدارات' },
            { key: 'article', label: 'مقالات' },
            { key: 'news', label: 'أخبار وتحديثات' },
            { key: 'thought', label: 'خواطر وتأملات' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTypeFilter(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTypeFilter === tab.key
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-16 space-y-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
            <p className="text-sm text-gray-500">جاري تحميل خلاصة الأخبار...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && data && data.posts.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 space-y-3">
            <p className="text-lg text-gray-700 font-bold">لا توجد منشورات في هذا التصنيف حالياً</p>
            <p className="text-sm text-gray-500">يمكنك استعراض تصنيفات أخرى أو الاطلاع على كافة المنشورات.</p>
          </div>
        )}

        {/* Posts Stream */}
        {!loading && data && (
          <div className="space-y-6">
            {data.posts.map((post) => {
              const areCommentsOpen = activeCommentsPostId === post.id || post.comments.length > 0;

              return (
                <article
                  key={post.id}
                  className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden hover:border-gray-300 transition-all"
                >
                  {/* Post Header */}
                  <div className="p-4 sm:p-5 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold flex items-center justify-center text-lg shadow-xs overflow-hidden">
                        {post.author?.avatar ? (
                          <img src={`/storage/${post.author.avatar}`} alt={post.author.name} className="w-full h-full object-cover" />
                        ) : (
                          post.author?.name ? post.author.name.charAt(0) : 'م'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-base">
                            {post.author?.name || 'المؤلف'}
                          </h3>
                          {getTypeBadge(post.type)}
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
                      title="عرض المنشور كاملاً في صفحة مستقلة"
                    >
                      عرض كامل ↗
                    </Link>
                  </div>

                  {/* Post Title (If present) */}
                  {post.title && (
                    <div className="px-4 sm:px-5 pb-2">
                      <h2 className="text-xl font-bold text-gray-950">
                        {post.title}
                      </h2>
                    </div>
                  )}

                  {/* Post Rich Content Body */}
                  <div
                    className="px-4 sm:px-5 pb-4 text-gray-800 text-[15px] leading-relaxed prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  {/* Post Attached Image (Covered via proxy) */}
                  {post.image_path && (
                    <div className="border-t border-b border-gray-100 bg-gray-950 flex items-center justify-center max-h-[480px] overflow-hidden">
                      <img
                        src={`/storage/${post.image_path}`}
                        alt="صورة المنشور"
                        className="w-full h-auto max-h-[480px] object-contain hover:scale-[1.01] transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Attached Downloadable File Banner (POLICY: No download on feed, only link to single page) */}
                  {post.file_path && (
                    <div className="mx-4 sm:mx-5 my-3 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">📥</span>
                        <div>
                          <div className="text-xs font-bold text-amber-900">
                            يحتوي هذا المنشور على ملف مرفق للتحميل
                          </div>
                          <div className="text-[11px] text-amber-700">
                            {post.file_name || 'ملف رقمي مرفق'} • التحميل متاح من صفحة عرض المنشور
                          </div>
                        </div>
                      </div>

                      <Link to={`/posts/${post.id}`}>
                        <Button variant="outline" size="sm" className="text-xs font-bold bg-white text-amber-900 border-amber-300 hover:bg-amber-100">
                          معاينة وتحميل الملف ↗
                        </Button>
                      </Link>
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
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <span>👍</span>
                      <span>أعجبني</span>
                    </button>

                    <button
                      onClick={() =>
                        setActiveCommentsPostId(activeCommentsPostId === post.id ? null : post.id)
                      }
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-primary-700 transition-colors cursor-pointer"
                    >
                      <span>💬</span>
                      <span>تعليق</span>
                    </button>

                    <button
                      onClick={() => handleShare(post.id)}
                      className="flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer"
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

                      {/* Comment Form for Authenticated Users OR Login Prompt for Guests */}
                      {user ? (
                        <form
                          onSubmit={(e) => handleCommentSubmit(post.id, e)}
                          className="space-y-2 pt-2 border-t border-gray-200/60"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              placeholder="اكتب تعليقك بصفتك عضواً مسجلاً..."
                              value={commentInputs[post.id] || ''}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
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
                        </form>
                      ) : (
                        <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl text-center space-y-2">
                          <p className="text-xs font-bold text-blue-900">
                            التعليق مخصص للأعضاء المسجلين دخول (الجمهور).
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => loginWithGoogle()}
                              className="inline-flex items-center gap-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                            >
                              <span>تسجيل الدخول بحساب جوجل للتعليق</span>
                            </button>
                            <Link to="/login" className="text-xs text-blue-700 hover:underline">
                              تسجيل الدخول بالحساب
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Comprehensive Parallel Creation Modal (Matches Book creation form) */}
      {showCreateModal && canCreateContent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">
                  نموذج إضافة منشور / مقال / مؤلف أدبي
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  أدخل تفاصيل المنشور مع التنسيق الغني وإرفاق الصور أو الملفات الرقمية
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-5">
              {/* Post Type Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  نوع المنشور / التصنيف <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'thought', label: 'خاطرة أدبية' },
                    { key: 'article', label: 'مقال فكري' },
                    { key: 'news', label: 'خبر وتحديث' },
                    { key: 'book_release', label: 'مؤلفات (شعر، قصص، روايات)' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setPostType(t.key as any)}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        postType === t.key
                          ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title Input (Optional for thoughts, recommended for articles/news/books) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  عنوان المنشور / المقال / العمل (اختياري)
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="مثال: تأملات في السرد المعاصر..."
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Rich Text Editor Body */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  نص المحتوى مع التنسيق الغني <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                  value={postContent}
                  onChange={setPostContent}
                  placeholder="اكتب أفكارك الأدبية، فصولاً من نصوصك، أو مقالاتك مع التنسيق الغني..."
                  minHeight="200px"
                />
              </div>

              {/* Attachments Grid (Image & Downloadable File) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    صورة الغلاف / المرفق البصري
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPostImage(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">JPEG, PNG, WEBP حتى 5MB</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ملف رقمي للتحميل (PDF, EPUB, DOCX)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.epub,.doc,.docx,.zip"
                    onChange={(e) => setPostFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-800 hover:file:bg-amber-100"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">يُتاح تحميله في صفحة عرض المنشور فقط</p>
                </div>
              </div>

              {/* Pin post toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_pinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded-md border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="is_pinned" className="text-xs font-bold text-gray-700 cursor-pointer">
                  تثبيت هذا المنشور في أعلى الصفحة الرئيسية
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={submittingPost}
                >
                  إلغاء
                </Button>
                <Button type="submit" variant="primary" disabled={submittingPost} className="px-6">
                  {submittingPost ? 'جاري النشر...' : 'نشر العمل الآن'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

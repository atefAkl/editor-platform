import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { WorkflowBadge, PublicationBadge } from '../components/atoms/Badge';
import { Button } from '../components/atoms/Button';

export const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Request Changes
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [commentsText, setCommentsText] = useState('');

  const fetchBookDetails = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/books/${id}`);
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في تحميل بيانات الكتاب.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const handleAction = async (endpoint: string, payload: any = {}) => {
    setActionLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await apiClient.post(`/api/books/${id}/${endpoint}`, payload);
      if (res.success) {
        setSuccessMsg(res.message || 'تم تنفيذ العملية بنجاح');
        if (endpoint === 'copy') {
          // Navigate to new copied draft
          navigate(`/admin/books/${res.data.id}`);
          return;
        }
        await fetchBookDetails();
      }
    } catch (err: any) {
      setError(err.message || 'فشل تنفيذ الإجراء.');
    } finally {
      setActionLoading(false);
      setShowChangesModal(false);
      setCommentsText('');
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-16 text-center rounded-xl border border-gray-200 text-gray-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-primary-600 rounded-full mb-3" />
        <p>جاري تحميل بيانات الكتاب وسجلات سير العمل...</p>
      </div>
    );
  }

  if (!data?.book) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-gray-200 text-gray-500">
        <p>الكتاب غير موجود.</p>
        <Link to="/admin/books" className="mt-3 inline-block text-primary-600">
          العودة لقائمة الكتب
        </Link>
      </div>
    );
  }

  const { book, allowed_actions } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link to="/admin/books" className="hover:underline">الكتب</Link>
            <span>/</span>
            <span>تفاصيل الكتاب #{book.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{book.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {allowed_actions.can_update && (
            <Link to={`/admin/books/${book.id}/edit`}>
              <Button variant="primary" size="sm">
                ✏️ تعديل الكتاب
              </Button>
            </Link>
          )}
          <Link to="/admin/books">
            <Button variant="secondary" size="sm">
              رجوع للقائمة
            </Button>
          </Link>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm">
          {successMsg}
        </div>
      )}

      {/* Workflow Action Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">الحالة الراهنة:</span>
          <WorkflowBadge status={book.workflow_status} />
          <PublicationBadge status={book.publication_status} />
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {allowed_actions.can_submit_review && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => handleAction('submit-review', { comments: 'إرسال للمراجعة والتدقيق' })}
            >
              إرسال للمراجعة
            </Button>
          )}

          {allowed_actions.can_review && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowChangesModal(true)}
            >
              طلب تعديلات
            </Button>
          )}

          {allowed_actions.can_approve && (
            <Button
              variant="success"
              size="sm"
              loading={actionLoading}
              onClick={() => handleAction('approve', { comments: 'معتمد للنشر' })}
            >
              اعتماد الكتاب
            </Button>
          )}

          {allowed_actions.can_publish && (
            <Button
              variant="primary"
              size="sm"
              loading={actionLoading}
              onClick={() => handleAction('publish', { notes: 'نشر رسمي' })}
            >
              نشر الكتاب
            </Button>
          )}

          {allowed_actions.can_unpublish && (
            <Button
              variant="warning"
              size="sm"
              loading={actionLoading}
              onClick={() => handleAction('unpublish', { notes: 'إيقاف نشر مؤقت' })}
            >
              إيقاف النشر مؤقتاً
            </Button>
          )}

          {allowed_actions.can_publish && book.publication_status === 'temporarily_unpublished' && (
            <Button
              variant="success"
              size="sm"
              loading={actionLoading}
              onClick={() => handleAction('republish', { notes: 'إعادة نشر' })}
            >
              إعادة النشر
            </Button>
          )}

          {allowed_actions.can_cancel_publication && (
            <Button
              variant="danger"
              size="sm"
              loading={actionLoading}
              onClick={() => {
                if (window.confirm('هل أنت متأكد من إلغاء نشر هذا الكتاب نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                  handleAction('cancel-publication', { notes: 'إلغاء نهائي' });
                }
              }}
            >
              إلغاء النشر نهائياً
            </Button>
          )}

          {allowed_actions.can_copy && (
            <Button
              variant="outline"
              size="sm"
              loading={actionLoading}
              onClick={() => handleAction('copy')}
            >
              نسخ إلى مسودة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Info Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">بيانات الكتاب</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-semibold text-gray-500">العنوان: </span>
                <span className="text-gray-900">{book.title}</span>
              </div>
              {book.subtitle && (
                <div>
                  <span className="font-semibold text-gray-500">العنوان الفرعي: </span>
                  <span className="text-gray-700">{book.subtitle}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-500">المؤلف: </span>
                <span className="text-primary-700 font-medium">{book.author?.name}</span>
              </div>
              {book.declared_publication_date && (
                <div>
                  <span className="font-semibold text-gray-500">تاريخ النشر المعلن: </span>
                  <span className="text-gray-700">{book.declared_publication_date}</span>
                </div>
              )}
              <div>
                <span className="font-semibold text-gray-500">الوصف: </span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{book.description || 'لا يوجد وصف.'}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-500">المقدمة / العينة: </span>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">{book.introduction || 'لا توجد مقدمة.'}</p>
              </div>
            </div>
          </div>

          {/* Audit Timeline: Reviews & Publication History */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              سجل أحداث المراجعة والنشر
            </h2>

            {/* Publication History list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">سجل النشر والأرشفة</h3>
              {book.publication_history?.length === 0 ? (
                <p className="text-xs text-gray-400">لا توجد أحداث نشر مسجلة بعد.</p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {book.publication_history?.map((h: any) => (
                    <div key={h.id} className="p-3 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-800">{h.event}</span>
                        {h.notes && <span className="text-gray-500 mr-2">({h.notes})</span>}
                        <div className="text-gray-400 mt-0.5">بواسطة: {h.user?.name || 'النظام'}</div>
                      </div>
                      <div className="text-gray-400">
                        {new Date(h.created_at).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews History list */}
            <div className="space-y-3 pt-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">سجل قرارات المراجعة</h3>
              {book.reviews?.length === 0 ? (
                <p className="text-xs text-gray-400">لم يخضع الكتاب لأي مراجعة بعد.</p>
              ) : (
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                  {book.reviews?.map((r: any) => (
                    <div key={r.id} className="p-3 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-primary-700">{r.action}</span>
                        {r.comments && <p className="text-gray-600 mt-1 italic">"{r.comments}"</p>}
                        <div className="text-gray-400 mt-0.5">بواسطة: {r.user?.name || 'النظام'}</div>
                      </div>
                      <div className="text-gray-400">
                        {new Date(r.created_at).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Assets Column */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-sm">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">أصول الكتاب</h3>
            
            {/* Cover image */}
            <div>
              <span className="block text-xs font-semibold text-gray-500 mb-2">غلاف الكتاب:</span>
              {book.cover_image_path ? (
                <img
                  src={`/storage/${book.cover_image_path}`}
                  alt={book.title}
                  className="w-full h-56 object-cover rounded-lg border border-gray-200 shadow-sm"
                />
              ) : (
                <div className="w-full h-36 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  لم يتم رفع غلاف بعد
                </div>
              )}
            </div>

            {/* Book file info */}
            <div className="pt-2 border-t border-gray-100">
              <span className="block text-xs font-semibold text-gray-500 mb-1">ملف المحتوى:</span>
              {book.book_file_path ? (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs flex items-center justify-between">
                  <span>الملف مرفوع ومحمي ({book.book_file_type || 'PDF'})</span>
                  <span className="font-mono text-emerald-600">
                    {book.book_file_size ? `${Math.round(book.book_file_size / 1024)} KB` : ''}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 text-gray-400 rounded-lg text-xs border border-dashed border-gray-200">
                  لم يتم رفع ملف الكتاب بعد (إلزامي للنشر)
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Request Changes Comments */}
      {showChangesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">طلب تعديلات على المسودة</h3>
            <p className="text-sm text-gray-500">
              اكتب الملاحظات والتعديلات المطلوبة من المحرر لإعادتها لحالة "بحاجة لتعديلات":
            </p>
            <textarea
              rows={4}
              required
              value={commentsText}
              onChange={(e) => setCommentsText(e.target.value)}
              placeholder="اكتب ملاحظات التدقيق هنا..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowChangesModal(false)}>
                إلغاء
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!commentsText.trim()}
                loading={actionLoading}
                onClick={() => handleAction('request-changes', { comments: commentsText })}
              >
                تأكيد طلب التعديلات
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

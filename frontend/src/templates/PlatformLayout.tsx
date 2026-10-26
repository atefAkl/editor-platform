import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/atoms/Button';

interface PlatformLayoutProps {
  children: React.ReactNode;
  authorName?: string;
  authorAvatar?: string;
}

export const PlatformLayout: React.FC<PlatformLayoutProps> = ({
  children,
  authorName,
  authorAvatar,
}) => {
  const { user, logout, loginWithGoogle, hasRole, can } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminOrStaff =
    user &&
    (hasRole('admin') ||
      hasRole('author') ||
      hasRole('editor') ||
      hasRole('publisher') ||
      can('books.create'));

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname === path) return true;
    if (path !== '/' && path.includes('?') && location.search.includes(path.split('?')[1])) return true;
    return false;
  };

  const closeMobile = () => setMobileMenuOpen(false);

  // Common Sidebar Navigation Content
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between text-right p-4 space-y-6">
      <div className="space-y-6">
        {/* Brand identity in sidebar */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white font-extrabold flex items-center justify-center text-xl shadow-xs shrink-0 overflow-hidden">
            {authorAvatar ? (
              <img src={`/storage/${authorAvatar}`} alt={authorName || 'المؤلف'} className="w-full h-full object-cover" />
            ) : (
              'ق'
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-tight">
              {authorName || 'منصة الكاتب الأدبية'}
            </h2>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              {isAdminOrStaff ? 'وضع المشرف والتحرير' : 'منفذ النشر الرقمي'}
            </p>
          </div>
        </div>

        {/* SECTION 1: ADMIN CONTROLS (Rendered for Managers/Authors) */}
        {isAdminOrStaff && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 text-[11px] font-extrabold text-primary-700 uppercase tracking-wider">
              <span>إدارة النظام والمحتوى</span>
              <span className="bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded-sm text-[10px]">مشرف</span>
            </div>

            <Link
              to="/admin"
              onClick={closeMobile}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive('/admin')
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>📊</span>
              <span>لوحة القيادة الإدارية</span>
            </Link>

            <Link
              to="/admin/books"
              onClick={closeMobile}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive('/admin/books')
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>📚</span>
              <span>إدارة دورة الكتب والمسودات</span>
            </Link>

            <Link
              to="/admin/books/create"
              onClick={closeMobile}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/admin/books/create')
                  ? 'bg-primary-50 text-primary-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>➕</span>
              <span>إضافة مسودة كتاب جديد</span>
            </Link>

            <Link
              to="/admin/profile"
              onClick={closeMobile}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/admin/profile')
                  ? 'bg-primary-50 text-primary-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>👤</span>
              <span>الملف الشخصي للمشرف</span>
            </Link>

            <Link
              to="/admin/settings"
              onClick={closeMobile}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive('/admin/settings')
                  ? 'bg-primary-50 text-primary-700 font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>⚙️</span>
              <span>الإعدادات وهوية المؤلف</span>
            </Link>
          </div>
        )}

        {/* SECTION 2: PUBLIC & AUDIENCE NAVIGATION (Always Visible) */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="px-2 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            {isAdminOrStaff ? 'التصفح العام للمنصة' : 'أقسام المنصة الأدبية'}
          </div>

          <Link
            to="/"
            onClick={closeMobile}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              isActive('/')
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>📰</span>
            <span>الرئيسية (خلاصة الأخبار)</span>
          </Link>

          <Link
            to="/publications"
            onClick={closeMobile}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              isActive('/publications') && !location.search
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>📚</span>
            <span>مكتبة المؤلفات الكاملة</span>
          </Link>

          {/* Sub-genres for Readers */}
          <div className="mr-4 space-y-1 pt-1 border-r-2 border-gray-100 pr-2">
            <Link
              to="/publications?category=novels"
              onClick={closeMobile}
              className={`block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                location.search.includes('category=novels')
                  ? 'text-primary-700 bg-primary-50 font-bold'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              • روايات أدبية
            </Link>
            <Link
              to="/publications?category=short_stories"
              onClick={closeMobile}
              className={`block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                location.search.includes('category=short_stories')
                  ? 'text-primary-700 bg-primary-50 font-bold'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              • مجموعات قصصية
            </Link>
            <Link
              to="/publications?category=poetry"
              onClick={closeMobile}
              className={`block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                location.search.includes('category=poetry')
                  ? 'text-primary-700 bg-primary-50 font-bold'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              • دواوين شعرية
            </Link>
            <Link
              to="/publications?category=articles"
              onClick={closeMobile}
              className={`block px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                location.search.includes('category=articles')
                  ? 'text-primary-700 bg-primary-50 font-bold'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              • مقالات فكرية
            </Link>
          </div>
        </div>

        {/* SECTION 3: READER ACCOUNT & PREFERENCES */}
        <div className="space-y-1.5 pt-2 border-t border-gray-100">
          <div className="px-2 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            ركن القارئ
          </div>

          {user ? (
            <div className="space-y-1">
              <Link
                to="/profile"
                onClick={closeMobile}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive('/profile')
                    ? 'bg-primary-50 text-primary-700 font-bold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>👤</span>
                <span>ملفي الشخصي وتفضيلات القراءة</span>
              </Link>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
              <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                سجل حساباً مجانياً للتعليق، وحفظ الكتب، وتخصيص قراءاتك.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <Link to="/login" onClick={closeMobile}>
                  <Button variant="primary" size="sm" className="w-full text-xs font-bold">
                    تسجيل الدخول بالبريد
                  </Button>
                </Link>
                <Link to="/login?mode=register" onClick={closeMobile}>
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold bg-white">
                    إنشاء حساب قارئ جديد
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Session Footer inside sidebar */}
      {user && (
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={`/storage/${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.charAt(0)
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="text-xs text-red-600 hover:text-red-800 p-1 rounded-md font-semibold cursor-pointer"
            title="تسجيل الخروج"
          >
            خروج
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100/70 flex flex-col font-sans" dir="rtl">
      {/* Top Header Navbar */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
              aria-label="القائمة الجانبية"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-3 group">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white font-bold flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
                ق
              </span>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                  {authorName || 'منصة الكاتب'}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">المنصة الأدبية الرقمية</span>
              </div>
            </Link>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdminOrStaff && (
              <Link to="/admin" className="hidden sm:inline-block">
                <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl hover:bg-amber-200 transition-colors">
                  🛡️ لوحة الإدارة
                </span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                  title="الملف الشخصي"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs overflow-hidden border border-primary-200">
                    {user.avatar ? (
                      <img src={`/storage/${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <span className="text-xs font-bold text-gray-800 hidden md:inline">{user.name}</span>
                </Link>

                <button
                  onClick={() => logout()}
                  className="text-xs text-red-600 hover:text-red-800 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors font-medium cursor-pointer"
                >
                  خروج
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loginWithGoogle()}
                  className="hidden sm:flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>جوجل</span>
                </button>

                <Link to="/login">
                  <Button variant="primary" size="sm" className="text-xs font-bold">
                    دخول / تسجيل
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container with Persistent Sidebar Grid */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex gap-6">
        {/* DESKTOP PERSISTENT SIDEBAR (Always available for both Admin and Audience) */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-22 bg-white rounded-3xl border border-gray-200 shadow-xs max-h-[calc(100vh-6.5rem)] overflow-y-auto">
            {renderSidebarContent()}
          </div>
        </aside>

        {/* MOBILE SLIDE-OVER DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={closeMobile}
            />

            {/* Drawer */}
            <div className="relative w-80 max-w-[85%] bg-white h-full shadow-2xl z-10 flex flex-col overflow-y-auto">
              <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <span className="font-extrabold text-gray-900">قائمة المنصة</span>
                <button
                  onClick={closeMobile}
                  className="text-gray-400 hover:text-gray-600 p-1 text-xl font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              {renderSidebarContent()}
            </div>
          </div>
        )}

        {/* MAIN BODY CONTENT AREA */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Persistent Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 mt-8">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p>© {new Date().getFullYear()} جميع الحقوق محفوظة لمنصة الكاتب والنشر الرقمي.</p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/" className="hover:text-primary-600">الرئيسية</Link>
            <span>•</span>
            <Link to="/publications" className="hover:text-primary-600">المؤلفات</Link>
            <span>•</span>
            <Link to="/profile" className="hover:text-primary-600">حسابي</Link>
            {isAdminOrStaff && (
              <>
                <span>•</span>
                <Link to="/admin" className="text-primary-700 font-bold hover:underline">لوحة الإدارة</Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../atoms/Button';

interface PublicNavbarProps {
  authorName?: string;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ authorName }) => {
  const location = useLocation();
  const { user, logout, loginWithGoogle } = useAuth();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const canAccessAdmin = user && (user.roles?.includes('admin') || user.roles?.includes('author') || user.roles?.includes('editor'));

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Author identity */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-700 to-primary-500 text-white font-bold flex items-center justify-center text-lg shadow-sm group-hover:scale-105 transition-transform">
              ق
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                {authorName || 'منصة الكاتب'}
              </span>
              <span className="text-xs text-gray-500 font-medium">المنصة الأدبية الرقمية</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 mr-4">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                isActive('/')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              }`}
            >
              الأخبار والمستجدات
            </Link>
            <Link
              to="/publications"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                isActive('/publications')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
              }`}
            >
              المؤلفات والكتب
            </Link>
          </nav>
        </div>

        {/* User Account / Admin Action */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
                title="الملف الشخصي وتفضيلات القراءة"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs overflow-hidden border border-primary-200">
                  {user.avatar ? (
                    <img src={`/storage/${user.avatar}`} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-800 hidden sm:inline">{user.name}</span>
              </Link>

              {canAccessAdmin && (
                <Link to="/admin">
                  <Button variant="secondary" size="sm" className="text-xs">
                    لوحة الإدارة
                  </Button>
                </Link>
              )}

              <button
                onClick={() => logout()}
                className="text-xs text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium cursor-pointer"
                title="تسجيل الخروج"
              >
                خروج
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => loginWithGoogle()}
                className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                <span>دخول جوجل</span>
              </button>

              <Link to="/login">
                <Button variant="outline" size="sm" className="text-xs">
                  دخول المشرفين
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '../atoms/Button';

interface PublicNavbarProps {
  authorName?: string;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ authorName }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

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

        {/* Action button */}
        <div className="flex items-center gap-3">
          <div className="md:hidden flex items-center gap-1">
            <Link
              to="/"
              className={`px-2.5 py-1 text-xs rounded-md font-medium ${
                isActive('/') ? 'text-primary-700 font-bold' : 'text-gray-600'
              }`}
            >
              الأخبار
            </Link>
            <Link
              to="/publications"
              className={`px-2.5 py-1 text-xs rounded-md font-medium ${
                isActive('/publications') ? 'text-primary-700 font-bold' : 'text-gray-600'
              }`}
            >
              المؤلفات
            </Link>
          </div>

          <Link to="/admin">
            <Button variant="secondary" size="sm" className="text-xs sm:text-sm">
              لوحة الإدارة
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

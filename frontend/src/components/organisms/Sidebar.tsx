import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { name: 'لوحة القيادة', path: '/admin', exact: true },
  { name: 'إدارة الكتب', path: '/admin/books', exact: false },
  { name: 'الأخبار والمقالات', path: '/admin/news', exact: false },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-l border-gray-200 hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">منصة المؤلف</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `group flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-primary-700 bg-primary-50/70 hover:bg-primary-100/70 rounded-xl transition-colors"
        >
          <span>زيارة المنصة العامة</span>
          <span>↗</span>
        </a>
      </div>
      <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
        الإصدار 0.2 — Sprint 02
      </div>
    </aside>
  );
};

export default Sidebar;

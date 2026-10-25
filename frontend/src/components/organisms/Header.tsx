import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center">
        {/* Placeholder for Mobile Menu Button */}
        <h2 className="text-lg font-medium text-gray-800">
          إدارة المحتوى
        </h2>
      </div>
      <div className="flex items-center space-x-4 space-x-reverse">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          تسجيل الخروج
        </button>
      </div>
    </header>
  );
};

export default Header;

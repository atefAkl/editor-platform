import React from 'react';

const BooksPlaceholder = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">إدارة الكتب</h1>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition-colors">
          إضافة كتاب جديد
        </button>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-6 text-center text-gray-500 py-16">
          <p className="text-lg mb-2">وحدة إدارة الكتب</p>
          <p className="text-sm">سيتم تنفيذ ميزات عرض وإضافة وتعديل الكتب في Sprint 02.</p>
        </div>
      </div>
    </div>
  );
};

export default BooksPlaceholder;

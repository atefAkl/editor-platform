import React from 'react';

const StatCard = ({ title, value, colorClass }: { title: string, value: string, colorClass: string }) => (
  <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-100">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className={`mt-1 text-3xl font-semibold ${colorClass}`}>{value}</p>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">نظرة عامة</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="الكتب" value="0" colorClass="text-primary-600" />
        <StatCard title="الأخبار" value="0" colorClass="text-blue-600" />
        <StatCard title="المسودات" value="0" colorClass="text-yellow-600" />
        <StatCard title="المنشور" value="0" colorClass="text-green-600" />
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">أحدث النشاطات</h3>
        <div className="text-center py-10 text-gray-500">
          لا توجد بيانات لعرضها حالياً.
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

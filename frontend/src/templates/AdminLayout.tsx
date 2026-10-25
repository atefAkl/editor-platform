import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/organisms/Sidebar';
import Header from '../components/organisms/Header';

const AdminLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 w-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AdminLayout from './templates/AdminLayout';
import Dashboard from './pages/Dashboard';
import { BooksListPage } from './pages/BooksListPage';
import { BookCreatePage } from './pages/BookCreatePage';
import { BookDetailPage } from './pages/BookDetailPage';
import { BookEditPage } from './pages/BookEditPage';
import NewsPlaceholder from './pages/NewsPlaceholder';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';

const AuthGuard = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">جاري التحميل...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<AuthGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="books" element={<BooksListPage />} />
              <Route path="books/create" element={<BookCreatePage />} />
              <Route path="books/:id" element={<BookDetailPage />} />
              <Route path="books/:id/edit" element={<BookEditPage />} />
              <Route path="news" element={<NewsPlaceholder />} />
            </Route>
          </Route>
          
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

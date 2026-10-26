import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import AdminLayout from './templates/AdminLayout';
import Dashboard from './pages/Dashboard';
import { BooksListPage } from './pages/BooksListPage';
import { BookCreatePage } from './pages/BookCreatePage';
import { BookDetailPage } from './pages/BookDetailPage';
import { BookEditPage } from './pages/BookEditPage';
import { FeedPage } from './pages/FeedPage';
import { PublicationsPage } from './pages/PublicationsPage';
import { SinglePostPage } from './pages/SinglePostPage';
import { PublicBookDetailsPage } from './pages/PublicBookDetailsPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import NewsPlaceholder from './pages/NewsPlaceholder';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './hooks/useAuth';

const AuthGuard = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-gray-500">جاري التحميل...</div>;
  if (!user) return <NavigateToLogin />;

  // Self-registered readers have no staff permissions: keep them out of the admin UI.
  // (UI guard only — the API enforces permissions independently on every request.)
  const isStaff = (user.roles || []).includes('admin') || (user.permissions || []).length > 0;
  if (!isStaff) return <Navigate to="/" replace />;
  
  return <Outlet />;
};

const NavigateToLogin = () => {
  window.location.href = '/login';
  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Visitor Facing Pages */}
          <Route path="/" element={<FeedPage />} />
          <Route path="/publications" element={<PublicationsPage />} />
          <Route path="/posts/:id" element={<SinglePostPage />} />
          <Route path="/books/:slug" element={<PublicBookDetailsPage />} />
          <Route path="/profile" element={<PublicProfilePage />} />

          {/* Admin Auth & Shell */}
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<AuthGuard />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="books" element={<BooksListPage />} />
              <Route path="books/create" element={<BookCreatePage />} />
              <Route path="books/:id" element={<BookDetailPage />} />
              <Route path="books/:id/edit" element={<BookEditPage />} />
              <Route path="news" element={<NewsPlaceholder />} />
              <Route path="profile" element={<AdminProfilePage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

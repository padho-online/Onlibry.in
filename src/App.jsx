// src/App.jsx
// UPDATED - Added Blog CMS Routes + Notification Routes + Home Editor Admin Route
// 🔥 FIXED: Page view logging with React Router

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

import { initPageViewLogger, logCurrentPageView } from './services/loggerService';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminGuard from './components/AdminGuard';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import FilesPage from './pages/FilesPage';
import FoldersPage from './pages/FoldersPage';
import SavedFilesPage from './pages/SavedFilesPage';
import MockTestsPage from './pages/MockTestsPage';
import ExamPage from './pages/ExamPage';
import ExamResultsPage from './pages/ExamResultsPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizExamPage from './pages/QuizExamPage';
import QuizResultsPage from './pages/QuizResultsPage';
import ViewerPage from './pages/ViewerPage';
import NotFoundPage from './pages/NotFoundPage';

// Blog Pages
import BlogHome from './blogger/pages/BlogHome';
import BlogPage from './blogger/pages/BlogPage';
import BlogDashboard from './blogger/pages/BlogDashboard';
import CreatePost from './blogger/pages/CreatePost';
import EditPost from './blogger/pages/EditPost';

// Notification Pages
import NotificationsPage from './pages/NotificationsPage';
import NotificationDetailPage from './pages/NotificationDetailPage';

// Import Info Pages
import InfoHub from './Info/InfoHub';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PaymentLogs from './pages/admin/PaymentLogs';
import UsersManagement from './pages/admin/UsersManagement';
import PlansEditor from './pages/admin/PlansEditor';
import FilesManager from './pages/admin/FilesManager';
import FileUploadManager from './pages/admin/FileUploadManager';
import HomeEditor from './pages/admin/HomeEditor';

// 🔥 NEW: Component to track route changes for page views
function RouteChangeTracker() {
  const location = useLocation();

  useEffect(() => {
    // Log page view on every route change
    logCurrentPageView();
  }, [location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    // Initialize logger (for popstate and beforeunload)
    initPageViewLogger();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <MainLayout>
              {/* 🔥 Route change tracker - logs every page view */}
              <RouteChangeTracker />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/files" element={<FilesPage />} />
                <Route path="/folders" element={<FoldersPage />} />
                <Route path="/mock-tests" element={<MockTestsPage />} />
                <Route path="/mock-test/:examName" element={<ExamPage />} />
                <Route path="/mock-test-results" element={<ExamResultsPage />} />
                <Route path="/quizzes" element={<QuizzesPage />} />
                <Route path="/quiz/:quizName" element={<QuizExamPage />} />
                <Route path="/quiz-results" element={<QuizResultsPage />} />

                {/* Blog Routes */}
                <Route path="/blog" element={<BlogHome />} />
                <Route path="/blog/:slug" element={<BlogPage />} />

                {/* Notification Routes */}
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/notification/:id" element={<NotificationDetailPage />} />

                {/* Info Pages */}
                <Route path="/info" element={<InfoHub />} />
                <Route path="/info/:tab" element={<InfoHub />} />

                {/* Protected Blog Routes */}
                <Route
                  path="/blog/dashboard"
                  element={
                    <ProtectedRoute>
                      <BlogDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blog/create"
                  element={
                    <ProtectedRoute>
                      <CreatePost />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/blog/edit/:id"
                  element={
                    <ProtectedRoute>
                      <EditPost />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/saved-files"
                  element={
                    <ProtectedRoute>
                      <SavedFilesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Viewer */}
                <Route path="/viewer/:fileId" element={<ViewerPage />} />
                <Route path="/viewer" element={<ViewerPage />} />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminDashboard />
                    </AdminGuard>
                  }
                >
                  <Route index element={<FileUploadManager />} />
                  <Route path="upload" element={<FileUploadManager />} />
                  <Route path="files" element={<FilesManager />} />
                  <Route path="home" element={<HomeEditor />} />
                  <Route path="logs" element={<PaymentLogs />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="plans" element={<PlansEditor />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </MainLayout>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
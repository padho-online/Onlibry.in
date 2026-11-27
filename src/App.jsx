// src/App.jsx
// Onlibry Application
// CanonicalX V1 - Dynamic SEO Canonical Integration
// Blog CMS + Notifications + Admin Dashboard
// Page View Logging + Protected Routes

import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation
} from 'react-router-dom';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';

// SEO Engine
import CanonicalX from './seo/CanonicalX';
import MetaX from './seo/MetaX';

// Analytics and Logging
import {
  initPageViewLogger,
  logCurrentPageView
} from './services/loggerService';

// Layout and Route Protection
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
import ExamUpdatesPage from './pages/ExamUpdatesPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationDetailPage from './pages/NotificationDetailPage';

// Information Pages
import InfoHub from './Info/InfoHub';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PlansEditor from './pages/admin/PlansEditor';
import FilesManager from './pages/admin/FilesManager';
import FileUploadManager from './pages/admin/FileUploadManager';
import HomeEditor from './pages/admin/HomeEditor';


// ========================================
// PAGE VIEW TRACKER
// ========================================

function RouteChangeTracker() {
  const location = useLocation();

  useEffect(() => {
    logCurrentPageView();
  }, [location.pathname]);

  return null;
}


// ========================================
// MAIN APPLICATION
// ========================================

function App() {

  useEffect(() => {
    initPageViewLogger();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>

            {/* CanonicalX SEO Engine */}
            <CanonicalX />
            <MetaX />
            <MainLayout>

              {/* Page View Tracking */}
              <RouteChangeTracker />

              <Routes>

                {/* =========================
                    PUBLIC ROUTES
                ========================= */}

                <Route path="/" element={<HomePage />} />

                <Route
                  path="/login"
                  element={<LoginPage />}
                />

                <Route
                  path="/pricing"
                  element={<PricingPage />}
                />


                {/* =========================
                    FILES AND FOLDERS
                ========================= */}

                <Route
                  path="/files"
                  element={<FilesPage />}
                />

                <Route
                  path="/files/search/:mode/:query*"
                  element={<FilesPage />}
                />

                <Route
                  path="/files/search/:query*"
                  element={<FilesPage />}
                />

                <Route
                  path="/folders"
                  element={<FoldersPage />}
                />


                {/* =========================
                    MOCK TESTS
                ========================= */}

                <Route
                  path="/mock-tests"
                  element={<MockTestsPage />}
                />

                <Route
                  path="/mock-test/:examName"
                  element={<ExamPage />}
                />

                <Route
                  path="/mock-test-results"
                  element={<ExamResultsPage />}
                />


                {/* =========================
                    QUIZZES
                ========================= */}

                <Route
                  path="/quizzes"
                  element={<QuizzesPage />}
                />

                <Route
                  path="/quiz/:quizName"
                  element={<QuizExamPage />}
                />

                <Route
                  path="/quiz-results"
                  element={<QuizResultsPage />}
                />


                {/* =========================
                    PUBLIC BLOG ROUTES
                ========================= */}

                <Route
                  path="/blog"
                  element={<BlogHome />}
                />

                <Route
                  path="/blog/:slug"
                  element={<BlogPage />}
                />


                {/* =========================
                    EXAM AND NOTIFICATIONS
                ========================= */}

                <Route
                  path="/exam-updates"
                  element={<ExamUpdatesPage />}
                />

                <Route
                  path="/notifications"
                  element={<NotificationsPage />}
                />

                <Route
                  path="/notification/:id"
                  element={<NotificationDetailPage />}
                />


                {/* =========================
                    INFORMATION ROUTES
                ========================= */}

                <Route
                  path="/info"
                  element={<InfoHub />}
                />

                <Route
                  path="/info/:tab"
                  element={<InfoHub />}
                />


                {/* =========================
                    PROTECTED BLOG ROUTES
                ========================= */}

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


                {/* =========================
                    PROTECTED USER ROUTES
                ========================= */}

                <Route
                  path="/saved-files"
                  element={
                    <ProtectedRoute>
                      <SavedFilesPage />
                    </ProtectedRoute>
                  }
                />


                {/* =========================
                    FILE VIEWER
                ========================= */}

                <Route
                  path="/viewer/:fileId"
                  element={<ViewerPage />}
                />

                <Route
                  path="/viewer"
                  element={<ViewerPage />}
                />


                {/* =========================
                    ADMIN ROUTES
                ========================= */}

                <Route
                  path="/admin"
                  element={
                    <AdminGuard>
                      <AdminDashboard />
                    </AdminGuard>
                  }
                >

                  <Route
                    index
                    element={<FileUploadManager />}
                  />

                  <Route
                    path="upload"
                    element={<FileUploadManager />}
                  />

                  <Route
                    path="files"
                    element={<FilesManager />}
                  />

                  <Route
                    path="home"
                    element={<HomeEditor />}
                  />

                  <Route
                    path="plans"
                    element={<PlansEditor />}
                  />

                </Route>


                {/* =========================
                    404 NOT FOUND
                ========================= */}

                <Route
                  path="*"
                  element={<NotFoundPage />}
                />

              </Routes>

            </MainLayout>

          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
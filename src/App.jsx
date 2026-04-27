import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminGuard from './components/AdminGuard';

// =====================
// PUBLIC PAGES
// =====================
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import FilesPage from './pages/FilesPage';
import FoldersPage from './pages/FoldersPage';
import SavedFilesPage from './pages/SavedFilesPage';
import MockTestsPage from './pages/MockTestsPage';
import ExamPage from './pages/ExamPage';
import ExamResultsPage from './pages/ExamResultsPage';
import ViewerPage from './pages/ViewerPage';
import NotFoundPage from './pages/NotFoundPage';

// =====================
// ADMIN PAGES
// =====================
import AdminDashboard from './pages/admin/AdminDashboard';
import PaymentLogs from './pages/admin/PaymentLogs';
import UsersManagement from './pages/admin/UsersManagement';
import SubscriptionsManagement from './pages/admin/SubscriptionsManagement';
import PlansEditor from './pages/admin/PlansEditor';
import FilesManager from './pages/admin/FilesManager';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MainLayout>
            <Routes>
              {/* ===================== */}
              {/* PUBLIC ROUTES */}
              {/* ===================== */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/folders" element={<FoldersPage />} />
              <Route path="/mock-tests" element={<MockTestsPage />} />
              <Route path="/mock-test/:examName" element={<ExamPage />} />
              <Route
                path="/mock-test-results"
                element={<ExamResultsPage />}
              />

              {/* ===================== */}
              {/* PROTECTED ROUTES */}
              {/* ===================== */}
              <Route
                path="/saved-files"
                element={
                  <ProtectedRoute>
                    <SavedFilesPage />
                  </ProtectedRoute>
                }
              />

              {/* ===================== */}
              {/* VIEWER ROUTES */}
              {/* ===================== */}
              <Route path="/viewer/:fileId" element={<ViewerPage />} />
              <Route path="/viewer" element={<ViewerPage />} />

              {/* ===================== */}
              {/* ADMIN ROUTES */}
              {/* ===================== */}
              <Route
                path="/admin"
                element={
                  <AdminGuard>
                    <AdminDashboard />
                  </AdminGuard>
                }
              >
                <Route index element={<PaymentLogs />} />
                <Route path="logs" element={<PaymentLogs />} />
                <Route path="users" element={<UsersManagement />} />
                <Route
                  path="subscriptions"
                  element={<SubscriptionsManagement />}
                />
                <Route path="plans" element={<PlansEditor />} />
                <Route path="files" element={<FilesManager />} />
              </Route>

              {/* ===================== */}
              {/* 404 */}
              {/* ===================== */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminGuard from './components/AdminGuard';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import FilesPage from './pages/FilesPage';
import FoldersPage from './pages/FoldersPage';
import MockTestsPage from './pages/MockTestsPage';
import ExamPage from './pages/ExamPage';
import ExamResultsPage from './pages/ExamResultsPage';
import NotFoundPage from './pages/NotFoundPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import PaymentLogs from './pages/admin/PaymentLogs';

// Temporary Pages
const QuizPage = () => (
  <div className="text-center py-20">
    <h2 className="text-2xl">Quiz (Coming Soon)</h2>
  </div>
);

const DashboardPage = () => (
  <div className="text-center py-20">
    <h2 className="text-2xl">Dashboard (Coming Soon)</h2>
  </div>
);

const UsersManagementPage = () => (
  <div className="text-center py-20">
    <h2 className="text-2xl">Users Management (Coming Soon)</h2>
  </div>
);

const SubscriptionsPage = () => (
  <div className="text-center py-20">
    <h2 className="text-2xl">Subscriptions Management (Coming Soon)</h2>
  </div>
);

const PlansEditorPage = () => (
  <div className="text-center py-20">
    <h2 className="text-2xl">Plans Editor (Coming Soon)</h2>
  </div>
);

const FilesManagerPage = () => (
  <div className="text-center py-20">
    <h2 className="text-2xl">Files Manager (Coming Soon)</h2>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MainLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="/folders" element={<FoldersPage />} />
              <Route path="/mock-tests" element={<MockTestsPage />} />
              <Route path="/mock-test/:examName" element={<ExamPage />} />
              <Route path="*" element={<NotFoundPage />} />
              <Route
                path="/mock-test-results"
                element={<ExamResultsPage />}
              />
              <Route path="/quiz" element={<QuizPage />} />

              {/* Protected User Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
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
                <Route path="users" element={<UsersManagementPage />} />
                <Route
                  path="subscriptions"
                  element={<SubscriptionsPage />}
                />
                <Route path="plans" element={<PlansEditorPage />} />
                <Route path="files" element={<FilesManagerPage />} />
              </Route>
            </Routes>
          </MainLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
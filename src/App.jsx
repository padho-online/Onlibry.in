import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminGuard from './components/AdminGuard';

// Pages
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
              <Route path="/mock-test-results" element={<ExamResultsPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              }>
                <Route index element={<PaymentLogs />} />
                <Route path="logs" element={<PaymentLogs />} />
                <Route path="users" element={
                  <div className="text-center py-20 text-gray-500">Users Management (Coming Soon)</div>
                } />
                <Route path="subscriptions" element={
                  <div className="text-center py-20 text-gray-500">Subscriptions Management (Coming Soon)</div>
                } />
                <Route path="plans" element={
                  <div className="text-center py-20 text-gray-500">Plans Editor (Coming Soon)</div>
                } />
                <Route path="files" element={
                  <div className="text-center py-20 text-gray-500">Files Manager (Coming Soon)</div>
                } />
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
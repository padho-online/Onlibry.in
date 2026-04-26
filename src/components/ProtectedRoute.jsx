import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, requireSubscription = false }) {
  const { user, loading, isSubscribed } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  if (requireSubscription && !isSubscribed) {
    return <Navigate to="/pricing" state={{ from: window.location.pathname }} replace />;
  }

  return children;
}

export default ProtectedRoute;
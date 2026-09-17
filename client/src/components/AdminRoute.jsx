import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AdminRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user is not ADMIN or SUPPORT, bounce to home
  if (user.role !== 'ADMIN' && user.role !== 'SUPPORT') {
    return <Navigate to="/" replace />;
  }

  // If user is SUPPORT and tries to access admin-only sections (anything other than /admin/orders and /admin/returns)
  if (user.role === 'SUPPORT') {
    const path = location.pathname.toLowerCase();
    const isSupportAllowedPath = path.startsWith('/admin/orders') || path.startsWith('/admin/returns');
    if (!isSupportAllowedPath) {
      return <Navigate to="/admin/orders" replace />;
    }
  }

  return children;
};

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import NotificationBell from '../Navbar/NotificationBell';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight } from 'lucide-react';

export default function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();

  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-sm">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            <span className="text-gray-400">Admin</span>
            {pathSegments.slice(1).map((seg, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className="capitalize text-gray-800 font-bold">{seg.replace(/-/g, ' ')}</span>
              </React.Fragment>
            ))}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 font-bold text-xs flex items-center justify-center">
                {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
              </div>
              <span className="text-xs font-bold text-gray-700 hidden sm:inline-block">
                {user?.name || user?.email?.split('@')[0]}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  RotateCcw,
  Users,
  ShieldAlert,
  Ticket,
  ScrollText,
  LogOut,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSupport = user?.role === 'SUPPORT';

  // Navigation Items
  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true, adminOnly: true },
    { to: '/admin/products', label: 'Products', icon: Package, adminOnly: true },
    { to: '/admin/inventory', label: 'Inventory', icon: Boxes, adminOnly: true },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag, adminOnly: false },
    { to: '/admin/returns', label: 'Returns (RMA)', icon: RotateCcw, adminOnly: false },
    { to: '/admin/users', label: 'Users & Roles', icon: Users, adminOnly: true },
    { to: '/admin/moderation', label: 'Moderation', icon: ShieldAlert, adminOnly: true },
    { to: '/admin/coupons', label: 'Coupons', icon: Ticket, adminOnly: true },
    { to: '/admin/audit', label: 'Audit Logs', icon: ScrollText, adminOnly: true },
  ];

  // Filter items if support role
  const visibleNavItems = isSupport
    ? navItems.filter((item) => !item.adminOnly)
    : navItems;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 min-h-screen">
      {/* Brand Logo */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/60">
        <Link to="/admin" className="flex items-center gap-2 text-white font-extrabold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Cpu className="w-4 h-4" />
          </div>
          <span>BuildForge <span className="text-blue-500 text-xs uppercase px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">Admin</span></span>
        </Link>
      </div>

      {/* User Info Capsule */}
      <div className="px-4 py-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 font-extrabold text-sm flex items-center justify-center">
            {(user?.name?.[0] || user?.email?.[0] || 'A').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-100 truncate">{user?.name || user?.email?.split('@')[0]}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                user?.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Management</p>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-950/40">
        <Link
          to="/"
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition"
        >
          <span>Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

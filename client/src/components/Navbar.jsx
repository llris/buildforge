import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, Wrench, Globe, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useTheme } from '../contexts/ThemeContext';
import NotificationBell from './Navbar/NotificationBell';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemCount: cartCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 lg:px-8 py-3.5 flex justify-between items-center relative z-50 shadow-sm transition-colors duration-200">
      <div className="flex items-center space-x-8">
        <Link to="/" className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight flex items-center gap-1.5">
          <span>BuildForge</span>
        </Link>

        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600 dark:text-slate-300">
          <Link to="/products" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Catalog
          </Link>
          <Link to="/builder" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
            <Wrench className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            PC Builder
          </Link>
          <Link to="/gallery" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Build Gallery
          </Link>
          <Link to="/compare" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Compare
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-5">
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-44 md:w-60">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parts, specs..."
            className="w-full text-sm bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg pl-3 pr-9 py-1.5 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          <button type="submit" className="absolute right-2.5 top-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Search">
            <Search className="w-4 h-4" />
          </button>
        </form>

        {/* Dark/Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Wishlist Link with Badge */}
        <Link
          to="/wishlist"
          className="relative text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
          title="Wishlist"
          aria-label="Wishlist"
        >
          <Heart className="w-6 h-6" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] font-bold h-4 w-4 flex items-center justify-center shadow-sm">
              {wishlistCount > 9 ? '9+' : wishlistCount}
            </span>
          )}
        </Link>

        {/* Cart Link with Badge */}
        <Link
          to="/cart"
          className="relative text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
          title="Shopping Cart"
          aria-label="Shopping Cart"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full text-[10px] font-bold h-4 w-4 flex items-center justify-center shadow-sm">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>

        {/* User Menu or Auth Links */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-1 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
              aria-label="User Account Menu"
            >
              <User className="w-6 h-6" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl shadow-xl py-1.5 border border-gray-200 dark:border-slate-800 animate-fade-in z-50">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate mt-0.5">{user.email}</p>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/builds"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Saved Builds
                </Link>
                <Link
                  to="/gallery"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Build Gallery
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center justify-between"
                >
                  <span>Wishlist</span>
                  {wishlistCount > 0 && (
                    <span className="bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/tracking"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Order Tracking
                </Link>
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold"
                  >
                    Admin Panel
                  </Link>
                )}
                <div className="border-t border-gray-100 dark:border-slate-800 my-1"></div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 font-medium"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-sm text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm bg-blue-600 text-white font-medium px-3.5 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm transition"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

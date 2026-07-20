import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center relative z-50">
      <Link to="/" className="text-xl font-bold text-blue-600">BuildForge</Link>
      <div className="flex items-center space-x-6">
        <div className="relative">
          <input type="text" placeholder="Search..." className="border rounded-md px-3 py-1 focus:outline-none focus:ring focus:border-blue-300" />
          <Search className="absolute right-2 top-1.5 w-5 h-5 text-gray-400" />
        </div>
        
        {user ? (
          <>
            <Link to="/wishlist" className="text-gray-600 hover:text-blue-600"><Heart className="w-6 h-6" /></Link>
            <Link to="/cart" className="relative text-gray-600 hover:text-blue-600">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">0</span>
            </Link>
            
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 focus:outline-none"
              >
                <User className="w-6 h-6" />
              </button>
              
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Dashboard
                  </Link>
                  <Link to="/builds" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Saved Builds
                  </Link>
                  <Link to="/tracking" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    Orders
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium">
                      Admin Panel
                    </Link>
                  )}
                  <button 
                    onClick={() => { setIsMenuOpen(false); handleLogout(); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex space-x-4">
            <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Log in</Link>
            <Link to="/register" className="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 transition">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

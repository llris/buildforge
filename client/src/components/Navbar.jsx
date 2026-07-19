import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, User, Search } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md p-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-blue-600">BuildForge</Link>
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input type="text" placeholder="Search..." className="border rounded-md px-3 py-1 focus:outline-none focus:ring focus:border-blue-300" />
          <Search className="absolute right-2 top-1.5 w-5 h-5 text-gray-400" />
        </div>
        <select className="border rounded-md px-2 py-1 bg-white">
          <option>Categories</option>
          <option>CPUs</option>
          <option>GPUs</option>
        </select>
        <Link to="/wishlist"><Heart className="w-6 h-6 text-gray-600" /></Link>
        <Link to="/cart" className="relative">
          <ShoppingCart className="w-6 h-6 text-gray-600" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center">0</span>
        </Link>
        <Link to="/dashboard"><User className="w-6 h-6 text-gray-600" /></Link>
      </div>
    </nav>
  );
};

export default Navbar;

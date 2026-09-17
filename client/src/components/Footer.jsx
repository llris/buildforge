import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 p-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <p>&copy; {new Date().getFullYear()} BuildForge Inc. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link to="/products" className="hover:text-white transition">
            Hardware Catalog
          </Link>
          <Link to="/builder" className="hover:text-white transition">
            PC Builder
          </Link>
          <Link to="/terms" className="text-gray-300 hover:text-blue-400 font-semibold transition">
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

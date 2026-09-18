import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin, Cpu } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-gray-800 text-xs sm:text-sm">
          {/* Company & Registered Office */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-base tracking-tight">BuildForge Technologies</span>
            </div>
            <p className="text-gray-400 leading-relaxed text-xs">
              High-performance PC hardware retailer and algorithmic custom system configurator platform.
            </p>
            <div className="flex items-start gap-2 text-gray-400 text-xs pt-1">
              <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
              <span>Registered Office: JVLR, Jogeshwari, Mumbai 400060, Maharashtra, India</span>
            </div>
          </div>

          {/* Quick Platform Navigation */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/builder" className="hover:text-white transition">
                  PC Builder & Compatibility
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-white transition">
                  Hardware Catalog
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-white transition">
                  Public Build Gallery
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition">
                  Component Comparison
                </Link>
              </li>
            </ul>
          </div>

          {/* Grievance & Statutory Disclosures */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Grievance Redressal</span>
            </h4>
            <div className="space-y-1.5 text-xs text-gray-400">
              <p className="font-medium text-gray-300">Grievance Officer: Travis Hancock</p>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <a href="mailto:grievance@buildforge.in" className="hover:text-blue-400 transition">
                  grievance@buildforge.in
                </a>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                <a href="tel:+919930460497" className="hover:text-blue-400 transition">
                  +91 99304 60497
                </a>
              </div>
              <p className="text-[11px] text-gray-500 pt-1">
                Consumer Protection (E-Commerce) Rules, 2020 Compliance
              </p>
            </div>
          </div>
        </div>

        {/* Legal Links & Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-gray-500 text-center sm:text-left">
            &copy; {currentYear} BuildForge Technologies. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-gray-400 font-medium">
            <Link to="/terms" className="hover:text-blue-400 transition">
              Terms & Conditions
            </Link>
            <span className="text-gray-700">•</span>
            <Link to="/disclaimer" className="hover:text-amber-400 transition">
              Disclaimer
            </Link>
            <span className="text-gray-700">•</span>
            <Link to="/privacy" className="hover:text-emerald-400 transition">
              Privacy Policy
            </Link>
            <span className="text-gray-700">•</span>
            <Link to="/copyright" className="hover:text-purple-400 transition">
              Copyright Notice
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

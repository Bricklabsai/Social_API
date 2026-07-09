import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';

const PublicNavbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const scrollTo = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#168eea] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">SH</span>
          </div>
          <span className="font-semibold text-gray-900">SocialHub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
          <button onClick={() => scrollTo('features')} className="hover:text-gray-900 transition-colors">
            Features
          </button>
          <button onClick={() => scrollTo('pricing')} className="hover:text-gray-900 transition-colors">
            Pricing
          </button>
          <Link to="/login" className="hover:text-gray-900 transition-colors">
            Log in
          </Link>
          <button
            onClick={() => navigate('/register')}
            className="px-4 py-2 bg-[#168eea] hover:bg-[#1378d4] text-white font-medium rounded-lg transition-colors"
          >
            Get started free
          </button>
        </nav>

        <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(!open)}>
          {open ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3">
          <button onClick={() => scrollTo('features')} className="block w-full text-left text-gray-600 py-2">
            Features
          </button>
          <button onClick={() => scrollTo('pricing')} className="block w-full text-left text-gray-600 py-2">
            Pricing
          </button>
          <Link to="/login" className="block text-gray-600 py-2" onClick={() => setOpen(false)}>
            Log in
          </Link>
          <button
            onClick={() => navigate('/register')}
            className="w-full px-4 py-2.5 bg-[#168eea] text-white font-medium rounded-lg"
          >
            Get started free
          </button>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;

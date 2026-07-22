import React from 'react';
import { Link } from 'react-router-dom';

const PublicFooter = () => (
  <footer className="bg-white border-t border-gray-100 py-12">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#168eea] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">SH</span>
          </div>
          <span className="font-semibold text-gray-900">SocialHub</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-500">
          <Link to="/developers" className="hover:text-gray-700">Developers</Link>
          <Link to="/privacy" className="hover:text-gray-700">Privacy</Link>
          <Link to="/terms" className="hover:text-gray-700">Terms</Link>
          <Link to="/login" className="hover:text-gray-700">Log in</Link>
        </div>
        <p className="text-sm text-gray-400">© {new Date().getFullYear()} SocialHub. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default PublicFooter;

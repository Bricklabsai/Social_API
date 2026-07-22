import React from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

/**
 * Shared chrome for public legal/marketing pages (no auth required).
 * TikTok and other platform reviewers must reach these without login.
 */
export default function PublicPageLayout({ children, title }) {
  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          )}
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

export function PublicLegalCard({ children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-gray-600">
      {children}
    </div>
  );
}

export function PublicBackLink({ to = '/', label = 'Back to home' }) {
  return (
    <Link to={to} className="inline-block text-sm text-[#168eea] hover:underline mb-6">
      ← {label}
    </Link>
  );
}

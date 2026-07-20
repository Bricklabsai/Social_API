import React, { useState } from 'react';
import { FaCloud, FaSpinner, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { platforms } from '../services/api';

/**
 * Bluesky connect modal — handle/email + app password (AT Proto session).
 * Create an app password at https://bsky.app/settings/app-passwords
 */
export default function BlueskyConnectModal({ isOpen, onClose, onSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const handle = identifier.trim().replace(/^@/, '');
    const password = appPassword.trim();
    if (!handle || !password) {
      toast.error('Enter your Bluesky handle and app password');
      return;
    }

    setSubmitting(true);
    try {
      await platforms.connectBluesky(handle, password);
      toast.success('Successfully connected to Bluesky!');
      setIdentifier('');
      setAppPassword('');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(
        typeof detail === 'string'
          ? detail
          : 'Failed to connect Bluesky. Check your handle and app password.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className="absolute inset-0"
        onClick={() => !submitting && onClose?.()}
        aria-hidden
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-100 p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0085ff]/10 flex items-center justify-center">
              <FaCloud className="text-[#0085ff]" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Connect Bluesky</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Use an app password — not your main login password
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onClose?.()}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Handle or email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="you.bsky.social"
              autoComplete="username"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0085ff]/30 focus:border-[#0085ff]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              App password
            </label>
            <input
              type="password"
              value={appPassword}
              onChange={(e) => setAppPassword(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx"
              autoComplete="current-password"
              disabled={submitting}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0085ff]/30 focus:border-[#0085ff]"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Create one at{' '}
              <a
                href="https://bsky.app/settings/app-passwords"
                target="_blank"
                rel="noreferrer"
                className="text-[#0085ff] hover:underline"
              >
                bsky.app/settings/app-passwords
              </a>
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#0085ff] text-white text-sm font-medium py-2.5 hover:bg-[#0074e0] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FaSpinner className="animate-spin" size={14} />
                Connecting…
              </>
            ) : (
              'Connect Bluesky'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiExternalLink } from 'react-icons/fi';
import PublicPageLayout, { PublicLegalCard } from '../components/marketing/PublicPageLayout';
import { PLATFORM_DISPLAY_NAMES, PLATFORM_IDS } from '../constants/platforms';

const Developers = () => (
  <PublicPageLayout>
    <PublicLegalCard>
      <p className="text-sm text-gray-500 mb-2">SocialHub — Developer Information</p>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">SocialHub for Developers</h1>
      <p className="text-gray-600 mb-6 leading-relaxed">
        SocialHub is a unified social media management platform that helps creators and businesses
        publish, schedule, and analyze content across multiple social networks from one dashboard.
        This page is publicly available for app store and platform review (including TikTok for Developers).
      </p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">What SocialHub does</h2>
        <ul className="space-y-2">
          {[
            'Connect social accounts via official OAuth (with user consent)',
            'Compose and schedule posts with live platform previews',
            'Publish text, images, and videos to connected channels',
            'View analytics and manage comments and messages in one inbox',
            'AI-assisted captions and Studio content repurposing',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-gray-600">
              <FiCheck className="text-emerald-500 mt-1 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Supported platforms</h2>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_IDS.map((p) => (
            <span
              key={p}
              className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm capitalize"
            >
              {PLATFORM_DISPLAY_NAMES[p] || p}
            </span>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">TikTok integration</h2>
        <p className="text-gray-600 mb-3">
          SocialHub uses the TikTok for Developers API so authenticated users can connect their
          TikTok account and publish videos they choose to upload. We request only the scopes
          required for login and content posting, in line with TikTok&apos;s developer policies.
        </p>
        <p className="text-gray-600">
          OAuth redirect URI:{' '}
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            https://socialbackend.bricklabsai.com/api/v1/auth/tiktok/callback
          </code>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Public pages</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { href: '/', label: 'Website home' },
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/login', label: 'Log in' },
            { href: '/register', label: 'Create account' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:border-[#168eea]/40 hover:bg-[#168eea]/5 transition-colors text-gray-700"
            >
              {label}
              <FiExternalLink size={14} className="text-gray-400" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
        <p className="text-gray-600">
          For developer or privacy inquiries:{' '}
          <a href="mailto:support@bricklabsai.com" className="text-[#168eea] hover:underline">
            support@bricklabsai.com
          </a>
        </p>
      </section>
    </PublicLegalCard>
  </PublicPageLayout>
);

export default Developers;

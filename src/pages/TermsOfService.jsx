import React from 'react';
import PublicPageLayout, { PublicLegalCard } from '../components/marketing/PublicPageLayout';

const TermsOfService = () => {
  return (
    <PublicPageLayout>
      <PublicLegalCard>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-6">Last updated: July 22, 2026</p>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>
              By using SocialHub (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), operated by BrickLabs AI, you agree to
              these Terms of Service. If you do not agree, please do not use our application at{' '}
              <a href="https://socialhub.bricklabsai.com" className="text-[#168eea] hover:underline">
                socialhub.bricklabsai.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
            <p>
              SocialHub is a unified social media management platform that allows users to publish content,
              schedule posts, manage comments and messages, view analytics, connect multiple social accounts,
              and use AI-powered tools including Studio content repurposing.
            </p>
            <p className="mt-2">Supported platforms include:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Facebook, Instagram, X (Twitter), Threads</li>
              <li>LinkedIn and LinkedIn Pages</li>
              <li>YouTube, TikTok, WhatsApp, Bluesky</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. TikTok Integration</h2>
            <p>
              When you connect your TikTok account, you authorize SocialHub to access your profile and
              publish videos you explicitly choose to upload. You may disconnect TikTok at any time from
              your dashboard. You must comply with TikTok&apos;s Terms of Service and Community Guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. User Content &amp; Studio</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>You retain ownership of content you upload or publish.</li>
              <li>You grant us a license to process your media for transcription and AI repurposing in Studio.</li>
              <li>You are solely responsible for the content you publish to any platform.</li>
              <li>You must have rights to any video, audio, or images you upload.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Acceptable Use</h2>
            <p>You agree not to use SocialHub for illegal purposes, spam, harassment, or to violate any
              connected platform&apos;s terms of service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Third-Party Services</h2>
            <p>
              SocialHub integrates with third-party social media platforms and cloud services. We are not
              responsible for the policies or availability of those services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact</h2>
            <p>
              Questions about these terms:{' '}
              <a href="mailto:support@bricklabsai.com" className="text-[#168eea] hover:underline">
                support@bricklabsai.com
              </a>
            </p>
          </section>
        </div>
      </PublicLegalCard>
    </PublicPageLayout>
  );
};

export default TermsOfService;

import React from 'react';
import PublicPageLayout, { PublicLegalCard } from '../components/marketing/PublicPageLayout';

const PrivacyPolicy = () => {
  return (
    <PublicPageLayout>
      <PublicLegalCard>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-6">Last updated: July 22, 2026</p>

        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
            <p>
              SocialHub (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), operated by BrickLabs AI, is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard
              your information when you use our application at{' '}
              <a href="https://socialhub.bricklabsai.com" className="text-[#168eea] hover:underline">
                socialhub.bricklabsai.com
              </a>
              .
            </p>
            <p className="mt-2">
              By using SocialHub, you agree to the collection and use of information in accordance with
              this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account Information:</strong> Email address, name, and password when you register.</li>
              <li>
                <strong>Social Media Tokens:</strong> OAuth access tokens for connected platforms
                (Facebook, Instagram, X/Twitter, LinkedIn, YouTube, TikTok, Threads, WhatsApp, Bluesky).
              </li>
              <li><strong>Content:</strong> Posts, images, videos, and comments you publish through our platform.</li>
              <li>
                <strong>Studio / AI Processing:</strong> Videos and audio you upload for transcription and
                content repurposing are processed using our AI services to generate captions and clip
                suggestions. We do not sell this content to third parties.
              </li>
              <li><strong>Analytics Data:</strong> Engagement metrics from your social media posts.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our application.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To provide and maintain our service.</li>
              <li>To publish content to your connected social media platforms.</li>
              <li>To transcribe and repurpose media in Studio (with your explicit upload).</li>
              <li>To analyze engagement and provide analytics.</li>
              <li>To improve our AI assistant and Studio features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Third-Party Services</h2>
            <p>
              We integrate with social media platforms and service providers including Meta, Google,
              LinkedIn, X, TikTok, and OpenAI. Each platform has its own privacy policy governing how
              they handle your data. We only access data you authorize through OAuth consent screens.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted connections (HTTPS),
              secure token storage, and access controls. OAuth tokens are stored securely and never
              shared with unauthorized parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
            <p>
              You may request access, correction, or deletion of your personal data by contacting us.
              You can disconnect social accounts and delete your content at any time from Settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact Us</h2>
            <p>
              For privacy questions:{' '}
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

export default PrivacyPolicy;

import React from 'react';
import Layout from '../components/Layout';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: June 19, 2026</p>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
              <p>
                SocialHub ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our application.
              </p>
              <p className="mt-2">
                By using SocialHub, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Information We Collect</h2>
              <p className="font-medium text-gray-700">We collect the following types of information:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li><strong>Account Information:</strong> Email address, name, and password when you register.</li>
                <li><strong>Social Media Tokens:</strong> OAuth access tokens for connected social media platforms (Facebook, Instagram, Twitter, LinkedIn, YouTube, WhatsApp).</li>
                <li><strong>Content:</strong> Posts, images, videos, and comments you publish through our platform.</li>
                <li><strong>Analytics Data:</strong> Engagement metrics from your social media posts.</li>
                <li><strong>Usage Data:</strong> Information about how you interact with our application.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>To provide and maintain our service.</li>
                <li>To publish content to your connected social media platforms.</li>
                <li>To analyze engagement and provide analytics.</li>
                <li>To improve and optimize our application.</li>
                <li>To authenticate your identity and secure your account.</li>
                <li>To communicate with you about updates and support.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Sharing and Third Parties</h2>
              <p>
                We do not sell, trade, or rent your personal information to third parties. Your data is used solely to provide the services you request.
              </p>
              <p className="mt-2">
                We use third-party services to enhance our platform, including Cloudinary for media storage, Redis for caching, and PostgreSQL for data storage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>All passwords are hashed using bcrypt.</li>
                <li>API keys are generated and stored securely.</li>
                <li>All communications are encrypted using HTTPS.</li>
                <li>OAuth tokens are stored in a secure database.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Access the personal information we hold about you.</li>
                <li>Request corrections to your personal information.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Withdraw consent for data processing at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we will securely delete your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Cookies</h2>
              <p>
                We use cookies and similar technologies to maintain your session, remember your preferences, and improve your experience. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> support@socialhub.com
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-400">
            © 2026 SocialHub. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
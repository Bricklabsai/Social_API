import React from 'react';
import Layout from '../components/Layout';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Service</h1>
          <p className="text-gray-500 text-sm mb-6">Last updated: June 19, 2026</p>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p>
                By using SocialHub ("we", "our", "us"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Description of Service</h2>
              <p>
                SocialHub is a unified social media management platform that allows users to publish content, manage comments, view analytics, and connect multiple social media accounts from a single interface.
              </p>
              <p className="mt-2">Supported platforms include:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Facebook</li>
                <li>Instagram</li>
                <li>Twitter/X</li>
                <li>LinkedIn</li>
                <li>YouTube</li>
                <li>WhatsApp</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. User Accounts</h2>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>You must be at least 13 years old to use our service.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You are solely responsible for all activities that occur under your account.</li>
                <li>You agree to provide accurate and complete information when creating your account.</li>
                <li>You must not share your account credentials with others.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. User Content</h2>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>You retain ownership of all content you publish through SocialHub.</li>
                <li>You grant SocialHub a license to process and transmit your content to connected social media platforms.</li>
                <li>You are solely responsible for the content you publish.</li>
                <li>You must not publish illegal, harmful, or inappropriate content.</li>
                <li>You must respect copyright and intellectual property rights.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Acceptable Use Policy</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Use our service for any illegal purposes.</li>
                <li>Harass, abuse, or harm others.</li>
                <li>Impersonate any person or entity.</li>
                <li>Post spam or misleading content.</li>
                <li>Attempt to gain unauthorized access to our systems.</li>
                <li>Interfere with or disrupt our service.</li>
                <li>Use our service to distribute malware or viruses.</li>
                <li>Violate any platform's terms of service when posting content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Third-Party Services</h2>
              <p>
                SocialHub integrates with third-party services (social media platforms, Cloudinary, Redis, PostgreSQL). We are not responsible for the privacy practices or content of these third-party services.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>You must comply with the terms of service of each connected platform.</li>
                <li>We do not control the content or policies of third-party platforms.</li>
                <li>Your use of third-party services is at your own risk.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. API Keys and Rate Limits</h2>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>API keys are provided for accessing our services programmatically.</li>
                <li>You are responsible for securing your API keys.</li>
                <li>We reserve the right to implement rate limits to ensure fair usage.</li>
                <li>Excessive or abusive API usage may result in key suspension.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Disclaimer of Warranties</h2>
              <p>
                Our service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that our service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, SocialHub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our service.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>We are not responsible for content posted to third-party platforms.</li>
                <li>We are not liable for any losses or damages resulting from your use of third-party services.</li>
                <li>We are not responsible for the actions of third-party platforms.</li>
                <li>Your use of our service is at your own risk.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Termination</h2>
              <p>
                We reserve the right to suspend or terminate your account at any time for violations of these Terms of Service. You may also delete your account at any time through your settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">11. Changes to Terms</h2>
              <p>
                We may update these Terms of Service from time to time. We will notify you of any changes by posting the new terms on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">12. Contact Us</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
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

export default TermsOfService;
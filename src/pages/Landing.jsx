import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiBarChart2,
  FiZap,
  FiMessageCircle,
  FiCheck,
  FiArrowRight,
  FiLayers,
  FiClock,
  FiFilm,
} from 'react-icons/fi';
import PublicNavbar from '../components/marketing/PublicNavbar';
import PublicFooter from '../components/marketing/PublicFooter';
import { getPlatformIcon } from '../constants/platforms';

const features = [
  {
    icon: FiLayers,
    title: 'Publish everywhere',
    desc: 'Create once and share to Facebook, Instagram, X, LinkedIn, YouTube, and WhatsApp from one place.',
  },
  {
    icon: FiCalendar,
    title: 'Schedule ahead',
    desc: 'Plan your content calendar and queue posts for the perfect time — just like Buffer.',
  },
  {
    icon: FiZap,
    title: 'AI writing assistant',
    desc: 'Get caption ideas, hashtag suggestions, and tone improvements powered by AI.',
  },
  {
    icon: FiFilm,
    title: 'Studio repurposing',
    desc: 'Upload a podcast or long video — AI creates Reels, Shorts, TikTok clips, and LinkedIn posts.',
  },
  {
    icon: FiBarChart2,
    title: 'Analytics dashboard',
    desc: 'Track reach, engagement, and performance across all your connected channels.',
  },
  {
    icon: FiMessageCircle,
    title: 'Unified inbox',
    desc: 'Reply to messages and comments from every platform without switching tabs.',
  },
  {
    icon: FiClock,
    title: 'Live previews',
    desc: 'See exactly how your post will look on each platform before you hit publish.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for getting started',
    features: ['3 social channels', '10 scheduled posts', 'Basic analytics', 'AI assistant (10/mo)'],
    cta: 'Start free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/month',
    desc: 'For creators and small teams',
    features: [
      'Unlimited channels',
      'Unlimited scheduling',
      'Advanced analytics',
      'Unlimited AI assistant',
      'Priority support',
    ],
    cta: 'Start 14-day trial',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '$49',
    period: '/month',
    desc: 'For agencies and growing brands',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Approval workflows',
      'Custom reporting',
      'Dedicated support',
    ],
    cta: 'Contact sales',
    highlighted: false,
  },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 bg-gradient-to-b from-[#f0f7ff] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#168eea] font-medium text-sm mb-4 tracking-wide uppercase">
            Social media management, simplified
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Grow your audience on{' '}
            <span className="text-[#168eea]">every platform</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Plan, schedule, and publish content across all your social channels. Preview posts
            live, track analytics, and manage conversations — all from one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#168eea] hover:bg-[#1378d4] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#168eea]/20"
            >
              Get started for free
              <FiArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-8 py-3.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Log in
            </button>
          </div>

          {/* Platform icons */}
          <div className="flex items-center justify-center gap-4 mt-14 flex-wrap">
            {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'].map((p) => (
              <div
                key={p}
                className="w-11 h-11 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center"
              >
                {getPlatformIcon(p, 20)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product preview mock */}
      <section className="py-16 px-4 sm:px-6 bg-[#f8f9fb]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400">publish.socialhub.app</span>
            </div>
            <div className="flex min-h-[320px]">
              <div className="w-48 bg-white border-r border-gray-100 p-4 hidden sm:block">
                <div className="w-full h-9 bg-[#168eea] rounded-lg mb-4" />
                {['Publishing', 'Schedule', 'Posts', 'Analytics'].map((item, i) => (
                  <div
                    key={item}
                    className={`px-3 py-2 rounded-lg text-xs mb-1 ${
                      i === 0 ? 'bg-[#168eea]/10 text-[#168eea] font-medium' : 'text-gray-500'
                    }`}
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
                    <div className="h-24 bg-gray-50 rounded-lg border border-gray-100 mb-3" />
                    <div className="flex gap-2">
                      <div className="h-8 w-20 bg-[#168eea]/20 rounded-full" />
                      <div className="h-8 w-20 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                  <div className="w-40 bg-[#f8f9fb] rounded-lg p-3 hidden md:block">
                    <div className="text-[10px] text-gray-400 mb-2 uppercase">Preview</div>
                    <div className="bg-white rounded border border-gray-100 p-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full mb-2" />
                      <div className="h-2 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-2 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to grow</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built for creators, marketers, and teams who want Buffer-level simplicity with
              unified multi-platform publishing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-xl border border-gray-100 p-6 hover:border-[#168eea]/20 hover:shadow-md transition-all"
                >
                  <div className="w-11 h-11 bg-[#168eea]/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="text-[#168eea]" size={22} />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-gray-500">Start free. Upgrade when you're ready to scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 ${
                  plan.highlighted
                    ? 'bg-[#168eea] text-white shadow-xl shadow-[#168eea]/25 scale-[1.02]'
                    : 'bg-white border border-gray-100'
                }`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                    Most popular
                  </span>
                )}
                <h3 className={`text-xl font-bold mt-1 ${plan.highlighted ? '' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
                  {plan.desc}
                </p>
                <div className="mt-4 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? '' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlighted ? 'text-white/70' : 'text-gray-400'}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <FiCheck
                        size={16}
                        className={plan.highlighted ? 'text-white' : 'text-[#168eea]'}
                      />
                      <span className={plan.highlighted ? 'text-white/90' : 'text-gray-600'}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    plan.highlighted
                      ? 'bg-white text-[#168eea] hover:bg-gray-50'
                      : 'bg-[#168eea] text-white hover:bg-[#1378d4]'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to simplify your social media?</h2>
          <p className="text-gray-500 mb-8">
            Join thousands of creators using SocialHub to publish smarter, not harder.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3.5 bg-[#168eea] hover:bg-[#1378d4] text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2"
          >
            Create your free account
            <FiArrowRight size={18} />
          </button>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Landing;

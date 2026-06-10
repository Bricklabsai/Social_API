import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiLogOut, FiUser, FiGrid, FiBookOpen, FiBarChart2, FiSettings, 
  FiMessageSquare, FiCalendar, FiUsers, FiShield, FiHelpCircle,
  FiMail, FiHash, FiImage, FiLink, FiClock, FiStar, FiTrendingUp,
  FiFolder, FiFilter, FiDownload, FiFile, FiDollarSign, FiKey
} from 'react-icons/fi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Main navigation items (always visible)
  const mainNavItems = [
    { path: '/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/posts', icon: FiBookOpen, label: 'My Posts' },
    { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/scheduled', icon: FiCalendar, label: 'Scheduled Posts', comingSoon: true },
    { path: '/comments', icon: FiMessageSquare, label: 'Comments', comingSoon: true },
  ];

  // Content management items (future)
  const contentNavItems = [
    { path: '/media-library', icon: FiImage, label: 'Media Library', comingSoon: true },
    { path: '/templates', icon: FiFile, label: 'Post Templates', comingSoon: true },
    { path: '/hashtags', icon: FiHash, label: 'Hashtag Manager', comingSoon: true },
    { path: '/links', icon: FiLink, label: 'Link Shortener', comingSoon: true },
  ];

  // Engagement & Community (future)
  const engagementNavItems = [
    { path: '/mentions', icon: FiUsers, label: 'Mentions', comingSoon: true },
    { path: '/messages', icon: FiMail, label: 'Messages', comingSoon: true },
    { path: '/reviews', icon: FiStar, label: 'Reviews', comingSoon: true },
    { path: '/trends', icon: FiTrendingUp, label: 'Trends', comingSoon: true },
  ];

  // Automation & Scheduling (future)
  const automationNavItems = [
    { path: '/auto-publish', icon: FiClock, label: 'Auto-Publish', comingSoon: true },
    { path: '/rss-feeds', icon: FiFolder, label: 'RSS Feeds', comingSoon: true },
    { path: '/workflows', icon: FiFilter, label: 'Workflows', comingSoon: true },
  ];

  // Settings & Account (future)
  const settingsNavItems = [
    { path: '/profile', icon: FiUser, label: 'Profile', comingSoon: true },
    { path: '/team', icon: FiUsers, label: 'Team Members', comingSoon: true },
    { path: '/billing', icon: FiDollarSign, label: 'Billing', comingSoon: true },
    { path: '/api-keys', icon: FiKey, label: 'API Keys', comingSoon: true },
    { path: '/webhooks', icon: FiLink, label: 'Webhooks', comingSoon: true },
    { path: '/security', icon: FiShield, label: 'Security', comingSoon: true },
    { path: '/export', icon: FiDownload, label: 'Export Data', comingSoon: true },
    { path: '/settings', icon: FiSettings, label: 'Settings', comingSoon: true },
  ];

  const renderNavSection = (title, items) => (
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
        {title}
      </h3>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.comingSoon ? '#' : item.path}
              onClick={(e) => item.comingSoon && e.preventDefault()}
              className={`flex items-center justify-between group px-4 py-2 rounded-lg transition-all ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              } ${item.comingSoon ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.comingSoon && (
                <span className="text-xs px-2 py-0.5 bg-gray-700 rounded-full text-gray-400">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-gray-900 border-r border-gray-700 flex flex-col">
        {/* Logo Section - Fixed at top */}
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">UnifiedSocial</h1>
              <p className="text-gray-500 text-xs">Multi-Platform API</p>
            </div>
          </div>
        </div>
        
        {/* Navigation - Scrollable area */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderNavSection('MAIN', mainNavItems)}
          {renderNavSection('CONTENT', contentNavItems)}
          {renderNavSection('ENGAGEMENT', engagementNavItems)}
          {renderNavSection('AUTOMATION', automationNavItems)}
          {renderNavSection('SETTINGS', settingsNavItems)}
        </div>
        
        {/* User Section - Fixed at bottom */}
        <div className="p-4 border-t border-gray-700 bg-gray-900 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <FiUser size={20} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">
                {user?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-gray-400 text-xs truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <Link
              to="/help"
              className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-sm"
              onClick={(e) => e.preventDefault()}
            >
              <FiHelpCircle size={16} />
              <span>Help & Support</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all w-full text-sm"
            >
              <FiLogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-800">
            <p className="text-gray-600 text-xs text-center">Version 1.0.0</p>
            <p className="text-gray-700 text-xs text-center">© 2026 UnifiedSocial</p>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="ml-72 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
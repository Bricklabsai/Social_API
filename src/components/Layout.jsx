import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiLogOut, FiUser, FiGrid, FiBookOpen, FiBarChart2, FiSettings, 
  FiMessageSquare, FiCalendar, FiUsers, FiShield, FiHelpCircle,
  FiMail, FiHash, FiImage, FiLink, FiClock, FiStar, FiTrendingUp,
  FiFolder, FiFilter, FiDownload, FiFile, FiDollarSign, FiKey,
  FiChevronDown, FiChevronRight, FiActivity, FiLock, FiBell, FiServer,
  FiCode, FiDatabase, FiHexagon
} from 'react-icons/fi';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState({
    main: true,
    content: false,
    engagement: false,
    development: false,
    system: false,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Navigation sections - redesigned without "Soon" badges for cleaner look
  const sections = [
    {
      id: 'main',
      title: 'MAIN',
      icon: FiGrid,
      items: [
        { path: '/dashboard', icon: FiGrid, label: 'Dashboard' },
        { path: '/posts', icon: FiBookOpen, label: 'Posts' },
        { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
        { path: '/inbox', icon: FiMail, label: 'Inbox', comingSoon: true },
      ]
    },
    {
      id: 'content',
      title: 'CONTENT',
      icon: FiImage,
      items: [
        { path: '/media', icon: FiImage, label: 'Media Library', comingSoon: true },
        { path: '/templates', icon: FiFile, label: 'Templates', comingSoon: true },
        { path: '/hashtags', icon: FiHash, label: 'Hashtags', comingSoon: true },
        { path: '/links', icon: FiLink, label: 'Link Shortener', comingSoon: true },
      ]
    },
    {
      id: 'engagement',
      title: 'ENGAGEMENT',
      icon: FiUsers,
      items: [
        { path: '/comments', icon: FiMessageSquare, label: 'Comments', comingSoon: true },
        { path: '/mentions', icon: FiBell, label: 'Mentions', comingSoon: true },
        { path: '/messages', icon: FiMail, label: 'Messages', comingSoon: true },
        { path: '/reviews', icon: FiStar, label: 'Reviews', comingSoon: true },
      ]
    },
    {
      id: 'development',
      title: 'DEVELOPMENT',
      icon: FiCode,
      items: [
        { path: '/api-keys', icon: FiKey, label: 'API Keys', comingSoon: true },
        { path: '/webhooks', icon: FiLink, label: 'Webhooks', comingSoon: true },
        { path: '/logs', icon: FiDatabase, label: 'Logs', comingSoon: true },
        { path: '/users', icon: FiUsers, label: 'Users', comingSoon: true },
      ]
    },
    {
      id: 'system',
      title: 'SYSTEM',
      icon: FiSettings,
      items: [
        { path: '/settings', icon: FiSettings, label: 'Settings' },
        { path: '/security', icon: FiLock, label: 'Security', comingSoon: true },
        { path: '/billing', icon: FiDollarSign, label: 'Billing', comingSoon: true },
        { path: '/export', icon: FiDownload, label: 'Export', comingSoon: true },
      ]
    }
  ];

  const renderNavSection = (section) => {
    const isOpen = openSections[section.id];
    const SectionIcon = section.icon;
    
    return (
      <div className="mb-1">
        {/* Section Header */}
        <button
          onClick={() => toggleSection(section.id)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          <div className="flex items-center gap-3">
            <SectionIcon size={18} />
            <span className="text-sm font-medium">{section.title}</span>
          </div>
          {isOpen ? (
            <FiChevronDown size={16} />
          ) : (
            <FiChevronRight size={16} />
          )}
        </button>
        
        {/* Section Items */}
        {isOpen && (
          <div className="ml-6 mt-1 space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.comingSoon ? '#' : item.path}
                  onClick={(e) => item.comingSoon && e.preventDefault()}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  } ${item.comingSoon ? 'opacity-50' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Get user display name
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'user@example.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Sidebar - Unified without separation */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo - Compact */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-white font-semibold text-sm">UnifiedSocial</span>
          </div>
        </div>
        
        {/* User Profile - Integrated at top of navigation */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center ring-2 ring-gray-700">
              <FiUser size={18} className="text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{displayName}</p>
              <p className="text-gray-500 text-xs truncate">{userEmail}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation - Single scrollable area (minimal) */}
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {sections.map(section => renderNavSection(section))}
        </div>
        
        {/* Logout - Integrated at bottom of navigation */}
        <div className="px-3 py-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all text-sm"
          >
            <FiLogOut size={18} />
            <span>Logout</span>
          </button>
          <div className="mt-2 text-center">
            <p className="text-gray-600 text-xs">v1.0.0</p>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
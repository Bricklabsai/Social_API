import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiLogOut,
  FiUser,
  FiGrid,
  FiBookOpen,
  FiBarChart2,
  FiMessageSquare,
  FiSettings,
  FiPlus,
  FiMessageCircle,
  FiCalendar,
  FiLayers,
} from 'react-icons/fi';
import { PLATFORM_IDS, getPlatformIcon } from '../constants/platforms';
import { platforms } from '../services/api';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [platformConnections, setPlatformConnections] = useState({});
  const [profileImageUrl, setProfileImageUrl] = useState(user?.avatar_url || null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const loadConnections = async () => {
      try {
        const response = await platforms.getConnections();
        const mapped = {};
        (response.data?.platforms || []).forEach((p) => {
          mapped[p.platform] = p;
        });
        setPlatformConnections(mapped);
        if (response.data?.profile_image_url) {
          setProfileImageUrl(response.data.profile_image_url);
        }
      } catch {
        // Non-blocking for layout rendering.
      }
    };
    loadConnections();
  }, []);

  const navItems = [
    { path: '/dashboard', icon: FiGrid, label: 'Publishing' },
    { path: '/create', icon: FiLayers, label: 'Create' },
    { path: '/schedule', icon: FiCalendar, label: 'Schedule' },
    { path: '/posts', icon: FiBookOpen, label: 'Posts' },
    { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/messages', icon: FiMessageCircle, label: 'Messages' },
    { path: '/comments', icon: FiMessageSquare, label: 'Comments' },
    { path: '/settings', icon: FiSettings, label: 'Settings' },
  ];

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'user@example.com';

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200/80 flex flex-col transition-all duration-200 z-50 ${
          isCollapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {/* Logo */}
        <div className="px-4 h-14 flex items-center border-b border-gray-100">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 bg-[#168eea] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">SH</span>
            </div>
            {!isCollapsed && (
              <span className="text-gray-900 font-semibold text-sm whitespace-nowrap">
                SocialHub
              </span>
            )}
          </div>
        </div>

        {/* New Post CTA */}
        <div className="px-3 py-3">
          <button
            onClick={() => navigate('/dashboard?compose=true')}
            className={`w-full flex items-center gap-2 bg-[#168eea] hover:bg-[#1378d4] text-white font-medium rounded-lg transition-colors ${
              isCollapsed ? 'justify-center p-2.5' : 'px-4 py-2.5 text-sm'
            }`}
            title="New Post"
          >
            <FiPlus size={18} />
            {!isCollapsed && <span>New Post</span>}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-1">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                    active
                      ? 'bg-[#168eea]/10 text-[#168eea] font-medium'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={18} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {!isCollapsed && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 px-3 font-semibold">
                Channels
              </p>
              <div className="space-y-0.5">
                {PLATFORM_IDS.slice(0, 4).map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-500"
                  >
                    {platformConnections[platform]?.accounts?.[0]?.avatar_url ? (
                      <img
                        src={platformConnections[platform].accounts[0].avatar_url}
                        alt={platform}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      getPlatformIcon(platform, 14)
                    )}
                    <span className="capitalize">{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-gray-100">
          <div className={`px-3 py-3 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 mb-2 px-1">
                <div className="w-8 h-8 bg-[#168eea]/10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <FiUser size={16} className="text-[#168eea]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-medium text-xs truncate">{displayName}</p>
                  <p className="text-gray-400 text-[10px] truncate">{userEmail}</p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-[#168eea]/10 rounded-full flex items-center justify-center overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiUser size={16} className="text-[#168eea]" />
                )}
              </div>
            )}

            <button
              onClick={handleLogout}
              className={`flex items-center gap-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm w-full ${
                isCollapsed ? 'justify-center p-2' : 'px-3 py-2'
              }`}
              title="Logout"
            >
              <FiLogOut size={16} />
              {!isCollapsed && <span className="text-xs">Logout</span>}
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full py-2 border-t border-gray-100 text-gray-400 hover:text-gray-600 text-xs transition-colors"
          >
            {isCollapsed ? '→' : '← Collapse'}
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 transition-all duration-200 min-h-screen ${
          isCollapsed ? 'ml-[68px]' : 'ml-60'
        }`}
      >
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

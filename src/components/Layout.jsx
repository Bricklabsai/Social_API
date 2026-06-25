import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiLogOut, FiUser, FiGrid, FiBookOpen, FiBarChart2, 
  FiMessageSquare, FiSettings, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaWhatsapp } from 'react-icons/fa';
import { FiMessageCircle } from 'react-icons/fi';


const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Navigation items
  const navItems = [
    { path: '/dashboard', icon: FiGrid, label: 'Dashboard' },
    { path: '/posts', icon: FiBookOpen, label: 'Posts' },
    { path: '/analytics', icon: FiBarChart2, label: 'Analytics' },
    { path: '/messages', icon: FiMessageCircle, label: 'Messages' }, 
    { path: '/comments', icon: FiMessageSquare, label: 'Comments' },
    { path: '/settings', icon: FiSettings, label: 'Settings' }, 
    
  ];

  const platformIcons = {
    facebook: <FaFacebook className="text-blue-600" size={16} />,
    instagram: <FaInstagram className="text-pink-500" size={16} />,
    twitter: <FaTwitter className="text-sky-400" size={16} />,
    linkedin: <FaLinkedin className="text-blue-700" size={16} />,
    youtube: <FaYoutube className="text-red-600" size={16} />,
    whatsapp: <FaWhatsapp className="text-green-500" size={16} />,
  };

  const connectedPlatforms = ['facebook', 'instagram', 'linkedin', 'youtube',];

  // Get user display name
  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'user@example.com';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 shadow-sm flex flex-col transition-all duration-300 z-50 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo - SocialHub */}
        <div className={`px-4 py-4 border-b border-gray-100 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 via-pink-300 to-blue-300 rounded-lg flex items-center justify-center shadow-sm shadow-pink-200/50">
                <span className="text-white font-bold text-sm">SH</span>
              </div>
              <span className="text-gray-800 font-semibold text-sm">SocialHub</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 via-pink-300 to-blue-300 rounded-lg flex items-center justify-center shadow-sm shadow-pink-200/50">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
          )}
        </div>
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-pink-500 hover:border-pink-300 transition-all shadow-sm"
        >
          {isCollapsed ? <FiChevronRight size={12} /> : <FiChevronLeft size={12} />}
        </button>
        
        {/* User Profile */}
        <div className={`px-4 py-3 border-b border-gray-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full flex items-center justify-center ring-2 ring-pink-200/50">
                <FiUser size={18} className="text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm truncate">{displayName}</p>
                <p className="text-gray-400 text-xs truncate">{userEmail}</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full flex items-center justify-center ring-2 ring-pink-200/50">
              <FiUser size={18} className="text-pink-500" />
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                    active
                      ? 'bg-gradient-to-r from-pink-50 to-blue-50 text-pink-600 shadow-sm shadow-pink-100/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon size={20} className={active ? 'text-pink-500' : ''} />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Connected Platforms Section */}
          {!isCollapsed && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 px-3">Supported platforms</p>
              <div className="space-y-1">
                {connectedPlatforms.map((platform) => (
                  <div key={platform} className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-gray-500">
                    {platformIcons[platform]}
                    <span className="capitalize text-xs">{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </nav>
        
        {/* Logout */}
        <div className={`px-3 py-3 border-t border-gray-100 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all text-sm w-full ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <FiLogOut size={20} />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'} min-h-screen bg-white`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
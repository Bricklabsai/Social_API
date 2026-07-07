import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { platforms, posts } from '../services/api';
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaInstagram, FaWhatsapp,
  FaCheckCircle, FaSpinner, FaPlug, FaUnlink, FaUpload, FaInfoCircle,
  FaChartLine
} from 'react-icons/fa';
import { FiSend, FiImage, FiVideo, FiFile, FiType } from 'react-icons/fi';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://unified-social-api.onrender.com/api/v1';

const platformIcons = {
  facebook: <FaFacebook className="text-blue-600" size={24} />,
  instagram: <FaInstagram className="text-pink-600" size={24} />,
  twitter: <FaTwitter className="text-sky-500" size={24} />,
  linkedin: <FaLinkedin className="text-blue-700" size={24} />,
  youtube: <FaYoutube className="text-red-600" size={24} />,
  whatsapp: <FaWhatsapp className="text-green-500" size={24} />,
};

const platformDisplayNames = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
};

const Dashboard = () => {
  const location = useLocation();
  const [platformConnections, setPlatformConnections] = useState({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await platforms.getConnections();
      
      const connectionsObj = {};
      
      if (response.data && response.data.platforms) {
        response.data.platforms.forEach(p => {
          connectionsObj[p.platform] = p;
        });
      } else if (response.data && typeof response.data === 'object') {
        Object.keys(response.data).forEach(platform => {
          connectionsObj[platform] = response.data[platform];
        });
      }
      
      setPlatformConnections(connectionsObj);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      toast.error('Failed to load platform connections');
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback from URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const platform = params.get('platform');
    const status = params.get('status');
    const message = params.get('message');

    if (platform && status) {
      window.history.replaceState({}, '', window.location.pathname);

      if (status === 'success') {
        toast.success(`Successfully connected to ${capitalizeFirstLetter(platform)}!`);
        fetchConnections();
      } else {
        const errorMsg = message ? decodeURIComponent(message) : 'Unknown error';
        toast.error(`Failed to connect ${capitalizeFirstLetter(platform)}: ${errorMsg}`);
      }
    }
  }, [location.search]);

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleConnect = async (platform) => {
    setActionInProgress(platform);
    try {
      const userStr = localStorage.getItem('user');
      let userId = 1;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.id;
        } catch (e) {}
      }
      
      window.location.href = `${API_BASE_URL}/auth/${platform}/connect?user_id=${userId}`;
      
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect ${platformDisplayNames[platform] || platform}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platformDisplayNames[platform] || platform}?`)) {
      return;
    }
    
    setActionInProgress(platform);
    try {
      await platforms.disconnect(platform);
      toast.success(`Successfully disconnected from ${platformDisplayNames[platform] || platform}`);
      await fetchConnections();
      setSelectedPlatforms(prev => prev.filter(p => p !== platform));
      setSelectedFile(null);
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error(error.response?.data?.detail || `Failed to disconnect ${platformDisplayNames[platform] || platform}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePlatformToggle = (platform) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
    setSelectedFile(null);
  };

  // ... (keep all your existing handlers: handleFileSelect, handleTextPublish, handleFileUpload)

  const hasAnyConnection = Object.values(platformConnections).some(p => p?.connected);
  const connectedCount = Object.values(platformConnections).filter(p => p?.connected).length;
  const totalPlatforms = 6;

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">Manage your social media presence from one place</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Connected Platforms</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">
                {loading ? '...' : `${connectedCount}/${totalPlatforms}`}
              </p>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Social Platforms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))
            ) : (
              ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'].map((platform) => {
                const connection = platformConnections[platform];
                const isConnected = connection?.connected;
                const isInProgress = actionInProgress === platform;
                const displayName = platformDisplayNames[platform];
                
                return (
                  <div
                    key={platform}
                    className={`bg-white rounded-xl p-3 md:p-4 transition-all duration-300 border flex items-center gap-3 ${
                      isConnected 
                        ? 'border-pink-300 shadow-md shadow-pink-200/50' 
                        : 'border-gray-100 hover:shadow-md hover:shadow-gray-100/50'
                    }`}
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isConnected ? 'bg-pink-50' : 'bg-gray-50'
                    }`}>
                      {platformIcons[platform]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm md:text-base truncate ${isConnected ? 'text-gray-800' : 'text-gray-500'}`}>
                        {displayName}
                      </p>
                      {isConnected ? (
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                          <span className="flex items-center gap-1 text-pink-600 text-xs whitespace-nowrap">
                            <FaCheckCircle size={10} />
                            Connected
                          </span>
                          <button
                            onClick={() => handleDisconnect(platform)}
                            disabled={isInProgress}
                            className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {isInProgress ? <FaSpinner className="animate-spin inline" size={10} /> : 'Disconnect'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleConnect(platform)}
                          disabled={isInProgress}
                          className="mt-1 text-xs text-pink-600 hover:text-pink-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {isInProgress ? <FaSpinner className="animate-spin" size={10} /> : <FaPlug size={10} />}
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Publish Card - keep your existing code */}
        {!loading && hasAnyConnection && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6 mb-6 md:mb-8">
            {/* ... your existing publish card content ... */}
          </div>
        )}

        {/* No Connections Message */}
        {!loading && !hasAnyConnection && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
            <div className="text-gray-200 mb-3">
              <FaPlug size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Platforms Connected</h3>
            <p className="text-gray-400 mb-4">Connect your social media accounts to start posting</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
              <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">
                {connectedCount}
              </p>
              <p className="text-xs md:text-sm text-gray-500">Connected Platforms</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
              <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">—</p>
              <p className="text-xs md:text-sm text-gray-500">Posts Today</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
              <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">—</p>
              <p className="text-xs md:text-sm text-gray-500">Total Reach</p>
            </div>
            <div className="text-center p-3 md:p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
              <p className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">—</p>
              <p className="text-xs md:text-sm text-gray-500">Engagement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

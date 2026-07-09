import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { platforms } from '../services/api';
import PostComposerModal from '../components/post/PostComposerModal';
import {
  FaCheckCircle,
  FaSpinner,
  FaPlug,
} from 'react-icons/fa';
import { FiPlus, FiCalendar, FiBarChart2, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  PLATFORM_IDS,
  PLATFORM_DISPLAY_NAMES,
  getPlatformIcon,
} from '../constants/platforms';
import { getScheduledPosts } from '../utils/scheduledPosts';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://unified-social-api.onrender.com/api/v1';

const PlatformCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse flex items-center gap-3">
    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
      <div className="h-7 bg-gray-200 rounded w-full" />
    </div>
  </div>
);

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [platformConnections, setPlatformConnections] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    fetchConnections();
    setScheduledCount(getScheduledPosts().length);
  }, []);

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

    if (params.get('compose') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      setShowComposer(true);
    }
  }, [location.search]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await platforms.getConnections();
      const connectionsObj = {};

      if (response.data?.platforms) {
        response.data.platforms.forEach((p) => {
          connectionsObj[p.platform] = p;
        });
      } else if (response.data && typeof response.data === 'object') {
        Object.keys(response.data).forEach((platform) => {
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

  const handleConnect = async (platform) => {
    setActionInProgress(platform);
    try {
      const userStr = localStorage.getItem('user');
      let userId = 1;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.id;
        } catch {
          /* use default */
        }
      }
      window.location.href = `${API_BASE_URL}/auth/${platform}/connect?user_id=${userId}`;
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect ${PLATFORM_DISPLAY_NAMES[platform] || platform}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDisconnect = async (platform) => {
    if (
      !window.confirm(
        `Disconnect ${PLATFORM_DISPLAY_NAMES[platform] || platform}? This removes your access token.`
      )
    ) {
      return;
    }

    setActionInProgress(platform);
    try {
      await platforms.disconnect(platform);
      toast.success(`Disconnected from ${PLATFORM_DISPLAY_NAMES[platform] || platform}`);
      await fetchConnections();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          `Failed to disconnect ${PLATFORM_DISPLAY_NAMES[platform] || platform}`
      );
    } finally {
      setActionInProgress(null);
    }
  };

  const hasAnyConnection = Object.values(platformConnections).some((p) => p?.connected);
  const connectedCount = Object.values(platformConnections).filter((p) => p?.connected).length;
  const connectedList = PLATFORM_IDS.filter((p) => platformConnections[p]?.connected);

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto">
        {/* Buffer-style header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Publishing</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Manage and schedule content across your social channels
            </p>
          </div>
          {hasAnyConnection && (
            <button
              onClick={() => setShowComposer(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              <FiPlus size={18} />
              New Post
            </button>
          )}
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => hasAnyConnection && setShowComposer(true)}
            disabled={!hasAnyConnection}
            className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:border-[#168eea]/30 hover:shadow-sm transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-[#168eea]/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#168eea]/20 transition-colors">
              <FiPlus className="text-[#168eea]" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Create a post</h3>
            <p className="text-xs text-gray-500 mt-1">Compose and publish to multiple channels</p>
          </button>

          <button
            onClick={() => navigate('/schedule')}
            className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:border-[#168eea]/30 hover:shadow-sm transition-all group w-full"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
              <FiCalendar className="text-amber-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Schedule</h3>
            <p className="text-xs text-gray-500 mt-1">
              {scheduledCount > 0
                ? `${scheduledCount} post${scheduledCount > 1 ? 's' : ''} scheduled`
                : 'Plan your content calendar'}
            </p>
          </button>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
              <FiBarChart2 className="text-emerald-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Analytics</h3>
            <p className="text-xs text-gray-500 mt-1">Track performance across platforms</p>
          </div>
        </div>

        {/* Queue / empty state */}
        {!loading && hasAnyConnection && (
          <div className="bg-white rounded-xl border border-gray-100 mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiZap className="text-[#168eea]" size={18} />
                <h2 className="font-semibold text-gray-900">Your Queue</h2>
              </div>
              <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                {scheduledCount} scheduled
              </span>
            </div>
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-[#168eea]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FiPlus className="text-[#168eea]" size={28} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">Your queue is empty</h3>
              <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                Create your first post and preview how it will look on{' '}
                {connectedList.map((p) => PLATFORM_DISPLAY_NAMES[p]).join(', ')}
              </p>
              <button
                onClick={() => setShowComposer(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white font-semibold rounded-lg transition-colors text-sm"
              >
                <FiPlus size={16} />
                Create Post
              </button>
            </div>
          </div>
        )}

        {/* Channels section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Channels</h2>
            <span className="text-sm text-gray-500">
              {loading ? '...' : `${connectedCount} of ${PLATFORM_IDS.length} connected`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <PlatformCardSkeleton key={i} />)
              : PLATFORM_IDS.map((platform) => {
                  const connection = platformConnections[platform];
                  const isConnected = connection?.connected;
                  const isInProgress = actionInProgress === platform;
                  const displayName = PLATFORM_DISPLAY_NAMES[platform];

                  return (
                    <div
                      key={platform}
                      className={`bg-white rounded-xl p-4 border transition-all flex items-center gap-3 ${
                        isConnected
                          ? 'border-[#168eea]/20 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isConnected ? 'bg-[#168eea]/5' : 'bg-gray-50'
                        }`}
                      >
                        {isConnected && connection?.profile_image_url ? (
                          <img
                            src={connection.profile_image_url}
                            alt={connection?.username || displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          getPlatformIcon(platform, 22)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm ${
                            isConnected ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {displayName}
                        </p>
                        {isConnected ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="flex items-center gap-1 text-emerald-600 text-xs">
                              <FaCheckCircle size={10} />
                              Connected
                            </span>
                            <button
                              onClick={() => handleDisconnect(platform)}
                              disabled={isInProgress}
                              className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              {isInProgress ? (
                                <FaSpinner className="animate-spin inline" size={10} />
                              ) : (
                                'Disconnect'
                              )}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(platform)}
                            disabled={isInProgress}
                            className="mt-0.5 text-xs text-[#168eea] hover:text-[#1378d4] transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {isInProgress ? (
                              <FaSpinner className="animate-spin" size={10} />
                            ) : (
                              <FaPlug size={10} />
                            )}
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* No connections */}
        {!loading && !hasAnyConnection && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FaPlug className="text-gray-300" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Connect your channels</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Link your social accounts above to start creating and scheduling posts with live
              previews ΓÇö just like Buffer.
            </p>
          </div>
        )}
      </div>

      <PostComposerModal
        isOpen={showComposer}
        onClose={() => setShowComposer(false)}
        platformConnections={platformConnections}
        onPublishSuccess={fetchConnections}
      />
    </div>
  );
};

export default Dashboard;

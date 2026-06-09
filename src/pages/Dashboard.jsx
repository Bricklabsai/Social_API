import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { platforms, posts } from '../services/api';
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaInstagram, FaWhatsapp,
  FaCheckCircle, FaSpinner, FaExclamationTriangle, FaPlug, FaUnlink, FaTrash
} from 'react-icons/fa';
import { FiSend, FiImage, FiVideo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const platformIcons = {
  facebook: <FaFacebook className="text-blue-600" size={28} />,
  instagram: <FaInstagram className="text-pink-600" size={28} />,
  twitter: <FaTwitter className="text-sky-500" size={28} />,
  linkedin: <FaLinkedin className="text-blue-700" size={28} />,
  youtube: <FaYoutube className="text-red-600" size={28} />,
  whatsapp: <FaWhatsapp className="text-green-500" size={28} />,
};

const Dashboard = () => {
  const [platformConnections, setPlatformConnections] = useState({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await platforms.getConnections();
      const connectionsObj = {};
      response.data.platforms.forEach(p => {
        connectionsObj[p.platform] = p;
      });
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
        } catch (e) {}
      }
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      // Open OAuth popup
      const authWindow = window.open(
        `http://localhost:8000/api/v1/auth/${platform}/connect?user_id=${userId}`,
        `${platform}_auth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Poll for window close
      const checkInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkInterval);
          fetchConnections();
          toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connection updated`);
        }
      }, 500);
      
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect ${platform}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platform}? This will remove your access token.`)) {
      return;
    }
    
    setActionInProgress(platform);
    try {
      await platforms.disconnect(platform);
      toast.success(`Successfully disconnected from ${platform}`);
      await fetchConnections();
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error(error.response?.data?.detail || `Failed to disconnect ${platform}`);
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
  };

  const handlePublish = async () => {
    if (!postContent.trim()) {
      toast.error('Please enter content to post');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }

    setPublishing(true);
    try {
      const payload = {
        platforms: selectedPlatforms,
        content: postContent,
      };
      if (mediaUrl) {
        payload.media_url = mediaUrl;
        payload.media_type = mediaType;
      }

      const response = await posts.publish(payload);
      const successCount = response.data.successful;
      const totalCount = response.data.total_platforms;
      
      if (successCount === totalCount) {
        toast.success(`✅ Successfully posted to all ${totalCount} platforms!`);
        setPostContent('');
        setMediaUrl('');
        setMediaType('');
        setSelectedPlatforms([]);
      } else if (successCount > 0) {
        toast.warning(`⚠️ Posted to ${successCount}/${totalCount} platforms. Check details for failures.`);
      } else {
        toast.error('❌ Failed to post. Check your platform connections.');
      }
      
      fetchConnections();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const isThreadMode = selectedPlatforms.includes('twitter') && selectedPlatforms.length === 1 && postContent.split('\n').filter(l => l.trim()).length > 1;

  const platformDisplayNames = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-300 mt-1">Manage your social media presence from one place</p>
        </div>

        {/* Platform Cards */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Social Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'].map((platform) => {
              const connection = platformConnections[platform];
              const isConnected = connection?.connected;
              const isInProgress = actionInProgress === platform;
              const displayName = platformDisplayNames[platform];
              
              return (
                <div
                  key={platform}
                  className={`bg-gray-800 rounded-xl p-4 text-center transition-all ${
                    isConnected ? 'ring-2 ring-green-500' : 'ring-1 ring-gray-700'
                  }`}
                >
                  <div className="flex justify-center mb-3">
                    {platformIcons[platform]}
                  </div>
                  <p className="text-white font-medium mb-2">{displayName}</p>
                  
                  {loading ? (
                    <FaSpinner className="animate-spin mx-auto text-gray-400" />
                  ) : isConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1 text-green-400 text-xs">
                        <FaCheckCircle size={12} />
                        <span>Connected</span>
                      </div>
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isInProgress}
                        className="w-full px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-md transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {isInProgress ? (
                          <FaSpinner className="animate-spin" size={10} />
                        ) : (
                          <FaUnlink size={10} />
                        )}
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={isInProgress}
                      className="w-full px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all flex items-center justify-center gap-1 disabled:opacity-50"
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
              );
            })}
          </div>
        </div>

        {/* Publish Card - Only show if any platform is connected */}
        {Object.values(platformConnections).some(p => p?.connected) && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Create Post</h2>
            
            {/* Platform Selection */}
            <div className="mb-4">
              <label className="block text-gray-300 font-medium mb-2">Select Platforms</label>
              <div className="flex flex-wrap gap-3">
                {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'].map((platform) => {
                  const connection = platformConnections[platform];
                  const isConnected = connection?.connected;
                  const isSelected = selectedPlatforms.includes(platform);
                  
                  if (!isConnected) return null;
                  
                  return (
                    <button
                      key={platform}
                      onClick={() => handlePlatformToggle(platform)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {platformIcons[platform]}
                      <span className="capitalize">{platformDisplayNames[platform]}</span>
                    </button>
                  );
                })}
              </div>
              {selectedPlatforms.length === 0 && (
                <p className="text-sm text-yellow-500 mt-2">Please select at least one platform</p>
              )}
            </div>
            
            {/* Content Input */}
            <div className="mb-4">
              <label className="block text-gray-300 font-medium mb-2">
                {isThreadMode ? 'Thread Tweets (one per line)' : 'Content'}
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={isThreadMode ? 6 : 4}
                placeholder={isThreadMode ? 'Tweet 1\nTweet 2\nTweet 3' : "What's on your mind?"}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePublish}
                disabled={publishing || selectedPlatforms.length === 0 || !postContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {publishing ? <FaSpinner className="animate-spin" /> : <FiSend />}
                {isThreadMode ? 'Post Thread' : 'Publish'}
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {Object.values(platformConnections).filter(p => p?.connected).length}
              </p>
              <p className="text-sm text-gray-400">Connected Platforms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">—</p>
              <p className="text-sm text-gray-400">Posts Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">—</p>
              <p className="text-sm text-gray-400">Total Reach</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">—</p>
              <p className="text-sm text-gray-400">Engagement</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
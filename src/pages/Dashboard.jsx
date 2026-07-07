import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // ADDED for OAuth callback handling
import Layout from '../components/Layout';
import { platforms, posts } from '../services/api';
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaInstagram, FaWhatsapp,
  FaCheckCircle, FaSpinner, FaPlug, FaUnlink, FaUpload, FaInfoCircle,
  FaChartLine
} from 'react-icons/fa';
import { FiSend, FiImage, FiVideo, FiFile, FiType } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Get the backend URL from environment or use the Render URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://unified-social-api.onrender.com/api/v1';

const platformIcons = {
  facebook: <FaFacebook className="text-blue-600" size={24} />,
  instagram: <FaInstagram className="text-pink-600" size={24} />,
  twitter: <FaTwitter className="text-sky-500" size={24} />,
  linkedin: <FaLinkedin className="text-blue-700" size={24} />,
  youtube: <FaYoutube className="text-red-600" size={24} />,
  whatsapp: <FaWhatsapp className="text-green-500" size={24} />,
};

const platformColors = {
  facebook: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
  instagram: 'border-pink-200 bg-pink-50 hover:bg-pink-100',
  twitter: 'border-sky-200 bg-sky-50 hover:bg-sky-100',
  linkedin: 'border-blue-200 bg-blue-50 hover:bg-blue-100',
  youtube: 'border-red-200 bg-red-50 hover:bg-red-100',
  whatsapp: 'border-green-200 bg-green-50 hover:bg-green-100',
};

const platformDisplayNames = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'Twitter',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
};

// Skeleton Components
const PlatformCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse flex items-center gap-4">
    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
    <div className="flex-1">
      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-full"></div>
    </div>
  </div>
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="text-center p-4 bg-linear-to-br from-gray-50 to-gray-100 rounded-xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
      </div>
    ))}
  </div>
);

const Dashboard = () => {
  const location = useLocation(); // ADDED for OAuth callback handling
  const [platformConnections, setPlatformConnections] = useState({});
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  // Helper function to capitalize platform names
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // EXISTING useEffect - Fetch connections on mount
  useEffect(() => {
    fetchConnections();
  }, []);

  // NEW useEffect - Handle OAuth callback redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const platform = params.get('platform');
    const status = params.get('status');
    const message = params.get('message');
    
    if (platform && status) {
      if (status === 'success') {
        toast.success(`Successfully connected to ${capitalizeFirstLetter(platform)}!`);
        // Refresh the connections list to show the new connection
        fetchConnections();
      } else {
        const errorMsg = message ? decodeURIComponent(message) : 'Unknown error';
        toast.error(`Failed to connect ${capitalizeFirstLetter(platform)}: ${errorMsg}`);
      }
      
      // Clean the URL - remove the query parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

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
    
    // Open the popup
    const authWindow = window.open(
      `${API_BASE_URL}/auth/${platform}/connect?user_id=${userId}`,
      `${platform}_auth`,
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!authWindow) {
      toast.error('Popup blocked. Please allow popups for this site.');
      return;
    }
    
    // Check if popup closed
    const checkInterval = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkInterval);
        // Refresh connections when popup closes
        fetchConnections();
        toast.success(`${platformDisplayNames[platform] || platform} connection updated`);
      }
    }, 500);
    
  } catch (error) {
    console.error('Connection error:', error);
    toast.error(`Failed to connect ${platformDisplayNames[platform] || platform}`);
  } finally {
    setActionInProgress(null);
  }
};
  const handleDisconnect = async (platform) => {
    if (!window.confirm(`Are you sure you want to disconnect ${platformDisplayNames[platform] || platform}? This will remove your access token.`)) {
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    let isValid = false;
    let errorMessage = '';

    // Check if any selected platform supports the file type
    const hasVideoPlatform = selectedPlatforms.some(p => ['youtube', 'twitter'].includes(p));
    const hasImagePlatform = selectedPlatforms.some(p => ['facebook', 'instagram', 'linkedin', 'twitter'].includes(p));

    if (hasVideoPlatform && validVideoTypes.includes(file.type)) {
      isValid = true;
    } else if (hasImagePlatform && validImageTypes.includes(file.type)) {
      isValid = true;
    } else if (selectedPlatforms.length === 0) {
      errorMessage = 'Please select a platform first';
    } else {
      const suggestions = [];
      if (selectedPlatforms.some(p => ['youtube', 'twitter'].includes(p))) suggestions.push('YouTube/Twitter: MP4, MOV, AVI, MKV, WEBM');
      if (selectedPlatforms.some(p => ['facebook', 'instagram', 'linkedin', 'twitter'].includes(p))) suggestions.push('Facebook/Instagram/LinkedIn/Twitter: JPEG, PNG, GIF, WEBP');
      
      errorMessage = `File type not supported for selected platforms.\n\nSupported formats:\n${suggestions.join('\n')}`;
    }

    if (!isValid) {
      toast.error(errorMessage);
      e.target.value = '';
      return;
    }

    const maxSize = 128 * 1024 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 128GB. Your file: ${(file.size / (1024**3)).toFixed(2)}GB`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    toast.success(`File selected: ${file.name} (${(file.size / (1024**2)).toFixed(2)} MB)`);
  };

  const handleTextPublish = async () => {
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

      const response = await posts.publish(payload);
      const successCount = response.data.successful;
      const totalCount = response.data.total_platforms;
      
      if (successCount === totalCount) {
        toast.success(`Successfully posted to ${totalCount} platform${totalCount > 1 ? 's' : ''}!`);
        setPostContent('');
        setSelectedPlatforms([]);
        setSelectedFile(null);
      } else if (successCount > 0) {
        toast.warning(`Partially successful: ${successCount}/${totalCount} platforms`);
      } else {
        toast.error('Failed to post. Check your platform connections.');
      }
      
      fetchConnections();
    } catch (error) {
      console.error('Publish error:', error);
      toast.error(error.response?.data?.detail || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  const handleFileUpload = async () => {
    if (!postContent.trim()) {
      toast.error('Please enter content to post');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Please select at least one platform');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      
      formData.append('platforms', JSON.stringify(selectedPlatforms));
      formData.append('content', postContent);
      
      const isVideo = selectedFile.type.startsWith('video/');
      formData.append('media_type', isVideo ? 'video' : 'image');
      formData.append('file', selectedFile);

      const response = await posts.publishWithMedia(formData);
      
      const successCount = response.data.successful;
      const totalCount = response.data.total_platforms;
      
      if (successCount === totalCount) {
        toast.success(`Successfully published to ${totalCount} platform${totalCount > 1 ? 's' : ''}!`);
        setPostContent('');
        setSelectedPlatforms([]);
        setSelectedFile(null);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
      } else if (successCount > 0) {
        toast.warning(`Partially successful: ${successCount}/${totalCount} platforms`);
        const failed = Object.entries(response.data.results || {})
          .filter(([_, r]) => !r.success)
          .map(([platform]) => platform);
        if (failed.length > 0) {
          toast.error(`Failed on: ${failed.join(', ')}`);
        }
      } else {
        toast.error('Failed to publish. Check your platform connections.');
      }
      
      fetchConnections();
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Check if any platform supports the current selection
  const isThreadMode = selectedPlatforms.includes('twitter') && selectedPlatforms.length === 1 && postContent.split('\n').filter(l => l.trim()).length > 1;
  const hasImageSupport = selectedPlatforms.some(p => ['facebook', 'instagram', 'linkedin', 'twitter'].includes(p));
  const hasVideoSupport = selectedPlatforms.some(p => ['youtube', 'twitter'].includes(p));

  const hasAnyConnection = Object.values(platformConnections).some(p => p?.connected);
  const supportsFileUpload = selectedPlatforms.some(p => ['youtube', 'facebook', 'instagram', 'linkedin', 'twitter'].includes(p));
  
  const hasInstagram = selectedPlatforms.includes('instagram');
  const hasLinkedIn = selectedPlatforms.includes('linkedin');
  const hasTwitter = selectedPlatforms.includes('twitter');

  const connectedCount = Object.values(platformConnections).filter(p => p?.connected).length;
  const totalPlatforms = 6; // Facebook, Instagram, Twitter, LinkedIn, YouTube, WhatsApp

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
              <p className="text-gray-500 mt-1">Manage your social media presence from one place</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Connected Platforms</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">
                  {loading ? '...' : `${connectedCount}/${totalPlatforms}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Social Platforms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <PlatformCardSkeleton key={i} />)
            ) : (
              ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'].map((platform) => {
                const connection = platformConnections[platform];
                const isConnected = connection?.connected;
                const isInProgress = actionInProgress === platform;
                const displayName = platformDisplayNames[platform];
                
                return (
                  <div
                    key={platform}
                    className={`bg-white rounded-xl p-4 transition-all duration-300 border flex items-center gap-4 ${
                      isConnected 
                        ? 'border-pink-300 shadow-md shadow-pink-200/50' 
                        : 'border-gray-100 hover:shadow-md hover:shadow-gray-100/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isConnected ? 'bg-pink-50' : 'bg-gray-50'
                    }`}>
                      {platformIcons[platform]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isConnected ? 'text-gray-800' : 'text-gray-500'}`}>{displayName}</p>
                      {isConnected ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 text-pink-600 text-xs">
                            <FaCheckCircle size={10} />
                            Connected
                          </span>
                          <button
                            onClick={() => handleDisconnect(platform)}
                            disabled={isInProgress}
                            className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
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

        {/* Publish Card */}
        {!loading && hasAnyConnection && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiSend className="text-pink-600" />
              Create Post
            </h2>
            
            {/* Platform Selection */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Select Platforms</label>
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
                          ? 'bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white shadow-md shadow-pink-200/50' 
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                      }`}
                    >
                      {platformIcons[platform]}
                      <span className="capitalize">{platformDisplayNames[platform]}</span>
                    </button>
                  );
                })}
              </div>
              {selectedPlatforms.length === 0 && (
                <p className="text-sm text-amber-500 mt-2">Please select at least one platform</p>
              )}
            </div>
            
            {/* Content Input */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                <div className="flex items-center gap-2">
                  <FiType size={16} />
                  Content
                </div>
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all"
                rows={isThreadMode ? 6 : 4}
                placeholder="What's on your mind?"
              />
              {isThreadMode && (
                <p className="text-xs text-pink-600 mt-1">
                  <FaInfoCircle className="inline mr-1" />
                  Thread mode detected: Each line will be a separate tweet
                </p>
              )}
              {hasTwitter && selectedPlatforms.length === 1 && (
                <p className="text-xs text-gray-400 mt-1">
                  Twitter: Each paragraph will be a separate tweet in a thread
                </p>
              )}
            </div>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleTextPublish}
                disabled={publishing || selectedPlatforms.length === 0 || !postContent.trim() || hasInstagram}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                  hasInstagram 
                    ? 'bg-gray-100 cursor-not-allowed text-gray-400' 
                    : 'bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white hover:shadow-lg hover:shadow-pink-200/50'
                }`}
              >
                {publishing ? <FaSpinner className="animate-spin" /> : <FiSend />}
                {publishing ? 'Publishing...' : 'Publish Text'}
              </button>
              
              {supportsFileUpload && (
                <>
                  <div className="relative flex-1">
                    <input
                      id="file-upload"
                      type="file"
                      accept={hasVideoSupport ? 'video/*' : 'image/*,video/*'}
                      onChange={handleFileSelect}
                      disabled={!supportsFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 border-2 border-dashed ${
                        supportsFileUpload 
                          ? 'border-pink-300 text-pink-600 hover:bg-pink-50 cursor-pointer' 
                          : 'border-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <FaUpload />
                      {selectedFile ? selectedFile.name : 'Select File'}
                    </label>
                  </div>
                  
                  <button
                    onClick={handleFileUpload}
                    disabled={uploading || selectedPlatforms.length === 0 || !postContent.trim() || !selectedFile}
                    className="flex-1 bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-pink-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                    {uploading ? 'Uploading...' : 'Publish with Media'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* No Connections Message */}
        {!loading && !hasAnyConnection && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-gray-200 mb-3">
              <FaPlug size={48} className="mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Platforms Connected</h3>
            <p className="text-gray-400 mb-4">Connect your social media accounts to start posting</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Quick Stats</h3>
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
                <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">
                  {connectedCount}
                </p>
                <p className="text-sm text-gray-500">Connected Platforms</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
                <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">—</p>
                <p className="text-sm text-gray-500">Posts Today</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
                <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">—</p>
                <p className="text-sm text-gray-500">Total Reach</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-blue-50 rounded-xl">
                <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">—</p>
                <p className="text-sm text-gray-500">Engagement</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

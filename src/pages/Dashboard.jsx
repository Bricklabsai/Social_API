import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { platforms, posts } from '../services/api';
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaInstagram, FaWhatsapp,
  FaCheckCircle, FaSpinner, FaPlug, FaUnlink, FaUpload, FaInfoCircle,
  FaChartLine
} from 'react-icons/fa';
import { FiSend, FiImage, FiVideo, FiFile, FiType } from 'react-icons/fi';
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
  const [uploading, setUploading] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

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
      
      const authWindow = window.open(
        `http://localhost:8000/api/v1/auth/${platform}/connect?user_id=${userId}`,
        `${platform}_auth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
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
      setSelectedPlatforms(prev => prev.filter(p => p !== platform));
      setSelectedFile(null);
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

  const isThreadMode = selectedPlatforms.includes('twitter') && selectedPlatforms.length === 1 && postContent.split('\n').filter(l => l.trim()).length > 1;
  const hasImageSupport = selectedPlatforms.some(p => ['facebook', 'instagram', 'linkedin', 'twitter'].includes(p));
  const hasVideoSupport = selectedPlatforms.some(p => ['youtube', 'twitter'].includes(p));

  const platformDisplayNames = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
  };

  const hasAnyConnection = Object.values(platformConnections).some(p => p?.connected);
  const supportsFileUpload = selectedPlatforms.some(p => ['youtube', 'facebook', 'instagram', 'linkedin', 'twitter'].includes(p));
  
  const hasInstagram = selectedPlatforms.includes('instagram');
  const hasLinkedIn = selectedPlatforms.includes('linkedin');
  const hasTwitter = selectedPlatforms.includes('twitter');

  const connectedCount = Object.values(platformConnections).filter(p => p?.connected).length;

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
                  {connectedCount}/6
                </p>
              </div>
              {/* <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-pink-300 to-blue-300 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200/50">
                <span className="text-white font-bold text-xl">S</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Social Platforms</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'].map((platform) => {
              const connection = platformConnections[platform];
              const isConnected = connection?.connected;
              const isInProgress = actionInProgress === platform;
              const displayName = platformDisplayNames[platform];
              
              return (
                <div
                  key={platform}
                  className={`bg-white rounded-xl p-4 text-center transition-all duration-300 border ${
                    isConnected 
                      ? 'border-pink-200 shadow-md shadow-pink-100/50' 
                      : 'border-gray-100 hover:shadow-md hover:shadow-gray-100/50'
                  }`}
                >
                  <div className="flex justify-center mb-3">
                    {platformIcons[platform]}
                  </div>
                  <p className={`font-medium mb-2 ${isConnected ? 'text-gray-800' : 'text-gray-500'}`}>{displayName}</p>
                  
                  {loading ? (
                    <FaSpinner className="animate-spin mx-auto text-pink-400" />
                  ) : isConnected ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-1 text-pink-500 text-xs">
                        <FaCheckCircle size={12} />
                        <span>Connected</span>
                      </div>
                      <button
                        onClick={() => handleDisconnect(platform)}
                        disabled={isInProgress}
                        className="w-full px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                      >
                        {isInProgress ? <FaSpinner className="animate-spin" size={10} /> : <FaUnlink size={10} />}
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleConnect(platform)}
                      disabled={isInProgress}
                      className="w-full px-3 py-1.5 text-xs bg-gradient-to-r from-pink-400/20 via-pink-300/20 to-blue-300/20 hover:from-pink-400/30 hover:via-pink-300/30 hover:to-blue-300/30 text-pink-600 rounded-md transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {isInProgress ? <FaSpinner className="animate-spin" size={10} /> : <FaPlug size={10} />}
                      Connect
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Publish Card */}
        {hasAnyConnection && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FiSend className="text-pink-400" />
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
        {!hasAnyConnection && !loading && (
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { platforms, posts } from '../services/api';
import { 
  FaFacebook, FaTwitter, FaLinkedin, FaYoutube, FaInstagram, FaWhatsapp,
  FaCheckCircle, FaSpinner, FaPlug, FaUnlink, FaUpload, FaInfoCircle
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
    const hasVideoPlatform = selectedPlatforms.some(p => ['youtube'].includes(p));
    const hasImagePlatform = selectedPlatforms.some(p => ['facebook', 'instagram', 'linkedin'].includes(p));

    if (hasVideoPlatform && validVideoTypes.includes(file.type)) {
      isValid = true;
    } else if (hasImagePlatform && validImageTypes.includes(file.type)) {
      isValid = true;
    } else if (selectedPlatforms.length === 0) {
      errorMessage = 'Please select a platform first';
    } else {
      // Check what platforms are selected and suggest correct file type
      const suggestions = [];
      if (selectedPlatforms.some(p => ['youtube'].includes(p))) suggestions.push('YouTube: MP4, MOV, AVI, MKV, WEBM');
      if (selectedPlatforms.some(p => ['facebook', 'instagram', 'linkedin'].includes(p))) suggestions.push('Facebook/Instagram/LinkedIn: JPEG, PNG, GIF, WEBP');
      
      errorMessage = `File type not supported for selected platforms.\n\nSupported formats:\n${suggestions.join('\n')}`;
    }

    if (!isValid) {
      toast.error(errorMessage);
      e.target.value = '';
      return;
    }

    // Check file size
    const maxSize = 128 * 1024 * 1024 * 1024; // 128GB
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 128GB. Your file: ${(file.size / (1024**3)).toFixed(2)}GB`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    toast.success(`File selected: ${file.name} (${(file.size / (1024**2)).toFixed(2)} MB)`);
  };

  // TEXT-ONLY PUBLISH (NO FILE)
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

  // FILE UPLOAD PUBLISH (WITH IMAGE/VIDEO)
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

      console.log('Sending FormData:');
      console.log('  platforms:', JSON.stringify(selectedPlatforms));
      console.log('  content:', postContent);
      console.log('  media_type:', isVideo ? 'video' : 'image');
      console.log('  file:', selectedFile.name);

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
  const hasImageSupport = selectedPlatforms.some(p => ['facebook', 'instagram', 'linkedin'].includes(p));
  const hasVideoSupport = selectedPlatforms.includes('youtube');

  const platformDisplayNames = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    twitter: 'Twitter',
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
  };

  const hasAnyConnection = Object.values(platformConnections).some(p => p?.connected);
  const supportsFileUpload = selectedPlatforms.some(p => ['youtube', 'facebook', 'instagram', 'linkedin'].includes(p));
  
  const hasInstagram = selectedPlatforms.includes('instagram');
  const hasLinkedIn = selectedPlatforms.includes('linkedin');

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
        {hasAnyConnection && (
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
                <div className="flex items-center gap-2">
                  <FiType size={16} />
                  Content
                </div>
                {selectedPlatforms.includes('twitter') && (
                  <span className="text-xs text-gray-400 ml-2">(Twitter limit: 280 chars)</span>
                )}
                {hasInstagram && (
                  <span className="text-xs text-yellow-500 ml-2">(Instagram requires image/video)</span>
                )}
              </label>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={isThreadMode ? 6 : 4}
                placeholder={isThreadMode ? 'Tweet 1\nTweet 2\nTweet 3' : "What's on your mind?"}
              />
              {selectedPlatforms.includes('twitter') && !isThreadMode && (
                <div className={`text-right text-xs mt-1 ${postContent.length > 280 ? 'text-red-400' : 'text-gray-400'}`}>
                  {postContent.length}/280 characters
                </div>
              )}
            </div>
            
            {/* TEXT-ONLY PUBLISH BUTTON */}
            <div className="mb-4">
              <button
                onClick={handleTextPublish}
                disabled={publishing || selectedPlatforms.length === 0 || !postContent.trim() || hasInstagram}
                className={`w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                  hasInstagram 
                    ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {publishing ? <FaSpinner className="animate-spin" /> : <FiSend />}
                {publishing ? 'Publishing...' : 'Publish Text Post'}
              </button>
              {hasInstagram && (
                <p className="text-xs text-yellow-500 text-center mt-1">
                  Instagram requires an image/video. Use the upload section below.
                </p>
              )}
              <p className="text-xs text-gray-500 text-center mt-1">
                Post text to all selected platforms (except Instagram which needs media)
              </p>
            </div>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-gray-800 text-gray-400">OR</span>
              </div>
            </div>
            
            {/* File Upload Section - For images/videos */}
            <div className="mb-4">
              <label className="block text-gray-300 font-medium mb-2">
                <div className="flex items-center gap-2">
                  <FaUpload size={16} />
                  Upload Image/Video
                </div>
                {hasInstagram && (
                  <span className="text-xs text-blue-400 ml-2 flex items-center gap-1">
                    <FaInfoCircle size={12} />
                    Instagram requires image/video for business posts
                  </span>
                )}
                {hasLinkedIn && (
                  <span className="text-xs text-blue-400 ml-2 flex items-center gap-1">
                    <FaInfoCircle size={12} />
                    LinkedIn supports image uploads
                  </span>
                )}
              </label>
              
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                supportsFileUpload ? 'border-gray-600 hover:border-blue-500 cursor-pointer' : 'border-gray-700 opacity-50'
              }`}>
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
                  className={`flex flex-col items-center gap-2 ${supportsFileUpload ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <FaUpload size={32} className="text-gray-400" />
                  <span className="text-gray-400">
                    {selectedFile ? selectedFile.name : (supportsFileUpload ? 'Click to select image/video' : 'Select image/video supported platforms first')}
                  </span>
                  <span className="text-xs text-gray-500">
                    {hasVideoSupport 
                      ? 'MP4, MOV, AVI, MKV, WEBM (Max 128GB)' 
                      : hasInstagram && selectedPlatforms.length === 1
                      ? 'JPEG, PNG, GIF, WEBP (Max 8MB for Instagram)'
                      : hasLinkedIn && selectedPlatforms.length === 1
                      ? 'JPEG, PNG, GIF, WEBP (Max 10MB for LinkedIn)'
                      : 'JPEG, PNG, GIF, WEBP (Max 10MB)'}
                  </span>
                </label>
              </div>
              
              {selectedFile && (
                <div className="mt-3 flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {selectedFile.type.startsWith('video/') ? (
                      <FiVideo className="text-blue-400" size={20} />
                    ) : (
                      <FiImage className="text-green-400" size={20} />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-gray-400 text-xs">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      document.getElementById('file-upload').value = '';
                    }}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
              
              {!supportsFileUpload && selectedPlatforms.length > 0 && (
                <p className="text-xs text-yellow-500 mt-2">
                  Note: File upload is supported for YouTube (video), Facebook (image), Instagram (image), and LinkedIn (image)
                </p>
              )}
              
              {hasInstagram && selectedPlatforms.length === 1 && selectedFile && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  Your image will be uploaded and posted to Instagram with the caption above
                </p>
              )}
              
              {hasLinkedIn && selectedPlatforms.length === 1 && selectedFile && (
                <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                  Your image will be uploaded and posted to LinkedIn with the caption above
                </p>
              )}
            </div>
            
            {/* FILE UPLOAD BUTTON */}
            {supportsFileUpload && (
              <button
                onClick={handleFileUpload}
                disabled={uploading || selectedPlatforms.length === 0 || !postContent.trim() || !selectedFile}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                {uploading ? 'Uploading & Publishing...' : 'Publish with Media'}
              </button>
            )}
          </div>
        )}

        {/* No Connections Message */}
        {!hasAnyConnection && !loading && (
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="text-gray-400 mb-3">
              <FaPlug size={48} className="mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Platforms Connected</h3>
            <p className="text-gray-400 mb-4">
              Connect your social media accounts to start posting
            </p>
            <p className="text-sm text-gray-500">
              Click "Connect" on any platform above to get started
            </p>
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
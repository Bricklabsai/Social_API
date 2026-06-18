import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posts } from '../services/api';
import { 
  FaYoutube, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp,
  FaCalendar, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowLeft,
  FaEye, FaHeart, FaComment, FaShare, FaChartLine, FaGlobe
} from 'react-icons/fa';
import { FiCopy, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Platform config
const platformConfig = {
  facebook: { 
    icon: <FaFacebook className="text-blue-600" size={20} />, 
    name: 'Facebook',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  instagram: { 
    icon: <FaInstagram className="text-pink-600" size={20} />, 
    name: 'Instagram',
    color: 'text-pink-600',
    bg: 'bg-pink-50'
  },
  twitter: { 
    icon: <FaTwitter className="text-sky-500" size={20} />, 
    name: 'Twitter',
    color: 'text-sky-500',
    bg: 'bg-sky-50'
  },
  linkedin: { 
    icon: <FaLinkedin className="text-blue-700" size={20} />, 
    name: 'LinkedIn',
    color: 'text-blue-700',
    bg: 'bg-blue-50'
  },
  youtube: { 
    icon: <FaYoutube className="text-red-600" size={20} />, 
    name: 'YouTube',
    color: 'text-red-600',
    bg: 'bg-red-50'
  },
  whatsapp: { 
    icon: <FaWhatsapp className="text-green-500" size={20} />, 
    name: 'WhatsApp',
    color: 'text-green-500',
    bg: 'bg-green-50'
  },
};

const detectPlatforms = (post) => {
  if (post.platforms && Array.isArray(post.platforms)) {
    if (post.platforms.includes('instagram')) {
      return post.platforms;
    }
    if (post.platforms.includes('facebook')) {
      if (post.instagram_business_id || 
          post.media_type === 'image' || 
          post.content?.includes('#') ||
          post.analytics?.some(a => a.platform === 'instagram')) {
        return ['instagram'];
      }
      return post.platforms;
    }
    return post.platforms;
  }
  
  if (post.platform) {
    if (post.platform === 'facebook') {
      if (post.instagram_business_id || 
          post.media_type === 'image' ||
          post.analytics?.some(a => a.platform === 'instagram')) {
        return ['instagram'];
      }
    }
    return [post.platform];
  }
  
  if (post.analytics && post.analytics.length > 0) {
    const analyticsPlatforms = post.analytics.map(a => a.platform);
    if (analyticsPlatforms.includes('instagram')) return ['instagram'];
    if (analyticsPlatforms.includes('facebook')) return ['facebook'];
    return analyticsPlatforms;
  }
  
  return ['unknown'];
};

const getPlatformDisplay = (platform) => {
  return platformConfig[platform] || { 
    icon: <FaGlobe className="text-gray-400" size={20} />, 
    name: platform || 'Unknown',
    color: 'text-gray-400',
    bg: 'bg-gray-50'
  };
};

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await posts.getPost(id);
      const postData = response.data;
      postData.detectedPlatforms = detectPlatforms(postData);
      setPost(postData);
    } catch (error) {
      console.error('Failed to fetch post:', error);
      toast.error('Post not found');
      navigate('/posts');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getStatusBadge = () => {
    if (!post) return null;
    const statusConfig = {
      completed: { icon: <FaCheckCircle />, text: 'Success', color: 'text-green-600 bg-green-50' },
      partial: { icon: <FaExclamationTriangle />, text: 'Partial', color: 'text-amber-600 bg-amber-50' },
      failed: { icon: <FaExclamationTriangle />, text: 'Failed', color: 'text-red-600 bg-red-50' },
      processing: { icon: <FaSpinner className="animate-spin" />, text: 'Processing', color: 'text-pink-600 bg-pink-50' },
    };
    const config = statusConfig[post.status] || statusConfig.processing;
    return (
      <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <FaSpinner className="animate-spin text-pink-400 text-4xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <p className="text-gray-400">Post not found</p>
        <button
          onClick={() => navigate('/posts')}
          className="mt-4 text-pink-500 hover:text-pink-600 transition-colors"
        >
          Back to Posts
        </button>
      </div>
    );
  }

  const platforms = post.detectedPlatforms || ['unknown'];
  const content = post.content || post.content_text || '';
  const mediaUrl = post.media_url || post.content_media_url || null;
  const mediaType = post.media_type || null;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/posts')}
            className="flex items-center gap-2 text-gray-500 hover:text-pink-500 transition-colors"
          >
            <FaArrowLeft size={20} />
            Back to Posts
          </button>
        </div>

        {/* Post Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Platform Badge */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-wrap items-center gap-3">
              {platforms.map(platform => {
                const config = getPlatformDisplay(platform);
                return (
                  <div key={platform} className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg}`}>
                    {config.icon}
                    <span className={`font-medium capitalize ${config.color}`}>{config.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Preview */}
          {mediaUrl && (
            <div className="bg-gray-50 p-8 flex justify-center items-center border-b border-gray-100">
              {mediaType === 'video' ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaYoutube size={48} className="text-red-500" />
                  </div>
                  <p className="text-gray-400 text-sm truncate max-w-md">Video: {mediaUrl}</p>
                </div>
              ) : mediaType === 'image' ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaInstagram size={48} className="text-pink-500" />
                  </div>
                  <p className="text-gray-400 text-sm truncate max-w-md">Image: {mediaUrl}</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-pink-50 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaExternalLink size={48} className="text-pink-400" />
                  </div>
                  <p className="text-gray-400 text-sm truncate max-w-md">Media: {mediaUrl}</p>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap items-center gap-3">
                {getStatusBadge()}
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <FaCalendar size={14} />
                  {new Date(post.created_at || post.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(content)}
                className="text-gray-400 hover:text-pink-500 transition-colors"
                title="Copy content"
              >
                <FiCopy size={18} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                {content || 'No content'}
              </p>
            </div>

            {/* Analytics */}
            {post.analytics && post.analytics.length > 0 && (
              <div>
                <h3 className="text-gray-600 text-sm font-medium mb-3">Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.analytics.map((analytic, idx) => {
                    const config = getPlatformDisplay(analytic.platform);
                    return (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          {config.icon}
                          <span className={`font-medium capitalize ${config.color}`}>{config.name}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaEye size={14} />
                            <span>Reach: {analytic.reach || 0}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaChartLine size={14} />
                            <span>Impressions: {analytic.impressions || 0}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaHeart size={14} />
                            <span>Likes: {analytic.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaComment size={14} />
                            <span>Comments: {analytic.comments || 0}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500">
                            <FaShare size={14} />
                            <span>Shares: {analytic.shares || 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
              <p>Created: {new Date(post.created_at || post.createdAt || Date.now()).toLocaleString()}</p>
              {post.published_at && <p>Published: {new Date(post.published_at).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
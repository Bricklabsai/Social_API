import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { posts } from '../services/api';
import { 
  FaYoutube, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp,
  FaCalendar, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaArrowLeft,
  FaEye, FaHeart, FaComment, FaShare, FaChartLine
} from 'react-icons/fa';
import { FiCopy, FiExternalLink } from 'react-icons/fi';
import toast from 'react-hot-toast';

const platformIcons = {
  facebook: <FaFacebook className="text-blue-600" size={20} />,
  instagram: <FaInstagram className="text-pink-600" size={20} />,
  twitter: <FaTwitter className="text-sky-500" size={20} />,
  linkedin: <FaLinkedin className="text-blue-700" size={20} />,
  youtube: <FaYoutube className="text-red-600" size={20} />,
  whatsapp: <FaWhatsapp className="text-green-500" size={20} />,
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
      setPost(response.data);
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
      completed: { icon: <FaCheckCircle />, text: 'Success', color: 'text-green-400 bg-green-900/30' },
      partial: { icon: <FaExclamationTriangle />, text: 'Partial', color: 'text-yellow-400 bg-yellow-900/30' },
      failed: { icon: <FaExclamationTriangle />, text: 'Failed', color: 'text-red-400 bg-red-900/30' },
      processing: { icon: <FaSpinner className="animate-spin" />, text: 'Processing', color: 'text-blue-400 bg-blue-900/30' },
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
      <Layout>
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-blue-400 text-4xl" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-400">Post not found</p>
          <button
            onClick={() => navigate('/posts')}
            className="mt-4 text-blue-400 hover:text-blue-300"
          >
            Back to Posts
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/posts')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FaArrowLeft size={20} />
            Back to Posts
          </button>
        </div>

        {/* Post Card */}
        <div className="bg-gray-800 rounded-xl overflow-hidden">
          {/* Media Preview */}
          {post.media_url && (
            <div className="bg-gray-900 p-8 flex justify-center items-center border-b border-gray-700">
              {post.media_type === 'video' ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaYoutube size={48} className="text-red-500" />
                  </div>
                  <p className="text-gray-400 text-sm">Video: {post.media_url}</p>
                </div>
              ) : post.media_type === 'image' ? (
                <div className="text-center">
                  <div className="w-32 h-32 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaInstagram size={48} className="text-pink-500" />
                  </div>
                  <p className="text-gray-400 text-sm">Image: {post.media_url}</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <FaCalendar size={14} />
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(post.content)}
                className="text-gray-400 hover:text-white transition-colors"
                title="Copy content"
              >
                <FiCopy size={18} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* Platforms */}
            <div className="mb-6">
              <h3 className="text-gray-400 text-sm font-medium mb-3">Posted to:</h3>
              <div className="flex flex-wrap gap-3">
                {post.platforms.map((platform) => (
                  <div key={platform} className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
                    {platformIcons[platform]}
                    <span className="text-white capitalize">{platform}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics */}
            {post.analytics && post.analytics.length > 0 && (
              <div>
                <h3 className="text-gray-400 text-sm font-medium mb-3">Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {post.analytics.map((analytic, idx) => (
                    <div key={idx} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        {platformIcons[analytic.platform]}
                        <span className="text-white font-medium capitalize">{analytic.platform}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaEye size={14} />
                          <span>Reach: {analytic.reach || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaChartLine size={14} />
                          <span>Impressions: {analytic.impressions || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaHeart size={14} />
                          <span>Likes: {analytic.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaComment size={14} />
                          <span>Comments: {analytic.comments || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                          <FaShare size={14} />
                          <span>Shares: {analytic.shares || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500">
              <p>Created: {new Date(post.created_at).toLocaleString()}</p>
              {post.published_at && <p>Published: {new Date(post.published_at).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PostDetail;
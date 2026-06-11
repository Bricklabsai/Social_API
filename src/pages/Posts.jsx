import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { posts } from '../services/api';
import { 
  FaYoutube, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp,
  FaCalendar, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEye, FaTrash,
  FaChartLine
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const platformIcons = {
  facebook: <FaFacebook className="text-blue-600" size={16} />,
  instagram: <FaInstagram className="text-pink-600" size={16} />,
  twitter: <FaTwitter className="text-sky-500" size={16} />,
  linkedin: <FaLinkedin className="text-blue-700" size={16} />,
  youtube: <FaYoutube className="text-red-600" size={16} />,
  whatsapp: <FaWhatsapp className="text-green-500" size={16} />,
};

const Posts = () => {
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await posts.getPosts(50);
      setUserPosts(response.data.posts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (window.confirm('Delete this post record? (This does not delete from social media)')) {
      try {
        await posts.deletePost(postId);
        toast.success('Post deleted from database');
        fetchPosts();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { icon: <FaCheckCircle />, text: 'Success', color: 'text-green-400 bg-green-900/30' },
      partial: { icon: <FaExclamationTriangle />, text: 'Partial', color: 'text-yellow-400 bg-yellow-900/30' },
      failed: { icon: <FaExclamationTriangle />, text: 'Failed', color: 'text-red-400 bg-red-900/30' },
      processing: { icon: <FaSpinner className="animate-spin" />, text: 'Processing', color: 'text-blue-400 bg-blue-900/30' },
    };
    const config = statusConfig[status] || statusConfig.processing;
    return (
      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color}`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Posts</h1>
          <p className="text-gray-300 mt-1">View and manage your published content</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="animate-spin text-blue-400 text-4xl" />
          </div>
        ) : userPosts.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-gray-500 text-6xl mb-4">📝</div>
            <p className="text-gray-400">No posts yet. Create your first post from the Dashboard!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userPosts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                onClick={() => navigate(`/posts/${post.id}`)}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(post.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/posts/${post.id}`);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                        title="View details"
                      >
                        <FaEye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(post.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete record"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <FaCalendar size={12} />
                    {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                    {truncateText(post.content, 100)}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {post.platforms.map((platform) => (
                        <div key={platform} className="flex items-center gap-1">
                          {platformIcons[platform]}
                          <span className="text-xs text-gray-400 capitalize">{platform}</span>
                        </div>
                      ))}
                    </div>
                    {post.analytics && post.analytics.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <FaChartLine size={12} />
                        <span>{post.analytics.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Posts;
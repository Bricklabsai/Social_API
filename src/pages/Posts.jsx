import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { posts } from '../services/api';
import { 
  FaYoutube, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp,
  FaCalendar, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEye, FaTrash,
  FaChartLine, FaGlobe, FaFilter
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// Platform icons with display names
const platformConfig = {
  facebook: { 
    icon: <FaFacebook className="text-blue-600" size={16} />, 
    name: 'Facebook',
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  instagram: { 
    icon: <FaInstagram className="text-pink-600" size={16} />, 
    name: 'Instagram',
    color: 'text-pink-600',
    bg: 'bg-pink-50'
  },
  twitter: { 
    icon: <FaTwitter className="text-sky-500" size={16} />, 
    name: 'Twitter',
    color: 'text-sky-500',
    bg: 'bg-sky-50'
  },
  linkedin: { 
    icon: <FaLinkedin className="text-blue-700" size={16} />, 
    name: 'LinkedIn',
    color: 'text-blue-700',
    bg: 'bg-blue-50'
  },
  youtube: { 
    icon: <FaYoutube className="text-red-600" size={16} />, 
    name: 'YouTube',
    color: 'text-red-600',
    bg: 'bg-red-50'
  },
  whatsapp: { 
    icon: <FaWhatsapp className="text-green-500" size={16} />, 
    name: 'WhatsApp',
    color: 'text-green-500',
    bg: 'bg-green-50'
  },
};

// Improved Smart Platform Detection
const detectPlatforms = (post) => {
  console.log('Detecting platforms for post:', post.id, post);
  
  const detected = [];
  
  if (post.platforms && Array.isArray(post.platforms) && post.platforms.length > 0) {
    for (const p of post.platforms) {
      if (p === 'facebook') {
        const isInstagram = 
          (post.media_type === 'image') ||
          (post.analytics && post.analytics.some(a => a.platform === 'instagram')) ||
          (post.content && /#instagram|@instagram|insta|ig_/i.test(post.content)) ||
          (post.instagram_business_id) ||
          (post.platform_user_id && post.platform_user_id.startsWith('178'));
        
        if (isInstagram) {
          detected.push('instagram');
          console.log('Detected as Instagram via clues');
        } else {
          detected.push('facebook');
          console.log('Keeping as Facebook');
        }
      } else {
        detected.push(p);
      }
    }
    
    if (detected.length > 0) {
      return detected;
    }
  }
  
  if (post.platform) {
    if (post.platform === 'facebook') {
      const isInstagram = 
        post.media_type === 'image' ||
        (post.analytics && post.analytics.some(a => a.platform === 'instagram')) ||
        (post.content && /#instagram|@instagram|insta|ig_/i.test(post.content)) ||
        post.instagram_business_id ||
        (post.platform_user_id && post.platform_user_id.startsWith('178'));
      
      if (isInstagram) {
        return ['instagram'];
      }
    }
    return [post.platform];
  }
  
  if (post.analytics && post.analytics.length > 0) {
    const analyticsPlatforms = post.analytics.map(a => a.platform);
    if (analyticsPlatforms.includes('instagram')) {
      return ['instagram'];
    }
    if (analyticsPlatforms.includes('facebook')) {
      if (post.media_type === 'image') {
        return ['instagram'];
      }
      return ['facebook'];
    }
    return analyticsPlatforms;
  }
  
  if ((post.platform === 'facebook' || post.platforms?.includes('facebook')) && post.media_type === 'image') {
    return ['instagram'];
  }
  
  if (post.content) {
    const lowerContent = post.content.toLowerCase();
    if (lowerContent.includes('#instagram') || 
        lowerContent.includes('instagram') ||
        lowerContent.includes('ig_')) {
      return ['instagram'];
    }
  }
  
  if (post.platform === 'facebook' || post.platforms?.includes('facebook')) {
    return ['facebook'];
  }
  
  if (post.platforms && Array.isArray(post.platforms)) {
    return post.platforms;
  }
  
  return ['unknown'];
};

const getPlatformDisplay = (platform) => {
  return platformConfig[platform] || { 
    icon: <FaGlobe className="text-gray-400" size={16} />, 
    name: platform || 'Unknown',
    color: 'text-gray-400',
    bg: 'bg-gray-50'
  };
};

const Posts = () => {
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await posts.getPosts(50);
      
      let postsData = [];
      if (response.data && response.data.posts) {
        postsData = response.data.posts;
      } else if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        postsData = [response.data];
      }
      
      console.log('Raw posts data:', postsData);
      
      const processedPosts = postsData.map(post => ({
        ...post,
        detectedPlatforms: detectPlatforms(post)
      }));
      
      console.log('Processed posts:', processedPosts);
      setUserPosts(processedPosts);
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
      completed: { icon: <FaCheckCircle />, text: 'Success', color: 'text-green-600 bg-green-50' },
      partial: { icon: <FaExclamationTriangle />, text: 'Partial', color: 'text-amber-600 bg-amber-50' },
      failed: { icon: <FaExclamationTriangle />, text: 'Failed', color: 'text-red-600 bg-red-50' },
      processing: { icon: <FaSpinner className="animate-spin" />, text: 'Processing', color: 'text-pink-600 bg-pink-50' },
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
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredPosts = filter === 'all' 
    ? userPosts 
    : userPosts.filter(post => post.detectedPlatforms?.includes(filter));

  const allPlatforms = [...new Set(userPosts.flatMap(p => p.detectedPlatforms || []))];

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Posts</h1>
              <p className="text-gray-500 mt-1">View and manage your published content</p>
              <p className="text-sm text-gray-400 mt-1">Total posts: {userPosts.length}</p>
            </div>
            {/* <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-pink-300 to-blue-300 rounded-xl flex items-center justify-center shadow-lg shadow-pink-200/50">
              <span className="text-white font-bold text-xl">P</span>
            </div> */}
          </div>
        </div>

        {/* Platform Filter */}
        {userPosts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className="text-pink-400" size={14} />
              <span className="text-sm font-medium text-gray-600">Filter by platform:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'all' 
                    ? 'bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white shadow-md shadow-pink-200/50' 
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                All Posts ({userPosts.length})
              </button>
              {allPlatforms.map(platform => {
                const config = getPlatformDisplay(platform);
                const count = userPosts.filter(p => p.detectedPlatforms?.includes(platform)).length;
                return (
                  <button
                    key={platform}
                    onClick={() => setFilter(platform)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filter === platform 
                        ? 'bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white shadow-md shadow-pink-200/50' 
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    {config.icon}
                    {config.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="animate-spin text-pink-400 text-4xl" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <p className="text-gray-400">
              {userPosts.length === 0 
                ? 'No posts yet. Create your first post from the Dashboard!' 
                : `No posts for ${filter}. Try selecting a different filter.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => {
              const platforms = post.detectedPlatforms || ['unknown'];
              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:shadow-pink-100/50 transition-all duration-300 cursor-pointer group"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(post.status)}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/posts/${post.id}`);
                          }}
                          className="p-1.5 text-gray-400 hover:text-pink-500 transition-colors rounded-lg hover:bg-pink-50"
                          title="View details"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(post.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                          title="Delete record"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <FaCalendar size={12} />
                      {new Date(post.created_at || post.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 min-h-[80px]">
                    <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">
                      {truncateText(post.content || post.content_text || '', 100)}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {platforms.map((platform) => {
                          const config = getPlatformDisplay(platform);
                          return (
                            <span key={platform} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bg}`}>
                              {config.icon}
                              <span className={`capitalize ${config.color}`}>{config.name}</span>
                            </span>
                          );
                        })}
                      </div>
                      {post.analytics && post.analytics.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <FaChartLine size={12} />
                          <span>{post.analytics.length}</span>
                        </div>
                      )}
                    </div>
                    {post.media_type && (
                      <div className="text-xs text-gray-400 mt-2">
                        📎 {post.media_type}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Posts;
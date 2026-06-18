import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { posts } from '../services/api';
import { 
  FaYoutube, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp,
  FaCalendar, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEye, FaTrash,
  FaChartLine, FaGlobe
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// Platform icons with display names
const platformConfig = {
  facebook: { 
    icon: <FaFacebook className="text-blue-600" size={16} />, 
    name: 'Facebook',
    color: 'text-blue-600'
  },
  instagram: { 
    icon: <FaInstagram className="text-pink-600" size={16} />, 
    name: 'Instagram',
    color: 'text-pink-600'
  },
  twitter: { 
    icon: <FaTwitter className="text-sky-500" size={16} />, 
    name: 'Twitter',
    color: 'text-sky-500'
  },
  linkedin: { 
    icon: <FaLinkedin className="text-blue-700" size={16} />, 
    name: 'LinkedIn',
    color: 'text-blue-700'
  },
  youtube: { 
    icon: <FaYoutube className="text-red-600" size={16} />, 
    name: 'YouTube',
    color: 'text-red-600'
  },
  whatsapp: { 
    icon: <FaWhatsapp className="text-green-500" size={16} />, 
    name: 'WhatsApp',
    color: 'text-green-500'
  },
};

// ✅ IMPROVED SMART PLATFORM DETECTION
const detectPlatforms = (post) => {
  // Debug: log what we're receiving
  console.log('🔍 Detecting platforms for post:', post.id, post);
  
  const detected = [];
  
  // 1. Check if platforms array exists and has data
  if (post.platforms && Array.isArray(post.platforms) && post.platforms.length > 0) {
    // Check each platform
    for (const p of post.platforms) {
      // If platform is 'facebook', check if it might be Instagram
      if (p === 'facebook') {
        // Check for Instagram clues
        const isInstagram = 
          // If media_type is image, it's likely Instagram
          (post.media_type === 'image') ||
          // Check analytics
          (post.analytics && post.analytics.some(a => a.platform === 'instagram')) ||
          // Check content for Instagram clues
          (post.content && /#instagram|@instagram|insta|ig_/i.test(post.content)) ||
          // Check if there's an Instagram business ID
          (post.instagram_business_id) ||
          // Check if platform_user_id is for Instagram
          (post.platform_user_id && post.platform_user_id.startsWith('178'));
        
        if (isInstagram) {
          detected.push('instagram');
          console.log('✅ Detected as Instagram via clues');
        } else {
          detected.push('facebook');
          console.log('📘 Keeping as Facebook');
        }
      } else {
        detected.push(p);
      }
    }
    
    // If we got results, return them
    if (detected.length > 0) {
      return detected;
    }
  }
  
  // 2. Check if platform is a string
  if (post.platform) {
    if (post.platform === 'facebook') {
      // Check if this is actually Instagram
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
  
  // 3. Check analytics for clues
  if (post.analytics && post.analytics.length > 0) {
    const analyticsPlatforms = post.analytics.map(a => a.platform);
    if (analyticsPlatforms.includes('instagram')) {
      return ['instagram'];
    }
    if (analyticsPlatforms.includes('facebook')) {
      // Check if this is actually Instagram
      if (post.media_type === 'image') {
        return ['instagram'];
      }
      return ['facebook'];
    }
    return analyticsPlatforms;
  }
  
  // 4. If we have Facebook but it has image media, it's Instagram
  if ((post.platform === 'facebook' || post.platforms?.includes('facebook')) && post.media_type === 'image') {
    return ['instagram'];
  }
  
  // 5. Default: try to detect from content
  if (post.content) {
    const lowerContent = post.content.toLowerCase();
    if (lowerContent.includes('#instagram') || 
        lowerContent.includes('instagram') ||
        lowerContent.includes('ig_')) {
      return ['instagram'];
    }
  }
  
  // 6. If we have Facebook but no evidence of Instagram, return Facebook
  if (post.platform === 'facebook' || post.platforms?.includes('facebook')) {
    return ['facebook'];
  }
  
  // If we got here and have no platforms, try the raw data
  if (post.platforms && Array.isArray(post.platforms)) {
    return post.platforms;
  }
  
  return ['unknown'];
};

// ✅ GET PLATFORM DISPLAY INFO
const getPlatformDisplay = (platform) => {
  return platformConfig[platform] || { 
    icon: <FaGlobe className="text-gray-400" size={16} />, 
    name: platform || 'Unknown',
    color: 'text-gray-400'
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
      
      // Handle different response formats
      let postsData = [];
      if (response.data && response.data.posts) {
        postsData = response.data.posts;
      } else if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        postsData = [response.data];
      }
      
      console.log('📦 Raw posts data:', postsData);
      
      // ✅ Process posts to detect actual platforms
      const processedPosts = postsData.map(post => ({
        ...post,
        detectedPlatforms: detectPlatforms(post)
      }));
      
      console.log('✅ Processed posts:', processedPosts);
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
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // ✅ Filter posts
  const filteredPosts = filter === 'all' 
    ? userPosts 
    : userPosts.filter(post => post.detectedPlatforms?.includes(filter));

  // ✅ Get unique platforms for filter
  const allPlatforms = [...new Set(userPosts.flatMap(p => p.detectedPlatforms || []))];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Posts</h1>
          <p className="text-gray-300 mt-1">View and manage your published content</p>
          <p className="text-xs text-gray-500 mt-1">Total posts: {userPosts.length}</p>
        </div>

        {/* ✅ Platform Filter */}
        {userPosts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    filter === platform 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {config.icon}
                  {config.name} ({count})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <FaSpinner className="animate-spin text-blue-400 text-4xl" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-gray-500 text-6xl mb-4">📝</div>
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
                      {new Date(post.created_at || post.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4">
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                      {truncateText(post.content || post.content_text || '', 100)}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {platforms.map((platform) => {
                          const config = getPlatformDisplay(platform);
                          return (
                            <div key={platform} className="flex items-center gap-1">
                              {config.icon}
                              <span className={`text-xs capitalize ${config.color}`}>{config.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      {post.analytics && post.analytics.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <FaChartLine size={12} />
                          <span>{post.analytics.length}</span>
                        </div>
                      )}
                    </div>
                    {/* Show media type for debugging */}
                    {post.media_type && (
                      <div className="text-xs text-gray-600 mt-1">
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
    </Layout>
  );
};

export default Posts;
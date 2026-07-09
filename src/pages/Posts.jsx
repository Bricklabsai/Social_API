import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { posts } from '../services/api';
import { 
  FaYoutube, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp,
  FaCalendar, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEye, FaTrash,
  FaChartLine, FaGlobe, FaFilter, FaTrashAlt
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// Skeleton Components
const PostCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
    <div className="p-4 border-b border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="p-4 min-h-20">
      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
          <div className="h-5 bg-gray-200 rounded-full w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-8"></div>
      </div>
    </div>
  </div>
);

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
};

const detectPlatforms = (post) => {
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
        } else {
          detected.push('facebook');
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

const getPlatformPostLinks = (post) => {
  if (!post?.analytics || !Array.isArray(post.analytics)) return [];
  return post.analytics
    .filter((item) => item?.platform && item?.platform_post_id)
    .map((item) => {
      if (item.platform === 'twitter') {
        return {
          platform: 'twitter',
          label: 'View on X',
          url: `https://x.com/i/web/status/${item.platform_post_id}`,
        };
      }
      if (item.platform === 'linkedin') {
        return {
          platform: 'linkedin',
          label: 'LinkedIn post id',
          url: null,
          id: item.platform_post_id,
        };
      }
      return {
        platform: item.platform,
        label: `${item.platform} post id`,
        url: null,
        id: item.platform_post_id,
      };
    });
};

const Posts = () => {
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [twitterFeed, setTwitterFeed] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await posts.getPosts(50, true);
      
      let postsData = [];
      if (response.data && response.data.posts) {
        postsData = response.data.posts;
      } else if (Array.isArray(response.data)) {
        postsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        postsData = [response.data];
      }
      
      const processedPosts = postsData.map(post => ({
        ...post,
        detectedPlatforms: detectPlatforms(post)
      }));
      
      setUserPosts(processedPosts);
      setTwitterFeed(response.data?.twitter_feed || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId, deleteFromSocial = true) => {
    if (!window.confirm(
      `Delete this post?\n\nThis will remove it from the database${deleteFromSocial ? ' AND from social media platforms.' : '.'}`
    )) {
      return;
    }

    setDeleting(postId);
    try {
      const response = await posts.deletePost(postId, deleteFromSocial);
      
      if (response.data.success) {
        toast.success('Post deleted from database');
        
        if (response.data.social_results && deleteFromSocial) {
          const socialResults = response.data.social_results;
          const successes = Object.values(socialResults).filter(r => r.success === true).length;
          const failures = Object.values(socialResults).filter(r => r.success === false).length;
          
          if (failures > 0 && successes > 0) {
            const failedPlatforms = Object.entries(socialResults)
              .filter(([_, r]) => r.success === false)
              .map(([platform]) => platform);
            toast.warning(`Deleted from ${successes} platform(s), but failed on: ${failedPlatforms.join(', ')}`);
          } else if (failures > 0 && successes === 0) {
            toast.warning('Post deleted from database, but could not delete from social media');
          }
        }
        
        setUserPosts(prev => prev.filter(p => p.id !== postId));
        setSelectedPosts(prev => prev.filter(id => id !== postId));
      } else {
        toast.error(response.data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  // FIXED: Batch delete - handle it individually since batch endpoint might not exist
  const handleBatchDelete = async () => {
    if (selectedPosts.length === 0) {
      toast.error('Please select at least one post');
      return;
    }

    if (!window.confirm(
      `Delete ${selectedPosts.length} selected posts?\n\nThis will remove them from the database AND from social media platforms.`
    )) {
      return;
    }

    let deleted = 0;
    let failed = 0;

    for (const postId of selectedPosts) {
      try {
        await posts.deletePost(postId, true);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete post ${postId}:`, error);
        failed++;
      }
    }

    if (deleted > 0) {
      toast.success(`${deleted} posts deleted successfully${failed > 0 ? `, ${failed} failed` : ''}`);
      setUserPosts(prev => prev.filter(p => !selectedPosts.includes(p.id)));
      setSelectedPosts([]);
      setDeleteMode(false);
    } else {
      toast.error('Failed to delete posts');
    }
  };

  const togglePostSelection = (postId) => {
    setSelectedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { icon: <FaCheckCircle />, text: 'Success', color: 'text-green-600 bg-green-50' },
      partial: { icon: <FaExclamationTriangle />, text: 'Partial', color: 'text-amber-600 bg-amber-50' },
      failed: { icon: <FaExclamationTriangle />, text: 'Failed', color: 'text-red-600 bg-red-50' },
      processing: { icon: <FaSpinner className="animate-spin" />, text: 'Processing', color: 'text-[#168eea] bg-[#168eea]/10' },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => <PostCardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              View and manage your published content · {userPosts.length} total
            </p>
          </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setDeleteMode(!deleteMode);
                  setSelectedPosts([]);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  deleteMode
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {deleteMode ? 'Cancel Selection' : 'Select Posts'}
              </button>
              
              {deleteMode && selectedPosts.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <FaTrashAlt size={14} />
                  Delete Selected ({selectedPosts.length})
                </button>
              )}
            </div>
        </div>

        {/* Platform Filter */}
        {userPosts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaFilter className="text-[#168eea]" size={14} />
              <span className="text-sm font-medium text-gray-600">Filter by platform:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filter === 'all' 
                    ? 'bg-[#168eea] text-white shadow-sm' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
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
                        ? 'bg-[#168eea] text-white shadow-sm' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
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
        {twitterFeed.length > 0 && (
          <div className="mb-6 bg-white rounded-xl border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Recent tweets from X</h2>
            <div className="space-y-2 max-h-64 overflow-auto">
              {twitterFeed.map((tweet) => (
                <a
                  key={tweet.id}
                  href={tweet.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 rounded-lg border border-gray-100 hover:border-[#168eea]/30 hover:bg-[#168eea]/5 transition-colors"
                >
                  <p className="text-sm text-gray-700 line-clamp-3">{tweet.text}</p>
                  <div className="mt-2 text-xs text-gray-400 flex gap-3">
                    <span>❤ {tweet.likes}</span>
                    <span>↺ {tweet.retweets}</span>
                    <span>💬 {tweet.replies}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
        {filteredPosts.length === 0 ? (
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
              const postLinks = getPlatformPostLinks(post);
              const isSelected = selectedPosts.includes(post.id);
              const isDeleting = deleting === post.id;
              
              return (
                <div
                  key={post.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 ${
                    isSelected
                      ? 'border-[#168eea] bg-[#168eea]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  {/* Selection Checkbox (when in delete mode) */}
                  {deleteMode && (
                    <div className="p-3 pb-0">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePostSelection(post.id)}
                          className="w-4 h-4 text-[#168eea] rounded border-gray-300 focus:ring-[#168eea]"
                        />
                        <span className="text-sm text-gray-600">Select for deletion</span>
                      </label>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(post.status)}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/posts/${post.id}`);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#168eea] transition-colors rounded-lg hover:bg-[#168eea]/10"
                          title="View details"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(post.id, true);
                          }}
                          disabled={isDeleting}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-50"
                          title="Delete from database and social media"
                        >
                          {isDeleting ? (
                            <FaSpinner className="animate-spin" size={14} />
                          ) : (
                            <FaTrash size={14} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(post.id, false);
                          }}
                          disabled={isDeleting}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50"
                          title="Delete from database only"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                      <FaCalendar size={12} />
                      {new Date(post.created_at || post.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="px-4 pb-2 min-h-20">
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
                    {postLinks.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {postLinks.map((link, idx) =>
                          link.url ? (
                            <a
                              key={`${link.platform}-${idx}`}
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#168eea] hover:underline"
                            >
                              {link.label}
                            </a>
                          ) : (
                            <span
                              key={`${link.platform}-${idx}`}
                              className="text-xs text-gray-400"
                            >
                              {link.label}: {link.id}
                            </span>
                          )
                        )}
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

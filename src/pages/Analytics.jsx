import React, { useState, useEffect } from 'react';
import { analytics, posts } from '../services/api';
import { 
  FiTrendingUp, FiUsers, FiHeart, FiMessageCircle, FiShare2, 
  FiEye, FiBarChart2, FiCalendar, FiRefreshCw, FiYoutube, 
  FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiArrowUp,
  FiArrowDown, FiMinus, FiActivity
} from 'react-icons/fi';
import { FaYoutube, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Skeleton Components
const StatCardSkeleton = () => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between mb-2">
      <div className="w-6 h-6 bg-gray-200 rounded"></div>
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-20 mb-1"></div>
    <div className="h-4 bg-gray-200 rounded w-16"></div>
  </div>
);

const PlatformBreakdownSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
    <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="h-5 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j}>
                <div className="h-3 bg-gray-200 rounded w-10"></div>
                <div className="h-5 bg-gray-200 rounded w-16 mt-1"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RecentPostsSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
    <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="flex gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
              <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentPosts, setRecentPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postAnalytics, setPostAnalytics] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const postsRes = await posts.getPosts(10);
      setRecentPosts(postsRes.data.posts);
      
      let totalReach = 0;
      let totalImpressions = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let totalShares = 0;
      const platformStats = {};
      
      for (const post of postsRes.data.posts) {
        try {
          const analyticsRes = await analytics.getPostAnalytics(post.id);
          const postData = analyticsRes.data;
          
          if (postData && postData.analytics) {
            for (const analytic of postData.analytics) {
              totalReach += analytic.reach || 0;
              totalImpressions += analytic.impressions || 0;
              totalLikes += analytic.likes || 0;
              totalComments += analytic.comments || 0;
              totalShares += analytic.shares || 0;
              
              if (!platformStats[analytic.platform]) {
                platformStats[analytic.platform] = {
                  reach: 0,
                  impressions: 0,
                  likes: 0,
                  comments: 0,
                  shares: 0,
                  posts: 0
                };
              }
              platformStats[analytic.platform].reach += analytic.reach || 0;
              platformStats[analytic.platform].impressions += analytic.impressions || 0;
              platformStats[analytic.platform].likes += analytic.likes || 0;
              platformStats[analytic.platform].comments += analytic.comments || 0;
              platformStats[analytic.platform].shares += analytic.shares || 0;
              platformStats[analytic.platform].posts += 1;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch analytics for post ${post.id}:`, err);
        }
      }
      
      setSummary({
        total_reach: totalReach,
        total_impressions: totalImpressions,
        total_likes: totalLikes,
        total_comments: totalComments,
        total_shares: totalShares,
        total_posts: postsRes.data.posts.length,
        platform_stats: platformStats
      });
      
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed');
  };

  const viewPostAnalytics = async (postId) => {
    try {
      setSelectedPost(postId);
      const response = await analytics.getPostAnalytics(postId);
      setPostAnalytics(response.data);
      const post = recentPosts.find(p => p.id === postId);
      if (post) {
        toast.success(`Analytics loaded for post #${postId}`);
      }
    } catch (error) {
      console.error('Failed to fetch post analytics:', error);
      toast.error('Failed to load post analytics');
    }
  };

  const platformIcons = {
    youtube: <FaYoutube className="text-red-500" size={20} />,
    facebook: <FaFacebook className="text-blue-600" size={20} />,
    instagram: <FaInstagram className="text-pink-600" size={20} />,
    twitter: <FaTwitter className="text-sky-500" size={20} />,
    linkedin: <FaLinkedin className="text-blue-700" size={20} />
  };

  const statCards = [
    { icon: FiTrendingUp, label: 'Total Reach', value: summary?.total_reach || 0, color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: FiEye, label: 'Impressions', value: summary?.total_impressions || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: FiHeart, label: 'Total Likes', value: summary?.total_likes || 0, color: 'text-pink-500', bg: 'bg-pink-50' },
    { icon: FiMessageCircle, label: 'Comments', value: summary?.total_comments || 0, color: 'text-green-500', bg: 'bg-green-50' },
    { icon: FiShare2, label: 'Shares', value: summary?.total_shares || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  const getTotalEngagement = () => {
    if (!summary) return 0;
    return (summary.total_likes || 0) + (summary.total_comments || 0) + (summary.total_shares || 0);
  };

  const getAverageEngagement = () => {
    if (!summary || summary.total_posts === 0) return 0;
    return Math.round(getTotalEngagement() / summary.total_posts);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <div>
              <div className="h-9 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-64 mt-1 animate-pulse"></div>
            </div>
            <div className="h-11 bg-gray-200 rounded-xl w-32 animate-pulse mt-4 sm:mt-0"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
          <PlatformBreakdownSkeleton />
          <RecentPostsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <FiBarChart2 className="text-pink-600" size={28} />
              Analytics
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="text-sm">Track your social media performance across all platforms</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {summary?.total_posts || 0} posts
              </span>
            </p>
          </div>
          <button
            onClick={refreshAnalytics}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink-300/50 disabled:opacity-50 mt-4 sm:mt-0"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {statCards.map((stat, idx) => (
            <div key={idx} className={`${stat.bg} rounded-xl p-4 border border-gray-100 shadow-sm transition-all hover:shadow-md`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={stat.color} size={22} />
                <span className="text-xs text-gray-400">All time</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stat.value.toLocaleString()}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FiBarChart2 className="text-pink-600" size={18} />
              <h3 className="text-gray-700 font-medium">Total Engagement</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{getTotalEngagement().toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Likes + Comments + Shares</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FiTrendingUp className="text-green-500" size={18} />
              <h3 className="text-gray-700 font-medium">Avg. per Post</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{getAverageEngagement().toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-1">Average engagement per post</p>
          </div>
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <FiCalendar className="text-purple-500" size={18} />
              <h3 className="text-gray-700 font-medium">Total Posts</h3>
            </div>
            <p className="text-2xl font-bold text-gray-800">{summary?.total_posts || 0}</p>
            <p className="text-xs text-gray-400 mt-1">Published across all platforms</p>
          </div>
        </div>

        {/* Platform Breakdown */}
        {summary?.platform_stats && Object.keys(summary.platform_stats).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <FiActivity className="text-pink-600" size={18} />
              Platform Breakdown
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summary.platform_stats).map(([platform, stats]) => (
                <div key={platform} className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-pink-200 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      {platformIcons[platform]}
                    </div>
                    <span className="text-gray-800 font-medium capitalize">{platform}</span>
                    <span className="text-xs text-gray-400 ml-auto">{stats.posts} post{stats.posts !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400 text-xs">Reach</p>
                      <p className="text-gray-800 font-semibold">{stats.reach.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Impressions</p>
                      <p className="text-gray-800 font-semibold">{stats.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Likes</p>
                      <p className="text-gray-800 font-semibold">{stats.likes.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Comments</p>
                      <p className="text-gray-800 font-semibold">{stats.comments.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FiCalendar className="text-pink-600" size={18} />
            Recent Posts
          </h2>
          {recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No posts yet. Start publishing to see analytics!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-all cursor-pointer border border-gray-100 hover:border-pink-200"
                  onClick={() => viewPostAnalytics(post.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-gray-700 text-sm line-clamp-2">{post.content?.substring(0, 150) || 'No content'}...</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <FiCalendar size={12} />
                          {new Date(post.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {post.platforms?.map((platform) => (
                            <span key={platform} className="text-xs text-gray-500">
                              {platformIcons[platform]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        post.status === 'completed' ? 'bg-green-50 text-green-600' :
                        post.status === 'partial' ? 'bg-amber-50 text-amber-600' :
                        post.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-pink-50 text-pink-600'
                      }`}>
                        {post.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewPostAnalytics(post.id);
                        }}
                        className="text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors px-3 py-1 rounded-lg hover:bg-pink-50"
                      >
                        View Stats
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Post Analytics Modal */}
        {postAnalytics && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setPostAnalytics(null)}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FiBarChart2 className="text-pink-600" size={20} />
                  Post Analytics
                </h3>
                <button onClick={() => setPostAnalytics(null)} className="text-gray-400 hover:text-gray-600 transition-colors text-2xl w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">✕</button>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-gray-700 text-sm leading-relaxed">{postAnalytics.content || 'No content'}</p>
                </div>
                {postAnalytics.analytics && postAnalytics.analytics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {postAnalytics.analytics.map((analytic, idx) => {
                      const config = {
                        icon: platformIcons[analytic.platform],
                        color: analytic.platform === 'instagram' ? 'text-pink-600' : 
                               analytic.platform === 'youtube' ? 'text-red-600' :
                               analytic.platform === 'facebook' ? 'text-blue-600' :
                               analytic.platform === 'twitter' ? 'text-sky-500' :
                               'text-blue-700'
                      };
                      return (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-pink-200 transition-all">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                              {config.icon}
                            </div>
                            <span className={`font-medium capitalize ${config.color}`}>{analytic.platform}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-400 text-xs">Reach</p>
                              <p className="text-gray-800 font-semibold">{analytic.reach || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Impressions</p>
                              <p className="text-gray-800 font-semibold">{analytic.impressions || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Likes</p>
                              <p className="text-gray-800 font-semibold">{analytic.likes || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs">Comments</p>
                              <p className="text-gray-800 font-semibold">{analytic.comments || 0}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-400 text-xs">Shares</p>
                              <p className="text-gray-800 font-semibold">{analytic.shares || 0}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📊</div>
                    <p className="text-gray-400">No analytics data available for this post yet.</p>
                    <p className="text-gray-500 text-sm mt-1">Check back after your post has gained some engagement.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
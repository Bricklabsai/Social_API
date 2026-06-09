import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { analytics, posts } from '../services/api';
import { FiTrendingUp, FiUsers, FiHeart, FiMessageCircle, FiShare2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentPosts, setRecentPosts] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, postsRes] = await Promise.all([
        analytics.getSummary(),
        posts.getPosts(5)
      ]);
      setSummary(summaryRes.data);
      setRecentPosts(postsRes.data.posts);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Analytics data temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: FiTrendingUp, label: 'Total Reach', value: summary?.total_reach || '—', color: 'text-blue-600' },
    { icon: FiUsers, label: 'Impressions', value: summary?.total_impressions || '—', color: 'text-purple-600' },
    { icon: FiHeart, label: 'Likes', value: summary?.total_likes || '—', color: 'text-pink-600' },
    { icon: FiMessageCircle, label: 'Comments', value: summary?.total_comments || '—', color: 'text-green-600' },
    { icon: FiShare2, label: 'Shares', value: summary?.total_shares || '—', color: 'text-orange-600' },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-white/70 mt-1">Track your social media performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((stat, idx) => (
            <div key={idx} className="glass-card p-4 text-center">
              <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
              <p className="text-2xl font-bold text-dark">{stat.value}</p>
              <p className="text-sm text-secondary">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Placeholder for charts */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Performance Overview</h2>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-secondary">Analytics charts will appear here once you have more data</p>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-dark mb-4">Recent Posts</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : recentPosts.length === 0 ? (
            <p className="text-secondary text-center py-8">No posts yet. Start publishing to see analytics!</p>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-dark text-sm truncate">{post.content.substring(0, 100)}...</p>
                    <p className="text-xs text-secondary mt-1">{new Date(post.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondary">Platforms: {post.platforms.join(', ')}</p>
                    <p className={`text-xs font-medium ${
                      post.status === 'completed' ? 'text-green-600' : 
                      post.status === 'partial' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {post.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
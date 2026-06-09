import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { posts } from '../services/api';
import { FiCalendar, FiEye, FiTrash2, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Posts = () => {
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

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Posts</h1>
          <p className="text-white/70 mt-1">View and manage your published content</p>
        </div>

        <div className="glass-card p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : userPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-secondary">No posts yet. Create your first post from the Dashboard!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          post.status === 'completed' ? 'bg-green-100 text-green-700' :
                          post.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {post.status}
                        </span>
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <FiCalendar size={12} />
                          {new Date(post.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-dark mb-2">{post.content.substring(0, 200)}{post.content.length > 200 ? '...' : ''}</p>
                      <div className="flex flex-wrap gap-2">
                        {post.platforms.map((platform) => (
                          <span key={platform} className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => copyToClipboard(post.content)}
                        className="p-2 text-secondary hover:text-primary transition-colors"
                        title="Copy content"
                      >
                        <FiCopy size={18} />
                      </button>
                      <button
                        onClick={() => window.open(`/api/v1/publish/posts/${post.id}`, '_blank')}
                        className="p-2 text-secondary hover:text-primary transition-colors"
                        title="View details"
                      >
                        <FiEye size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-secondary hover:text-danger transition-colors"
                        title="Delete record"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
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

export default Posts;
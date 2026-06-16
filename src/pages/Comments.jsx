import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { comments } from '../services/api';
import { 
  FaFacebook, FaYoutube, FaInstagram, FaTwitter, FaLinkedin,
  FaComment, FaReply, FaHeart, FaUser, FaClock, FaSpinner,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { FiSend, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const platformIcons = {
  facebook: <FaFacebook className="text-blue-600" size={20} />,
  instagram: <FaInstagram className="text-pink-600" size={20} />,
  twitter: <FaTwitter className="text-sky-500" size={20} />,
  linkedin: <FaLinkedin className="text-blue-700" size={20} />,
  youtube: <FaYoutube className="text-red-600" size={20} />,
};

const Comments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await comments.getInbox();
      setComments(response.data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComments();
    setRefreshing(false);
    toast.success('Comments refreshed');
  };

  const handleReply = async (comment) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSendingReply(true);
    try {
      const response = await comments.replyToComment(
        comment.platform,
        comment.id,
        replyText.trim()
      );
      
      if (response.data.success) {
        toast.success('Reply sent successfully!');
        setReplyingTo(null);
        setReplyText('');
        // Refresh comments to show the reply
        await fetchComments();
      } else {
        toast.error(response.data.detail || 'Failed to send reply');
      }
    } catch (error) {
      console.error('Reply error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <FaSpinner className="animate-spin text-blue-400 text-4xl mb-4" />
          <p className="text-gray-400">Loading your comments...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Comments & Inbox</h1>
            <p className="text-gray-400 mt-1">Manage and reply to comments from all platforms</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Total Comments</p>
            <p className="text-2xl font-bold text-white">{comments.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Platforms</p>
            <div className="flex gap-2 mt-1">
              {[...new Set(comments.map(c => c.platform))].map(platform => (
                <span key={platform} className="text-white">{platformIcons[platform]}</span>
              ))}
              {comments.length === 0 && <span className="text-gray-500">None</span>}
            </div>
          </div>
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Pending Replies</p>
            <p className="text-2xl font-bold text-white">
              {comments.filter(c => c.can_reply !== false).length}
            </p>
          </div>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <div className="text-gray-500 text-6xl mb-4">💬</div>
            <p className="text-gray-400">No comments yet. Comments from your posts will appear here.</p>
            <p className="text-gray-500 text-sm mt-2">Try posting content and engaging with your audience!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={index} className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
                {/* Comment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                      <FaUser className="text-gray-400" size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{comment.author || 'Unknown User'}</span>
                        <span className="text-xs text-gray-500">{comment.platform && platformIcons[comment.platform]}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FaClock size={12} />
                          {formatDate(comment.created_at)}
                        </span>
                        {comment.like_count > 0 && (
                          <span className="flex items-center gap-1">
                            <FaHeart size={12} className="text-red-400" />
                            {comment.like_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {comment.can_reply !== false && (
                      <button
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                      >
                        <FaReply size={12} />
                        Reply
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Text */}
                <div className="mt-3 ml-14">
                  <p className="text-gray-300">{comment.text || 'No text'}</p>
                  {comment.post_content && (
                    <p className="text-xs text-gray-500 mt-1">
                      On post: {comment.post_content}
                    </p>
                  )}
                </div>

                {/* Reply Input (expanded) */}
                {replyingTo === comment.id && (
                  <div className="mt-4 ml-14">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(comment);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleReply(comment)}
                        disabled={sendingReply || !replyText.trim()}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {sendingReply ? <FaSpinner className="animate-spin" /> : <FiSend size={16} />}
                        Send
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Comments;
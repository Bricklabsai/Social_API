import React, { useState, useEffect } from 'react';
import { comments } from '../services/api';
import { 
  FaFacebook, FaYoutube, FaInstagram, FaTwitter, FaLinkedin,
  FaComment, FaReply, FaHeart, FaUser, FaClock, FaSpinner,
  FaCheckCircle, FaExclamationTriangle, FaFilter, FaHashtag,
  FaCalendarAlt, FaChartLine, FaCheckDouble
} from 'react-icons/fa';
import { FiSend, FiRefreshCw, FiMessageSquare, FiUsers } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Skeleton Components
const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
    <div className="flex items-center gap-2 text-gray-400 text-sm">
      <div className="w-4 h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-12 mt-1"></div>
  </div>
);

const CommentSkeleton = () => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div>
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="mt-3 ml-14">
      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  </div>
);

const Comments = () => {
  const [commentList, setCommentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [filterType, setFilterType] = useState('all'); // all, pending, replied

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await comments.getInbox(50);
      let commentData = response.data;
      if (commentData && typeof commentData === 'object' && !Array.isArray(commentData)) {
        commentData = commentData.comments || commentData.data || [];
      }
      setCommentList(commentData);
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
        // Update the comment locally to show it's been replied
        const updatedList = commentList.map(c => {
          if (c.id === comment.id && c.platform === comment.platform) {
            return {
              ...c,
              is_replied: true,
              reply_text: replyText.trim(),
              replied_at: new Date().toISOString()
            };
          }
          return c;
        });
        setCommentList(updatedList);
        await fetchComments(); // Refresh to get latest from DB
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
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const platformIcons = {
    facebook: <FaFacebook className="text-blue-600" size={18} />,
    instagram: <FaInstagram className="text-pink-600" size={18} />,
    twitter: <FaTwitter className="text-sky-500" size={18} />,
    linkedin: <FaLinkedin className="text-blue-700" size={18} />,
    youtube: <FaYoutube className="text-red-600" size={18} />,
  };

  const platformColors = {
    facebook: 'border-blue-200 bg-blue-50 hover:border-blue-300',
    instagram: 'border-pink-200 bg-pink-50 hover:border-pink-300',
    twitter: 'border-sky-200 bg-sky-50 hover:border-sky-300',
    linkedin: 'border-blue-200 bg-blue-50 hover:border-blue-300',
    youtube: 'border-red-200 bg-red-50 hover:border-red-300',
  };

  const platformBadgeColors = {
    facebook: 'bg-blue-100 text-blue-700',
    instagram: 'bg-pink-100 text-pink-700',
    twitter: 'bg-sky-100 text-sky-700',
    linkedin: 'bg-blue-100 text-blue-700',
    youtube: 'bg-red-100 text-red-700',
  };

  // Apply filters
  const filteredByPlatform = selectedPlatform === 'all' 
    ? commentList 
    : commentList.filter(c => c.platform === selectedPlatform);
  
  let filteredComments = filteredByPlatform;
  
  if (filterType === 'pending') {
    filteredComments = filteredByPlatform.filter(c => !c.is_replied && c.can_reply !== false);
  } else if (filterType === 'replied') {
    filteredComments = filteredByPlatform.filter(c => c.is_replied);
  }

  const platformStats = commentList.reduce((acc, c) => {
    acc[c.platform] = (acc[c.platform] || 0) + 1;
    return acc;
  }, {});

  const pendingCount = commentList.filter(c => !c.is_replied && c.can_reply !== false).length;
  const repliedCount = commentList.filter(c => c.is_replied).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <div>
              <div className="h-9 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-72 animate-pulse mt-1"></div>
            </div>
            <div className="h-11 bg-gray-200 rounded-xl w-32 animate-pulse mt-4 sm:mt-0"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => <StatsCardSkeleton key={i} />)}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded-xl w-24 animate-pulse"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <CommentSkeleton key={i} />)}
          </div>
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
              <FiMessageSquare className="text-pink-600" size={28} />
              Comments & Inbox
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <span className="text-sm">Manage and reply to comments from all platforms</span>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {commentList.length} total
              </span>
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink-300/50 disabled:opacity-50 mt-4 sm:mt-0"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <FiMessageSquare size={16} />
              <span>Total Comments</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{commentList.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <FiUsers size={16} />
              <span>Platforms</span>
            </div>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {[...new Set(commentList.map(c => c.platform))].map(platform => (
                <span key={platform} className="text-base">{platformIcons[platform]}</span>
              ))}
              {commentList.length === 0 && <span className="text-gray-400 text-sm">None</span>}
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <FaReply size={16} />
              <span>Pending</span>
            </div>
            <p className="text-2xl font-bold text-amber-500 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <FaCheckDouble size={16} />
              <span>Replied</span>
            </div>
            <p className="text-2xl font-bold text-green-500 mt-1">{repliedCount}</p>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedPlatform('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              selectedPlatform === 'all'
                ? 'bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white shadow-md shadow-pink-300/50'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            All ({commentList.length})
          </button>
          {Object.entries(platformStats).map(([platform, count]) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedPlatform === platform
                  ? 'bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white shadow-md shadow-pink-300/50'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {platformIcons[platform]}
              {platform.charAt(0).toUpperCase() + platform.slice(1)} ({count})
            </button>
          ))}
        </div>

        {/* Reply Status Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterType === 'all'
                ? 'bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white shadow-md shadow-pink-300/50'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Comments
          </button>
          <button
            onClick={() => setFilterType('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterType === 'pending'
                ? 'bg-linear-to-r from-amber-500 via-amber-400 to-orange-500 text-white shadow-md shadow-amber-300/50'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaReply className="inline mr-1.5" size={12} />
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilterType('replied')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterType === 'replied'
                ? 'bg-linear-to-r from-green-500 via-green-400 to-emerald-500 text-white shadow-md shadow-green-300/50'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FaCheckDouble className="inline mr-1.5" size={12} />
            Replied ({repliedCount})
          </button>
        </div>

        {/* Comments List */}
        {filteredComments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {filterType === 'pending' ? 'No pending comments' : 
               filterType === 'replied' ? 'No replied comments yet' : 
               'No comments yet'}
            </h3>
            <p className="text-gray-400">
              {filterType === 'pending' ? 'You\'ve replied to all your comments! 🎉' :
               filterType === 'replied' ? 'Reply to comments to see them here' :
               'Comments from your posts will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComments.map((comment, index) => {
              const isReplied = comment.is_replied || false;
              const canReply = comment.can_reply !== false && !isReplied;
              
              return (
                <div
                  key={`${comment.id}-${index}`}
                  className={`bg-white rounded-xl p-5 border ${isReplied ? 'border-green-200 bg-green-50/30' : platformColors[comment.platform] || 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300`}
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        platformBadgeColors[comment.platform] || 'bg-gray-100 text-gray-600'
                      }`}>
                        <FaUser size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-800 font-medium">{comment.author || 'Unknown User'}</span>
                          <span className="text-xs">{platformIcons[comment.platform]}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${platformBadgeColors[comment.platform] || 'bg-gray-100 text-gray-600'}`}>
                            {comment.platform}
                          </span>
                          {isReplied && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                              <FaCheckDouble size={10} />
                              Replied
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <FaClock size={12} />
                            {formatDate(comment.created_at)}
                          </span>
                          {comment.like_count > 0 && (
                            <span className="flex items-center gap-1">
                              <FaHeart size={12} className="text-pink-400" />
                              {comment.like_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canReply && (
                        <button
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 ${
                            replyingTo === comment.id
                              ? 'bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white shadow-md shadow-pink-300/50'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <FaReply size={12} />
                          Reply
                        </button>
                      )}
                      {isReplied && comment.reply_text && (
                        <span className="text-xs text-green-600 px-2 py-1 bg-green-50 rounded-lg">
                          Replied: {comment.reply_text.substring(0, 30)}...
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment Text */}
                  <div className="mt-3 ml-14">
                    <p className="text-gray-700 leading-relaxed">{comment.text || 'No text'}</p>
                    {comment.post_content && (
                      <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                        <FaHashtag size={10} />
                        On post: {comment.post_content}
                      </p>
                    )}
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 ml-14">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Reply to ${comment.author || 'user'}...`}
                          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleReply(comment);
                            }
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReply(comment)}
                            disabled={sendingReply || !replyText.trim()}
                            className="px-5 py-2.5 bg-linear-to-r from-pink-600 via-pink-500 to-blue-600 text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-pink-300/50 disabled:opacity-50 flex items-center gap-2"
                          >
                            {sendingReply ? <FaSpinner className="animate-spin" /> : <FiSend size={16} />}
                            Send
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comments;
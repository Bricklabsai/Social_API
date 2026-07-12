import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { comments, assistant } from '../services/api';
import {
  FaFacebook, FaYoutube, FaInstagram, FaTwitter, FaLinkedin,
  FaReply, FaHeart, FaUser, FaClock, FaSpinner, FaHashtag, FaCheckDouble
} from 'react-icons/fa';
import { FiSend, FiRefreshCw, FiMessageSquare, FiUsers, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';

const POLL_INTERVAL_MS = 15000;

const StatsCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-24" />
    <div className="h-8 bg-gray-200 rounded w-12 mt-2" />
  </div>
);

const CommentSkeleton = () => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-40 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-24" />
      </div>
    </div>
    <div className="mt-3 ml-14 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
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
  const [filterType, setFilterType] = useState('all');
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const initialLoadDone = useRef(false);

  const fetchCommentPlatforms = useCallback(async () => {
    try {
      const response = await comments.getPlatforms();
      setConnectedPlatforms(response.data?.platforms || []);
    } catch (error) {
      console.error('Failed to fetch comment platforms:', error);
    }
  }, []);

  const fetchComments = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent && !initialLoadDone.current) setLoading(true);
      const response = await comments.getFilteredInbox('all', null, 100);
      setCommentList(response.data?.comments || []);
      initialLoadDone.current = true;
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      if (!silent) toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommentPlatforms();
    fetchComments();
  }, [fetchCommentPlatforms, fetchComments]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchComments({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchComments]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchComments({ silent: true });
    setRefreshing(false);
    toast.success('Comments refreshed');
  };

  const handleSuggestReplies = async (comment) => {
    setLoadingAi(true);
    setAiSuggestions([]);
    try {
      const response = await assistant.generate({
        action: 'reply',
        content: comment.text || '',
        topic: comment.author || '',
      });
      setAiSuggestions(response.data?.suggestions || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate reply suggestions');
    } finally {
      setLoadingAi(false);
    }
  };

  const openReply = (comment) => {
    const key = `${comment.platform}-${comment.id}`;
    if (replyingTo === key) {
      setReplyingTo(null);
      setReplyText('');
      setAiSuggestions([]);
      return;
    }
    setReplyingTo(key);
    setReplyText('');
    setAiSuggestions([]);
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
        setAiSuggestions([]);
        setCommentList((prev) =>
          prev.map((c) =>
            c.id === comment.id && c.platform === comment.platform
              ? {
                  ...c,
                  is_replied: true,
                  reply_text: replyText.trim(),
                  replied_at: new Date().toISOString(),
                }
              : c
          )
        );
      } else {
        toast.error(response.data.detail || 'Failed to send reply');
      }
    } catch (error) {
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

  const platformStats = useMemo(
    () =>
      commentList.reduce((acc, c) => {
        acc[c.platform] = (acc[c.platform] || 0) + 1;
        return acc;
      }, {}),
    [commentList]
  );

  const pendingCount = useMemo(
    () => commentList.filter((c) => !c.is_replied && c.can_reply !== false).length,
    [commentList]
  );
  const repliedCount = useMemo(
    () => commentList.filter((c) => c.is_replied).length,
    [commentList]
  );

  const filteredComments = useMemo(() => {
    return commentList.filter((c) => {
      if (selectedPlatform !== 'all' && c.platform !== selectedPlatform) return false;
      if (filterType === 'pending') return !c.is_replied && c.can_reply !== false;
      if (filterType === 'replied') return !!c.is_replied;
      return true;
    });
  }, [commentList, selectedPlatform, filterType]);

  const platformTabs = connectedPlatforms.length
    ? connectedPlatforms.map((p) => p.platform)
    : Object.keys(platformStats);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-9 bg-gray-200 rounded w-48 animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FiMessageSquare className="text-[#168eea]" size={24} />
            Comments
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Live inbox · updates every {POLL_INTERVAL_MS / 1000}s · {commentList.length} total
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-lg font-medium transition-colors disabled:opacity-50 mt-4 sm:mt-0 text-sm"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FiMessageSquare size={16} />
            <span>Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-1">{commentList.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <FiUsers size={16} />
            <span>Platforms</span>
          </div>
          <div className="flex gap-1.5 mt-1 flex-wrap">
            {[...new Set(commentList.map((c) => c.platform))].map((platform) => (
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

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedPlatform('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedPlatform === 'all'
              ? 'bg-[#168eea] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
          }`}
        >
          All ({commentList.length})
        </button>
        {platformTabs.map((platform) => (
          <button
            key={platform}
            onClick={() => setSelectedPlatform(platform)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedPlatform === platform
                ? 'bg-[#168eea] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
            }`}
          >
            {platformIcons[platform]}
            {platform.charAt(0).toUpperCase() + platform.slice(1)} ({platformStats[platform] || 0})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: 'All Comments' },
          { id: 'pending', label: `Pending (${pendingCount})`, icon: FaReply },
          { id: 'replied', label: `Replied (${repliedCount})`, icon: FaCheckDouble },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = filterType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? tab.id === 'pending'
                    ? 'bg-amber-500 text-white'
                    : tab.id === 'replied'
                      ? 'bg-green-500 text-white'
                      : 'bg-[#168eea] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {Icon ? <Icon className="inline mr-1.5" size={12} /> : null}
              {tab.label}
            </button>
          );
        })}
      </div>

      {filteredComments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {filterType === 'pending'
              ? 'No pending comments'
              : filterType === 'replied'
                ? 'No replied comments yet'
                : 'No comments yet'}
          </h3>
          <p className="text-gray-400">
            {filterType === 'pending'
              ? "You're all caught up."
              : filterType === 'replied'
                ? 'Reply to comments to see them here'
                : 'Comments from your posts will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment, index) => {
            const replyKey = `${comment.platform}-${comment.id}`;
            const isReplied = comment.is_replied || false;
            const canReply = comment.can_reply !== false && !isReplied;
            const isOpen = replyingTo === replyKey;

            return (
              <div
                key={`${replyKey}-${index}`}
                className={`bg-white rounded-xl p-5 border ${
                  isReplied
                    ? 'border-green-200 bg-green-50/30'
                    : platformColors[comment.platform] || 'border-gray-100'
                } shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        platformBadgeColors[comment.platform] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <FaUser size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-800 font-medium">
                          {comment.author || 'Unknown User'}
                        </span>
                        <span className="text-xs">{platformIcons[comment.platform]}</span>
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
                  {canReply && (
                    <button
                      onClick={() => openReply(comment)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                        isOpen
                          ? 'bg-[#168eea] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <FaReply size={12} />
                      Reply
                    </button>
                  )}
                </div>

                <div className="mt-3 ml-14">
                  <p className="text-gray-700 leading-relaxed">{comment.text || 'No text'}</p>
                  {comment.post_content && (
                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                      <FaHashtag size={10} />
                      On post: {comment.post_content}
                    </p>
                  )}
                  {isReplied && comment.reply_text && (
                    <p className="text-sm text-green-700 mt-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      Your reply: {comment.reply_text}
                    </p>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-4 ml-14 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleSuggestReplies(comment)}
                        disabled={loadingAi}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[#168eea]/30 text-[#168eea] hover:bg-[#168eea]/10 disabled:opacity-50"
                      >
                        {loadingAi ? <FaSpinner className="animate-spin" /> : <FiZap size={14} />}
                        Suggest replies
                      </button>
                    </div>

                    {aiSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          AI suggestions
                        </p>
                        {aiSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setReplyText(suggestion)}
                            className="w-full text-left text-sm px-3 py-2 rounded-lg border border-gray-100 bg-[#f8f9fb] hover:border-[#168eea]/40 hover:bg-[#168eea]/5 text-gray-700 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.author || 'user'}...`}
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 focus:border-transparent"
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
                          className="px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {sendingReply ? <FaSpinner className="animate-spin" /> : <FiSend size={16} />}
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                            setAiSuggestions([]);
                          }}
                          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl"
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
  );
};

export default Comments;

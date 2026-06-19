import React, { useState, useEffect } from 'react';
import { 
  FaTwitter, FaInstagram, FaFacebook, FaWhatsapp,
  FaEnvelope, FaUser, FaClock, FaSpinner, FaSearch,
  FaInbox, FaPaperPlane, FaCheckCircle, FaReply
} from 'react-icons/fa';
import { FiRefreshCw, FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { messages } from '../services/api';

const Messages = () => {
  const [messageList, setMessageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [platforms, setPlatforms] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchPlatforms();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await messages.getMessages(selectedPlatform);
      setMessageList(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await messages.getPlatforms();
      setPlatforms(response.data.platforms || []);
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages();
    setRefreshing(false);
    toast.success('Messages refreshed');
  };

  const handlePlatformFilter = (platform) => {
    setSelectedPlatform(platform);
    fetchMessages();
  };

  const handleReply = async (msg) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setSendingReply(true);
    try {
      const response = await messages.replyToMessage(
        msg.platform,
        replyText.trim(),
        msg.sender_id || msg.id  // Use sender_id or message_id as recipient
      );
      
      if (response.data.success) {
        toast.success('Reply sent successfully!');
        setReplyingTo(null);
        setReplyText('');
        await fetchMessages();
      } else {
        toast.error(response.data.error || 'Failed to send reply');
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
    return date.toLocaleDateString();
  };

  const platformIcons = {
    twitter: <FaTwitter className="text-sky-500" size={18} />,
    instagram: <FaInstagram className="text-pink-600" size={18} />,
    facebook: <FaFacebook className="text-blue-600" size={18} />,
    whatsapp: <FaWhatsapp className="text-green-500" size={18} />,
  };

  const platformColors = {
    twitter: 'border-sky-200 bg-sky-50',
    instagram: 'border-pink-200 bg-pink-50',
    facebook: 'border-blue-200 bg-blue-50',
    whatsapp: 'border-green-200 bg-green-50',
  };

  const filteredMessages = selectedPlatform === 'all' 
    ? messageList 
    : messageList.filter(msg => msg.platform === selectedPlatform);

  const platformStats = platforms.reduce((acc, p) => {
    acc[p.platform] = messageList.filter(m => m.platform === p.platform).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-pink-400 text-4xl mb-4" />
        <p className="text-gray-400">Loading your messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <FiMessageCircle className="text-pink-400" />
              Messages
            </h1>
            <p className="text-gray-500 mt-1">View, manage, and reply to messages from all connected platforms</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 disabled:opacity-50 mt-4 sm:mt-0"
          >
            <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-sm">Total Messages</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">{messageList.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-sm">Platforms</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">{platforms.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-sm">Unread</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">
              {messageList.filter(m => !m.is_read).length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-gray-400 text-sm">Reply Ready</p>
            <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-blue-300 bg-clip-text text-transparent">
              {messageList.filter(m => m.sender_id).length}
            </p>
          </div>
        </div>

        {/* Platform Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => handlePlatformFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedPlatform === 'all'
                ? 'bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white shadow-md shadow-pink-200/50'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            All ({messageList.length})
          </button>
          {platforms.map((platform) => (
            <button
              key={platform.platform}
              onClick={() => handlePlatformFilter(platform.platform)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPlatform === platform.platform
                  ? 'bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white shadow-md shadow-pink-200/50'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              {platformIcons[platform.platform]}
              {platform.name} ({platformStats[platform.platform] || 0})
            </button>
          ))}
        </div>

        {/* Messages List */}
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-400">No messages found</p>
            <p className="text-gray-500 text-sm mt-2">Connect your social media accounts to see messages here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg, index) => (
              <div
                key={`${msg.platform}-${msg.id}-${index}`}
                className={`bg-white rounded-xl p-4 border ${platformColors[msg.platform] || 'border-gray-100'} shadow-sm hover:shadow-md transition-all duration-300`}
              >
                <div className="flex items-start gap-4">
                  {/* Platform Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${platformColors[msg.platform] || 'bg-gray-100'}`}>
                    {platformIcons[msg.platform] || <FaEnvelope className="text-gray-400" />}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-800 font-medium">{msg.sender || 'Unknown Sender'}</span>
                      <span className="text-xs text-gray-400">
                        via {msg.platform_name || msg.platform}
                      </span>
                      {!msg.is_read && (
                        <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                      {msg.text || 'No message content'}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <FaClock size={12} />
                        {formatDate(msg.created_at)}
                      </span>
                      {msg.is_read && (
                        <span className="flex items-center gap-1 text-xs text-green-500">
                          <FaCheckCircle size={12} />
                          Read
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reply Button */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {msg.sender_id && (
                      <button
                        onClick={() => {
                          if (replyingTo === msg.id) {
                            setReplyingTo(null);
                            setReplyText('');
                          } else {
                            setReplyingTo(msg.id);
                          }
                        }}
                        className="px-3 py-1.5 text-sm text-pink-500 hover:bg-pink-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <FaReply size={14} />
                        Reply
                      </button>
                    )}
                  </div>
                </div>

                {/* Reply Input */}
                {replyingTo === msg.id && (
                  <div className="mt-4 ml-14">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${msg.sender || 'user'} on ${msg.platform_name || msg.platform}...`}
                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(msg);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(msg)}
                          disabled={sendingReply || !replyText.trim()}
                          className="px-4 py-2 bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-pink-200/50 disabled:opacity-50 flex items-center gap-2"
                        >
                          {sendingReply ? <FaSpinner className="animate-spin" /> : <FaPaperPlane size={16} />}
                          Send
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
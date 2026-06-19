import React, { useState, useEffect, useRef } from 'react';
import { 
  FaTwitter, FaInstagram, FaFacebook, FaWhatsapp,
  FaEnvelope, FaUser, FaClock, FaSpinner,
  FaInbox, FaPaperPlane, FaCheckCircle, FaReply,
  FaArrowLeft, FaCheckDouble
} from 'react-icons/fa';
import { FiRefreshCw, FiMessageCircle, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { messages } from '../services/api';

const Messages = () => {
  const [messageList, setMessageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [platforms, setPlatforms] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    fetchPlatforms();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation]);

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
    setSelectedConversation(null);
    fetchMessages();
  };

  const handleReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    if (!selectedConversation) {
      toast.error('No conversation selected');
      return;
    }

    setSendingReply(true);
    try {
      const response = await messages.replyToMessage(
        selectedConversation.platform,
        replyText.trim(),
        selectedConversation.sender_id || selectedConversation.id
      );
      
      if (response.data.success) {
        toast.success('Reply sent successfully!');
        // Add the sent message to the conversation
        const newMessage = {
          id: `sent-${Date.now()}`,
          platform: selectedConversation.platform,
          sender: 'Me',
          sender_id: 'me',
          text: replyText.trim(),
          created_at: new Date().toISOString(),
          is_read: true,
          is_outgoing: true
        };
        
        // Update the conversation with the new message
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, newMessage]
        };
        setSelectedConversation(updatedConversation);
        
        // Also update the message list
        setMessageList(prev => [...prev, newMessage]);
        
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
    if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  const platformBadgeColors = {
    twitter: 'bg-sky-100 text-sky-700',
    instagram: 'bg-pink-100 text-pink-700',
    facebook: 'bg-blue-100 text-blue-700',
    whatsapp: 'bg-green-100 text-green-700',
  };

  // Group messages by conversation (sender)
  const conversations = messageList.reduce((acc, msg) => {
    const key = `${msg.platform}-${msg.sender_id || msg.sender}`;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        platform: msg.platform,
        sender: msg.sender,
        sender_id: msg.sender_id || msg.id,
        messages: [],
        last_message: msg,
        platform_name: msg.platform_name,
        platform_icon: msg.platform_icon,
        unread_count: 0
      };
    }
    acc[key].messages.push(msg);
    if (!msg.is_read) {
      acc[key].unread_count += 1;
    }
    acc[key].messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return acc;
  }, {});

  const conversationList = Object.values(conversations).sort((a, b) => {
    return new Date(b.last_message.created_at) - new Date(a.last_message.created_at);
  });

  const filteredConversations = conversationList.filter(conv => 
    conv.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const conversationMessages = selectedConversation 
    ? selectedConversation.messages 
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <FaSpinner className="animate-spin text-pink-400 text-4xl mb-4" />
        <p className="text-gray-400">Loading your messages...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Conversation List */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-100 bg-gray-50/30`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiMessageCircle className="text-pink-400" />
                Inbox
              </h2>
              <span className="text-xs bg-pink-100 text-pink-600 px-2.5 py-1 rounded-full">
                {conversationList.length} conversations
              </span>
            </div>
            
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Platform Filter */}
          <div className="p-3 border-b border-gray-100 bg-white flex gap-2 overflow-x-auto">
            <button
              onClick={() => handlePlatformFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedPlatform === 'all'
                  ? 'bg-gradient-to-r from-pink-400 to-blue-300 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({conversationList.length})
            </button>
            {platforms.map((platform) => (
              <button
                key={platform.platform}
                onClick={() => handlePlatformFilter(platform.platform)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedPlatform === platform.platform
                    ? 'bg-gradient-to-r from-pink-400 to-blue-300 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {platformIcons[platform.platform]}
                {platform.name}
              </button>
            ))}
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <FaInbox size={48} className="mb-3 opacity-50" />
                <p className="text-sm">No conversations found</p>
                <p className="text-xs text-gray-400 mt-1">Connect your social media accounts</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-all text-left ${
                    selectedConversation?.id === conv.id ? 'bg-pink-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      platformColors[conv.platform] || 'bg-gray-100'
                    }`}>
                      {platformIcons[conv.platform] || <FaUser className="text-gray-400" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-800 text-sm truncate">
                          {conv.sender}
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {formatDate(conv.last_message.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-sm text-gray-500 truncate">
                          {conv.last_message.text || 'No message content'}
                        </p>
                        {conv.unread_count > 0 && (
                          <span className="w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0 ml-2">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${platformBadgeColors[conv.platform] || 'bg-gray-100 text-gray-600'}`}>
                        {conv.platform_name}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Chat View */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaArrowLeft className="text-gray-600" />
                  </button>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${platformColors[selectedConversation.platform] || 'bg-gray-100'}`}>
                    {platformIcons[selectedConversation.platform] || <FaUser className="text-gray-400" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {selectedConversation.sender}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${platformBadgeColors[selectedConversation.platform] || 'bg-gray-100 text-gray-600'}`}>
                      {selectedConversation.platform_name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {conversationMessages.map((msg, index) => {
                  // Check if this is an outgoing message (sent by the current user)
                  // We determine this by checking if the sender is "Me" or if the message has is_outgoing flag
                  const isOutgoing = msg.is_outgoing || msg.sender === 'Me' || msg.sender_id === 'me';
                  
                  return (
                    <div
                      key={`${msg.id}-${index}`}
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isOutgoing
                            ? 'bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white rounded-br-sm shadow-md shadow-pink-200/30'
                            : 'bg-white border border-gray-100 shadow-sm rounded-bl-sm'
                        }`}
                      >
                        {!isOutgoing && (
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            {msg.sender}
                          </p>
                        )}
                        <p className={`text-sm ${isOutgoing ? 'text-white' : 'text-gray-800'}`}>
                          {msg.text || 'No message content'}
                        </p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${
                          isOutgoing ? 'text-white/70' : 'text-gray-400'
                        }`}>
                          <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                          {isOutgoing && <FaCheckDouble size={10} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedConversation.sender}...`}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                  <button
                    onClick={handleReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="w-11 h-11 bg-gradient-to-r from-pink-400 via-pink-300 to-blue-300 text-white rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-pink-200/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {sendingReply ? (
                      <FaSpinner className="animate-spin" size={18} />
                    ) : (
                      <FaPaperPlane size={18} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Empty State - No conversation selected
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                <FiMessageCircle size={40} className="text-pink-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Your Messages</h3>
              <p className="text-sm text-gray-400 text-center max-w-sm mt-1">
                Select a conversation from the left to start replying to messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
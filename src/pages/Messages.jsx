import React, { useState, useEffect, useRef } from 'react';
import { 
  FaTwitter, FaInstagram, FaFacebook, FaWhatsapp,
  FaEnvelope, FaUser, FaClock, FaSpinner,
  FaInbox, FaPaperPlane, FaCheckCircle, FaReply,
  FaArrowLeft, FaCheckDouble, FaTrash
} from 'react-icons/fa';
import { FiRefreshCw, FiMessageCircle, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { messages } from '../services/api';

// Skeleton Components
const MessageListSkeleton = () => (
  <div className="flex flex-col w-full md:w-96 border-r border-gray-100 bg-gray-50/30">
    <div className="p-4 border-b border-gray-100 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
        <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
    <div className="p-3 border-b border-gray-100 bg-white flex gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-8 bg-gray-200 rounded-full w-16 animate-pulse"></div>
      ))}
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 animate-pulse">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-48 mt-1"></div>
            <div className="h-3 bg-gray-200 rounded w-20 mt-1"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChatSkeleton = () => (
  <div className="flex-1 flex flex-col bg-white">
    <div className="p-4 border-b border-gray-100 bg-white flex items-center gap-3">
      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse mt-1"></div>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <div className={`h-12 bg-gray-200 rounded-2xl w-3/4 animate-pulse ${i % 2 === 0 ? 'rounded-br-sm' : 'rounded-bl-sm'}`}></div>
        </div>
      ))}
    </div>
    <div className="p-4 border-t border-gray-100 bg-white">
      <div className="flex gap-3">
        <div className="flex-1 h-11 bg-gray-200 rounded-xl animate-pulse"></div>
        <div className="w-11 h-11 bg-gray-200 rounded-xl animate-pulse"></div>
      </div>
    </div>
  </div>
);

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

  // Add this after your existing useEffects
useEffect(() => {
  // Poll for new messages every 10 seconds
  const interval = setInterval(async () => {
    if (!loading && !refreshing) {
      try {
        const response = await messages.getMessages(selectedPlatform);
        const newMessages = response.data.messages || [];
        
        if (newMessages.length > messageList.length) {
          setMessageList(newMessages);
          
          // Update conversation if we're in one
          if (selectedConversation) {
            const updated = newMessages.filter(m => 
              m.conversation_id === selectedConversation.id || 
              m.sender_id === selectedConversation.sender_id
            );
            if (updated.length > selectedConversation.messages.length) {
              updated.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              setSelectedConversation({
                ...selectedConversation,
                messages: updated,
                last_message: updated[updated.length - 1]
              });
            }
          }
        }
      } catch (e) {
        // Silent fail
      }
    }
  }, 10000); // 10 seconds
  
  return () => clearInterval(interval);
}, [messageList.length, selectedConversation, loading, refreshing, selectedPlatform]);

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

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Delete this conversation? This will permanently remove all messages from this chat.')) {
      return;
    }

    try {
      await messages.deleteConversation(conversationId);
      setMessageList(prev => prev.filter(msg => {
        const msgConvId = msg.conversation_id || `${msg.platform}-${msg.sender_id || msg.recipient_id}`;
        return msgConvId !== conversationId;
      }));
      setSelectedConversation(null);
      toast.success('Conversation deleted successfully');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete conversation');
    }
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
    // Use the sender_id as the recipient (the person we're replying to)
    // If sender_id is 'me' or undefined, use the conversation ID
    let recipientId = selectedConversation.sender_id;
    
    // If the sender is 'Me' or 'me', we need to find the other party
    if (recipientId === 'me' || recipientId === 'Me' || !recipientId) {
      // Find the other person in the conversation
      const otherPerson = selectedConversation.messages.find(
        msg => msg.sender_id !== 'me' && msg.sender_id !== 'Me'
      );
      if (otherPerson) {
        recipientId = otherPerson.sender_id;
      } else {
        // Fallback: use the conversation ID
        recipientId = selectedConversation.id;
      }
    }
    
    console.log('Replying to:', {
      name: selectedConversation.sender,
      recipient_id: recipientId,
      platform: selectedConversation.platform
    });
    
    const response = await messages.replyToMessage(
      selectedConversation.platform,
      replyText.trim(),
      recipientId
    );
    
    if (response.data.success) {
      toast.success('Reply sent successfully!');
      
      const newMessage = {
        id: `sent-${Date.now()}`,
        platform: selectedConversation.platform,
        sender: 'Me',
        sender_id: 'me',
        recipient_id: recipientId,
        recipient_name: selectedConversation.sender,
        text: replyText.trim(),
        created_at: new Date().toISOString(),
        is_read: true,
        is_outgoing: true,
        conversation_id: selectedConversation.id,
        platform_name: selectedConversation.platform_name,
        platform_icon: selectedConversation.platform_icon,
        sender_name: 'Me'
      };
      
      const updatedMessages = [...selectedConversation.messages, newMessage];
      updatedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      
      const updatedConversation = {
        ...selectedConversation,
        messages: updatedMessages,
        last_message: newMessage
      };
      
      setSelectedConversation(updatedConversation);
      setMessageList(prev => [...prev, newMessage]);
      setReplyText('');
      
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
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

  // Conversation grouping
  const conversations = messageList.reduce((acc, msg) => {
    if (msg.sender === 'Me' && !msg.recipient_id) {
      return acc;
    }
    
    let conversationKey = msg.conversation_id;
    
    if (!conversationKey) {
      const otherPartyId = msg.is_outgoing ? msg.recipient_id : msg.sender_id;
      if (!otherPartyId || otherPartyId === 'me' || otherPartyId === 'Me') {
        return acc;
      }
      conversationKey = `${msg.platform}-${otherPartyId}`;
    }
    
    if (conversationKey.includes('-me') || conversationKey.includes('-Me')) {
      return acc;
    }
    
    if (!acc[conversationKey]) {
      let otherPartyName = msg.sender;
      let otherPartyId = msg.sender_id;
      
      if (msg.is_outgoing) {
        otherPartyName = msg.recipient_name || msg.recipient_id || 'Unknown';
        otherPartyId = msg.recipient_id;
      }
      
      if (otherPartyName === 'Me' || otherPartyName === 'me' || otherPartyId === 'me') {
        return acc;
      }
      
      acc[conversationKey] = {
        id: conversationKey,
        platform: msg.platform,
        sender: otherPartyName,
        sender_id: otherPartyId,
        recipient_id: msg.recipient_id,
        messages: [],
        last_message: msg,
        platform_name: msg.platform_name,
        platform_icon: msg.platform_icon,
        unread_count: 0
      };
    }
    
    acc[conversationKey].messages.push(msg);
    
    if (!msg.is_read && !msg.is_outgoing) {
      acc[conversationKey].unread_count += 1;
    }
    
    // Sort messages oldest first
    acc[conversationKey].messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    if (new Date(msg.created_at) > new Date(acc[conversationKey].last_message.created_at)) {
      acc[conversationKey].last_message = msg;
    }
    
    return acc;
  }, {});

  const conversationList = Object.values(conversations).sort((a, b) => {
    return new Date(b.last_message.created_at) - new Date(a.last_message.created_at);
  });

  const filteredConversationsList = conversationList.filter(conv => 
    conv.sender !== 'Me' && 
    conv.sender !== 'me' &&
    conv.sender_id !== 'me' &&
    !conv.id.includes('-me') &&
    !conv.id.includes('-Me')
  );

  const filteredConversations = filteredConversationsList.filter(conv => 
    conv.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.messages.some(m => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const conversationMessages = selectedConversation 
    ? selectedConversation.messages 
    : [];

  if (loading) {
    return (
      <div className="-mx-6 md:-mx-8 -my-6 md:-my-8 h-[calc(100vh-3rem)] flex bg-white rounded-xl border border-gray-100 overflow-hidden">
        <MessageListSkeleton />
        <ChatSkeleton />
      </div>
    );
  }

  return (
    <div className="-mx-6 md:-mx-8 -my-6 md:-my-8 h-[calc(100vh-3rem)]">
      <div className="flex h-full bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Left Panel - Conversation List */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-100 bg-gray-50/30`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiMessageCircle className="text-[#168eea]" />
                Inbox
              </h2>
              <span className="text-xs bg-[#168eea]/10 text-[#168eea] px-2.5 py-1 rounded-full">
                {filteredConversations.length} conversations
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
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Platform Filter */}
          <div className="p-3 border-b border-gray-100 bg-white flex gap-2 overflow-x-auto">
            <button
              onClick={() => handlePlatformFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedPlatform === 'all'
                  ? 'bg-[#168eea] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({filteredConversations.length})
            </button>
            {platforms.map((platform) => (
              <button
                key={platform.platform}
                onClick={() => handlePlatformFilter(platform.platform)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedPlatform === platform.platform
                    ? 'bg-[#168eea] text-white'
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
                <div key={conv.id} className="relative group">
                  <button
                    onClick={() => setSelectedConversation(conv)}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-all text-left ${
                      selectedConversation?.id === conv.id ? 'bg-[#168eea]/5' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        platformColors[conv.platform] || 'bg-gray-100'
                      }`}>
                        {platformIcons[conv.platform] || <FaUser className="text-gray-400" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800 text-sm truncate">
                            {conv.sender}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0 ml-2">
                            {formatDate(conv.last_message.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-sm text-gray-500 truncate">
                            {conv.last_message.text || 'No message content'}
                          </p>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 bg-[#168eea] text-white text-xs rounded-full flex items-center justify-center shrink-0 ml-2">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    title="Delete conversation"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteConversation(selectedConversation.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete conversation"
                  >
                    <FaTrash size={16} />
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Messages - Sorted Oldest First */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                {conversationMessages.map((msg, index) => {
                  const isOutgoing = msg.is_outgoing || msg.sender === 'Me' || msg.sender_id === 'me';
                  
                  return (
                    <div
                      key={`${msg.id}-${index}`}
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isOutgoing
                            ? 'bg-[#168eea] text-white rounded-br-sm shadow-sm'
                            : 'bg-white border border-gray-100 shadow-sm rounded-bl-sm'
                        }`}
                      >
                        {!isOutgoing && (
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            {msg.sender || 'Unknown'}
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
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 focus:border-transparent text-sm"
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
                    className="w-11 h-11 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="w-20 h-20 bg-[#168eea]/10 rounded-full flex items-center justify-center mb-4">
                <FiMessageCircle size={40} className="text-[#168eea]" />
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
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FaTwitter, FaInstagram, FaFacebook, FaWhatsapp,
  FaUser, FaSpinner, FaInbox, FaPaperPlane, FaCheckDouble, FaTrash, FaArrowLeft
} from 'react-icons/fa';
import { FiRefreshCw, FiMessageCircle, FiSearch, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { messages, assistant } from '../services/api';

const POLL_MS = 10000;

const platformIcons = {
  twitter: <FaTwitter className="text-sky-500" size={18} />,
  instagram: <FaInstagram className="text-pink-600" size={18} />,
  facebook: <FaFacebook className="text-blue-600" size={18} />,
  whatsapp: <FaWhatsapp className="text-green-500" size={18} />,
};

const platformColors = {
  twitter: 'bg-sky-50',
  instagram: 'bg-pink-50',
  facebook: 'bg-blue-50',
  whatsapp: 'bg-green-50',
};

const platformBadgeColors = {
  twitter: 'bg-sky-100 text-sky-700',
  instagram: 'bg-pink-100 text-pink-700',
  facebook: 'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
};

const getPeerId = (msg) => {
  if (msg.peer_id && msg.peer_id !== 'me' && msg.peer_id !== 'Me') return String(msg.peer_id);
  if (msg.is_outgoing || msg.sender_id === 'me' || msg.sender === 'Me') {
    return msg.recipient_id ? String(msg.recipient_id) : null;
  }
  if (msg.sender_id && msg.sender_id !== 'me') return String(msg.sender_id);
  return null;
};

const getPeerKey = (msg) => {
  if (msg.peer_key && !String(msg.peer_key).includes(':me')) return msg.peer_key;
  const peerId = getPeerId(msg);
  if (!peerId) return null;
  return `${msg.platform}:${peerId}`;
};

const getPeerName = (msg, conversation) => {
  if (conversation?.sender && conversation.sender !== 'Me') return conversation.sender;
  if (msg.is_outgoing || msg.sender === 'Me') {
    return msg.recipient_name || conversation?.sender || 'Contact';
  }
  return msg.sender || msg.sender_name || 'Contact';
};

const Messages = () => {
  const [messageList, setMessageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [platforms, setPlatforms] = useState([]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const messagesEndRef = useRef(null);
  const selectedKeyRef = useRef(null);

  useEffect(() => {
    selectedKeyRef.current = selectedKey;
  }, [selectedKey]);

  const fetchPlatforms = useCallback(async () => {
    try {
      const response = await messages.getPlatforms();
      setPlatforms(response.data.platforms || []);
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    }
  }, []);

  const fetchMessages = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await messages.getMessages(selectedPlatform);
      setMessageList(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      if (!silent) toast.error('Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPlatform]);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  useEffect(() => {
    setSelectedKey(null);
    setAiSuggestions([]);
    setReplyText('');
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    setAiSuggestions([]);
    setReplyText('');
  }, [selectedKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) fetchMessages({ silent: true });
    }, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages, loading, refreshing]);

  const conversations = useMemo(() => {
    const map = {};

    messageList.forEach((msg) => {
      const key = getPeerKey(msg);
      if (!key) return;

      const peerId = getPeerId(msg);
      if (!peerId || peerId === 'me') return;

      if (!map[key]) {
        const isOut = msg.is_outgoing || msg.sender === 'Me' || msg.sender_id === 'me';
        map[key] = {
          id: key,
          peer_key: key,
          platform: msg.platform,
          platform_name: msg.platform_name || msg.platform,
          sender: isOut
            ? msg.recipient_name || 'Contact'
            : msg.sender || msg.sender_name || 'Contact',
          sender_id: peerId,
          avatar_url: msg.avatar_url || null,
          messages: [],
          last_message: msg,
          unread_count: 0,
        };
      }

      map[key].messages.push(msg);

      if (!msg.is_outgoing && !msg.is_read) {
        map[key].unread_count += 1;
      }

      if (msg.avatar_url && !map[key].avatar_url) {
        map[key].avatar_url = msg.avatar_url;
      }

      const isOut = msg.is_outgoing || msg.sender === 'Me' || msg.sender_id === 'me';
      if (!isOut && msg.sender && msg.sender !== 'Me') {
        map[key].sender = msg.sender;
      } else if (isOut && msg.recipient_name) {
        map[key].sender = msg.recipient_name;
      }

      if (new Date(msg.created_at) >= new Date(map[key].last_message.created_at)) {
        map[key].last_message = msg;
      }
    });

    Object.values(map).forEach((conv) => {
      conv.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      // Deduplicate by message id within thread
      const seen = new Set();
      conv.messages = conv.messages.filter((m) => {
        const id = String(m.id);
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    });

    return Object.values(map).sort(
      (a, b) => new Date(b.last_message.created_at) - new Date(a.last_message.created_at)
    );
  }, [messageList]);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return conversations.filter((conv) => {
      if (!term) return true;
      return (
        conv.sender.toLowerCase().includes(term) ||
        conv.messages.some((m) => (m.text || '').toLowerCase().includes(term))
      );
    });
  }, [conversations, searchTerm]);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedKey) || null,
    [conversations, selectedKey]
  );

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages?.length, selectedKey]);

  useEffect(() => {
    if (!selectedConversation || selectedConversation.unread_count <= 0) return;

    const peerKey = selectedConversation.id;
    setMessageList((prev) =>
      prev.map((msg) => {
        if (getPeerKey(msg) !== peerKey) return msg;
        if (msg.is_outgoing) return msg;
        return { ...msg, is_read: true };
      })
    );

    messages
      .markRead({
        peerKey,
        conversationId: selectedConversation.last_message?.conversation_id || peerKey,
        platform: selectedConversation.platform,
        peerId: selectedConversation.sender_id,
      })
      .then(() => {
        window.dispatchEvent(new CustomEvent('badges:refresh'));
      })
      .catch(() => {});
  }, [selectedKey]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMessages({ silent: true });
    toast.success('Messages refreshed');
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!window.confirm('Delete this conversation from SocialHub?')) return;
    try {
      await messages.deleteConversation(conversationId);
      setMessageList((prev) =>
        prev.filter((msg) => {
          const key = getPeerKey(msg);
          return key !== conversationId && msg.conversation_id !== conversationId;
        })
      );
      if (selectedKey === conversationId) setSelectedKey(null);
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete conversation');
    }
  };

  const handleSuggestReplies = async () => {
    if (!selectedConversation) return;
    const lastIncoming = [...selectedConversation.messages]
      .reverse()
      .find((m) => !(m.is_outgoing || m.sender === 'Me' || m.sender_id === 'me'));
    const lastAny = selectedConversation.messages[selectedConversation.messages.length - 1];
    const content = lastIncoming?.text || lastAny?.text || '';
    if (!content.trim()) {
      toast.error('No message to suggest a reply for');
      return;
    }

    setLoadingAi(true);
    setAiSuggestions([]);
    try {
      const response = await assistant.generate({
        action: 'dm_reply',
        content,
        topic: selectedConversation.sender,
      });
      setAiSuggestions(response.data?.suggestions || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate reply suggestions');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    const text = replyText.trim();
    const recipientId = selectedConversation.sender_id;
    const tempId = `local-${Date.now()}`;

    const optimistic = {
      id: tempId,
      platform: selectedConversation.platform,
      platform_name: selectedConversation.platform_name,
      sender: 'Me',
      sender_id: 'me',
      recipient_id: recipientId,
      recipient_name: selectedConversation.sender,
      peer_id: recipientId,
      peer_key: selectedConversation.id,
      conversation_id: selectedConversation.last_message?.conversation_id || selectedConversation.id,
      text,
      created_at: new Date().toISOString(),
      is_read: true,
      is_outgoing: true,
    };

    setMessageList((prev) => [...prev, optimistic]);
    setReplyText('');
    setAiSuggestions([]);
    setSendingReply(true);

    try {
      const response = await messages.replyToMessage(
        selectedConversation.platform,
        text,
        recipientId
      );

      if (response.data?.success) {
        const reply = response.data.reply || {};
        setMessageList((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...optimistic,
                  id: reply.id || tempId,
                  conversation_id: reply.conversation_id || optimistic.conversation_id,
                  peer_key: reply.peer_key || optimistic.peer_key,
                  created_at: reply.created_at || optimistic.created_at,
                }
              : m
          )
        );
      } else {
        setMessageList((prev) => prev.filter((m) => m.id !== tempId));
        setReplyText(text);
        const err =
          response.data?.error ||
          'Failed to send reply';
        toast.error(err, { duration: response.data?.outside_window ? 7000 : 4000 });
      }
    } catch (error) {
      setMessageList((prev) => prev.filter((m) => m.id !== tempId));
      setReplyText(text);
      const detail = error.response?.data?.detail || error.response?.data?.error;
      toast.error(
        typeof detail === 'string' ? detail : 'Failed to send reply',
        { duration: 6000 }
      );
    } finally {
      setSendingReply(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const Avatar = ({ conv, size = 'w-10 h-10' }) => {
    if (conv?.avatar_url) {
      return (
        <img
          src={conv.avatar_url}
          alt={conv.sender}
          className={`${size} rounded-full object-cover flex-shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center flex-shrink-0 ${
          platformColors[conv?.platform] || 'bg-gray-100'
        }`}
      >
        {platformIcons[conv?.platform] || <FaUser className="text-gray-400" />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="-mx-6 md:-mx-8 -my-6 md:-my-8 h-[calc(100vh-3rem)] flex bg-white rounded-xl border border-gray-100 overflow-hidden items-center justify-center">
        <FaSpinner className="animate-spin text-[#168eea]" size={28} />
      </div>
    );
  }

  return (
    <div className="-mx-6 md:-mx-8 -my-6 md:-my-8 h-[calc(100vh-3rem)]">
      <div className="flex h-full bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div
          className={`${
            selectedConversation ? 'hidden md:flex' : 'flex'
          } flex-col w-full md:w-96 border-r border-gray-100 bg-[#f8f9fb]`}
        >
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FiMessageCircle className="text-[#168eea]" />
                Messages
              </h2>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-400 hover:text-[#168eea] hover:bg-[#168eea]/10 rounded-lg"
              >
                <FiRefreshCw className={refreshing ? 'animate-spin' : ''} size={16} />
              </button>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
              />
            </div>
          </div>

          <div className="p-3 border-b border-gray-100 bg-white flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSelectedPlatform('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedPlatform === 'all'
                  ? 'bg-[#168eea] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {platforms.map((platform) => (
              <button
                key={platform.platform}
                onClick={() => setSelectedPlatform(platform.platform)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
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

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <FaInbox size={40} className="mb-3 opacity-40" />
                <p className="text-sm">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div key={conv.id} className="relative group">
                  <button
                    onClick={() => setSelectedKey(conv.id)}
                    className={`w-full p-4 border-b border-gray-100 hover:bg-white transition-colors text-left ${
                      selectedKey === conv.id ? 'bg-white border-l-2 border-l-[#168eea]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar conv={conv} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {conv.sender}
                          </span>
                          <span className="text-[11px] text-gray-400 flex-shrink-0">
                            {formatDate(conv.last_message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {(conv.last_message.is_outgoing ? 'You: ' : '') +
                            (conv.last_message.text || 'No message')}
                        </p>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1.5 inline-block ${
                            platformBadgeColors[conv.platform] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {conv.platform_name}
                        </span>
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="w-5 h-5 bg-[#168eea] text-white text-[10px] rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                    title="Delete conversation"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white`}>
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedKey(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <FaArrowLeft className="text-gray-600" />
                  </button>
                  <Avatar conv={selectedConversation} />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {selectedConversation.sender}
                    </h3>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ${
                        platformBadgeColors[selectedConversation.platform] ||
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {selectedConversation.platform_name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteConversation(selectedConversation.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <FaTrash size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#f8f9fb]">
                {selectedConversation.messages.map((msg) => {
                  const isOutgoing =
                    msg.is_outgoing || msg.sender === 'Me' || msg.sender_id === 'me';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                          isOutgoing
                            ? 'bg-[#168eea] text-white rounded-br-md'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.text || ''}
                        </p>
                        <div
                          className={`flex items-center justify-end gap-1 mt-1 ${
                            isOutgoing ? 'text-white/70' : 'text-gray-400'
                          }`}
                        >
                          <span className="text-[10px]">{formatTime(msg.created_at)}</span>
                          {isOutgoing && <FaCheckDouble size={10} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-100 bg-white space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleSuggestReplies}
                    disabled={loadingAi}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#168eea]/30 text-[#168eea] hover:bg-[#168eea]/10 disabled:opacity-50"
                  >
                    {loadingAi ? <FaSpinner className="animate-spin" size={12} /> : <FiZap size={13} />}
                    Suggest replies
                  </button>
                  {aiSuggestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAiSuggestions([])}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setReplyText(suggestion)}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-gray-100 bg-[#f8f9fb] hover:border-[#168eea]/40 hover:bg-[#168eea]/5 text-gray-700 max-w-full"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Message ${selectedConversation.sender}...`}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
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
                    className="w-11 h-11 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-xl flex items-center justify-center disabled:opacity-50"
                  >
                    {sendingReply ? (
                      <FaSpinner className="animate-spin" size={16} />
                    ) : (
                      <FaPaperPlane size={16} />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div className="w-16 h-16 bg-[#168eea]/10 rounded-full flex items-center justify-center mb-4">
                <FiMessageCircle size={28} className="text-[#168eea]" />
              </div>
              <h3 className="text-base font-semibold text-gray-700">Your inbox</h3>
              <p className="text-sm text-gray-400 text-center max-w-sm mt-1">
                Select a conversation to view the thread and reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;

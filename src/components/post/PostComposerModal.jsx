import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiX,
  FiImage,
  FiVideo,
  FiCalendar,
  FiClock,
  FiSend,
  FiChevronDown,
  FiAlertCircle,
  FiZap,
  FiSmile,
  FiBarChart2,
} from 'react-icons/fi';
import { FaSpinner, FaInfoCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { posts } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PlatformPreview from './PlatformPreview';
import AIAssistant from './AIAssistant';
import MentionTextarea from '../MentionTextarea';
import {
  PLATFORM_IDS,
  PLATFORM_CONFIG,
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_CHAR_LIMITS,
  getPlatformIcon,
} from '../../constants/platforms';

const PostComposerModal = ({
  isOpen,
  onClose,
  platformConnections,
  onPublishSuccess,
  defaultScheduleMode = 'now',
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(defaultScheduleMode);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [threadModeEnabled, setThreadModeEnabled] = useState(false);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDurationMinutes, setPollDurationMinutes] = useState(1440);

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Your Account';
  const getPlatformProfile = (platform) => {
    const connection = platformConnections?.[platform] || {};
    const username = connection.username || connection.platform_user_name;
    const fallback = PLATFORM_DISPLAY_NAMES[platform] || userName;
    return {
      name: username || fallback,
      imageUrl:
        connection.profile_image_url ||
        connection.accounts?.[0]?.avatar_url ||
        null,
    };
  };


  const connectedPlatforms = PLATFORM_IDS.filter(
    (p) => platformConnections[p]?.connected
  );

  const resetForm = useCallback(() => {
    setContent('');
    setSelectedPlatforms([]);
    setSelectedFile(null);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    setMediaType(null);
    setScheduleMode(defaultScheduleMode);
    setScheduledDate('');
    setScheduledTime('');
    setShowAI(false);
    setThreadModeEnabled(false);
    setPollEnabled(false);
    setPollOptions(['', '']);
    setPollDurationMinutes(1440);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [mediaPreviewUrl]);

  useEffect(() => {
    if (isOpen && connectedPlatforms.length > 0 && selectedPlatforms.length === 0) {
      setSelectedPlatforms([connectedPlatforms[0]]);
      setActivePreviewPlatform(connectedPlatforms[0]);
    }
  }, [isOpen, connectedPlatforms.length]);

  useEffect(() => {
    if (selectedPlatforms.length > 0) {
      if (!selectedPlatforms.includes(activePreviewPlatform)) {
        setActivePreviewPlatform(selectedPlatforms[0]);
      }
    }
  }, [selectedPlatforms, activePreviewPlatform]);

  useEffect(() => {
    if (isOpen) {
      setScheduleMode(defaultScheduleMode);
    }
  }, [isOpen, defaultScheduleMode]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const togglePlatform = (platform) => {
    setSelectedPlatforms((prev) => {
      const next = prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform];
      return next;
    });
    setSelectedFile(null);
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl);
      setMediaPreviewUrl(null);
      setMediaType(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const hasVideoPlatform = selectedPlatforms.some((p) => PLATFORM_CONFIG[p]?.supportsVideo);
    const hasImagePlatform = selectedPlatforms.some((p) => PLATFORM_CONFIG[p]?.supportsImage);

    let isValid = false;
    if (hasVideoPlatform && validVideoTypes.includes(file.type)) isValid = true;
    else if (hasImagePlatform && validImageTypes.includes(file.type)) isValid = true;

    if (!isValid) {
      toast.error('File type not supported for selected platforms');
      e.target.value = '';
      return;
    }

    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);

    setSelectedFile(file);
    setMediaPreviewUrl(URL.createObjectURL(file));
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    toast.success(`Added: ${file.name}`);
  };

  const removeMedia = () => {
    setSelectedFile(null);
    if (mediaPreviewUrl) URL.revokeObjectURL(mediaPreviewUrl);
    setMediaPreviewUrl(null);
    setMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isThreadMode =
    threadModeEnabled &&
    selectedPlatforms.includes('twitter') &&
    selectedPlatforms.length === 1;
  const canUseTwitterPoll = selectedPlatforms.length === 1 && selectedPlatforms[0] === 'twitter';

  const hasInstagram = selectedPlatforms.includes('instagram');
  const hasMediaRequired = selectedPlatforms.some((p) => PLATFORM_CONFIG[p]?.requiresMedia);
  const needsMedia = hasMediaRequired && !selectedFile;

  const getCharStatus = () => {
    if (selectedPlatforms.length === 0) return null;
    const overLimit = selectedPlatforms.some(
      (p) => content.length > (PLATFORM_CHAR_LIMITS[p] || 5000)
    );
    return overLimit;
  };

  const canPublishText =
    content.trim() &&
    selectedPlatforms.length > 0 &&
    !needsMedia &&
    !hasInstagram &&
    !getCharStatus() &&
    !selectedFile &&
    !(pollEnabled && selectedFile);

  const canPublishMedia =
    content.trim() &&
    selectedPlatforms.length > 0 &&
    selectedFile &&
    !getCharStatus();

  const handlePublish = async (withMedia = false) => {
    if (!content.trim()) {
      toast.error('Please enter content');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one channel');
      return;
    }
    if (withMedia && !selectedFile) {
      toast.error('Please add media');
      return;
    }
    if (!withMedia && hasInstagram) {
      toast.error('Instagram requires media');
      return;
    }
    if (needsMedia) {
      toast.error('Selected platforms require media');
      return;
    }
    if (pollEnabled && canUseTwitterPoll) {
      const options = pollOptions.map((opt) => opt.trim()).filter(Boolean);
      if (options.length < 2) {
        toast.error('Please provide at least 2 poll options');
        return;
      }
    }

    if (scheduleMode === 'later') {
      if (!scheduledDate || !scheduledTime) {
        toast.error('Please set a schedule date and time');
        return;
      }

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      if (new Date(scheduledAt) <= new Date()) {
        toast.error('Scheduled time must be in the future');
        return;
      }

      setPublishing(true);
      try {
        if (selectedFile) {
          const formData = new FormData();
          formData.append('platforms', JSON.stringify(selectedPlatforms));
          formData.append('content', content);
          formData.append('media_type', mediaType);
          formData.append('file', selectedFile);
          formData.append('scheduled_at', scheduledAt);
          await posts.scheduleWithMedia(formData);
        } else {
          await posts.schedule({
            platforms: selectedPlatforms,
            content,
            scheduled_at: scheduledAt,
          });
        }
        toast.success(`Post scheduled for ${scheduledDate} at ${scheduledTime}`);
        resetForm();
        onPublishSuccess?.();
        onClose();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to schedule post');
      } finally {
        setPublishing(false);
      }
      return;
    }

    setPublishing(true);
    try {
      let response;
      if (pollEnabled && canUseTwitterPoll && !withMedia) {
        const options = pollOptions.map((opt) => opt.trim()).filter(Boolean);
        response = await posts.publishTwitterPoll({
          text: content,
          options,
          duration_minutes: pollDurationMinutes,
        });
        response = { data: { successful: 1, total_platforms: 1 } };
      } else if (withMedia && selectedFile) {
        const formData = new FormData();
        formData.append('platforms', JSON.stringify(selectedPlatforms));
        formData.append('content', content);
        formData.append('media_type', mediaType);
        formData.append('file', selectedFile);
        response = await posts.publishWithMedia(formData);
      } else {
        const threadLines = content.split('\n').map((line) => line.trim()).filter(Boolean);
        if (isThreadMode && selectedPlatforms.length === 1 && selectedPlatforms[0] === 'twitter' && threadLines.length > 1) {
          await posts.postThread(threadLines);
          response = { data: { successful: 1, total_platforms: 1 } };
        } else {
          response = await posts.publish({
            platforms: selectedPlatforms,
            content,
          });
        }
      }

      const { successful, total_platforms } = response.data;
      if (successful === total_platforms) {
        const tiktokProcessing = response.data?.results?.tiktok?.processing;
        toast.success(
          tiktokProcessing
            ? 'Video sent to TikTok — it may take a minute to finish processing'
            : `Published to ${total_platforms} channel${total_platforms > 1 ? 's' : ''}!`
        );
        resetForm();
        onPublishSuccess?.();
        onClose();
      } else if (successful > 0) {
        toast.warning(`Partially published: ${successful}/${total_platforms}`);
        onPublishSuccess?.();
      } else {
        const resultErrors = Object.entries(response.data?.results || {})
          .filter(([, result]) => result && result.success === false)
          .map(([platform, result]) => {
            const name = PLATFORM_DISPLAY_NAMES[platform] || platform;
            return `${name}: ${result.error || 'failed'}`;
          });
        toast.error(
          resultErrors.length > 0
            ? resultErrors.join(' · ')
            : 'Publishing failed. Check your connections.'
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
            <p className="text-sm text-gray-500">Compose and preview across your channels</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAI(!showAI)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                showAI
                  ? 'bg-[#168eea]/10 text-[#168eea]'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <FiZap size={16} />
              AI Assistant
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Body - Split View */}
        <div className="flex flex-1 overflow-hidden min-h-0 relative">
          {/* Left: Composer */}
          <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
            {/* Channel Selection */}
            <div className="px-6 py-4 border-b border-gray-50">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Channels
              </label>
              <div className="flex flex-wrap gap-2">
                {connectedPlatforms.map((platform) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  const config = PLATFORM_CONFIG[platform];
                  const accountCount = platformConnections?.[platform]?.account_count || 1;
                  return (
                    <button
                      key={platform}
                      onClick={() => togglePlatform(platform)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? `${config.bg} ${config.color} ${config.border} ring-2 ${config.ring}`
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {getPlatformIcon(platform, 16)}
                      {PLATFORM_DISPLAY_NAMES[platform]}
                      {accountCount > 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 text-gray-600">
                          {accountCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedPlatforms.length === 0 && (
                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                  <FiAlertCircle size={14} />
                  Select at least one channel
                </p>
              )}
            </div>

            {/* Content Editor */}
            <div className="flex-1 px-6 py-4 overflow-y-auto">
              {selectedPlatforms.includes('twitter') && selectedPlatforms.length === 1 && (
                <div className="mb-3 flex items-center gap-3">
                  <button
                    onClick={() => setThreadModeEnabled((prev) => !prev)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      threadModeEnabled
                        ? 'bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/30'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {threadModeEnabled ? 'Thread mode on' : 'Thread mode off'}
                  </button>
                  <p className="text-xs text-gray-400">
                    Multi-line text stays as one tweet unless thread mode is enabled.
                  </p>
                </div>
              )}
              {pollEnabled && canUseTwitterPoll && (
                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Poll options</p>
                  {pollOptions.map((option, idx) => (
                    <input
                      key={idx}
                      value={option}
                      onChange={(e) =>
                        setPollOptions((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))
                      }
                      placeholder={`Option ${idx + 1}`}
                      className="w-full mb-2 px-3 py-2 text-sm border border-gray-200 rounded-lg"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      onClick={() => setPollOptions((prev) => [...prev, ''])}
                      className="text-xs text-[#168eea] hover:underline"
                    >
                      + Add option
                    </button>
                  )}
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => setPollOptions((prev) => prev.slice(0, -1))}
                      className="ml-3 text-xs text-red-500 hover:underline"
                    >
                      Remove last
                    </button>
                  )}
                  <div className="mt-2">
                    <label className="text-xs text-gray-500 mr-2">Duration</label>
                    <select
                      value={pollDurationMinutes}
                      onChange={(e) => setPollDurationMinutes(Number(e.target.value))}
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                    >
                      <option value={30}>30 min</option>
                      <option value={60}>1 hour</option>
                      <option value={360}>6 hours</option>
                      <option value={1440}>1 day</option>
                      <option value={4320}>3 days</option>
                      <option value={10080}>7 days</option>
                    </select>
                  </div>
                </div>
              )}

              <MentionTextarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                enableMentions={selectedPlatforms.includes('twitter')}
                placeholder={
                  selectedPlatforms.includes('twitter')
                    ? "What would you like to share? Type @ to mention on X"
                    : 'What would you like to share?'
                }
                rows={isThreadMode ? 8 : 6}
                className="w-full resize-none text-gray-800 placeholder-gray-400 focus:outline-none text-base leading-relaxed min-h-[160px]"
              />

              {isThreadMode && (
                <p className="text-xs text-[#1DA1F2] mt-2 flex items-center gap-1">
                  <FaInfoCircle size={12} />
                  Thread mode: each line becomes a separate tweet
                </p>
              )}

              {/* Media attachment preview */}
              {mediaPreviewUrl && (
                <div className="mt-4 relative inline-block">
                  <div className="rounded-lg overflow-hidden border border-gray-200 max-w-xs">
                    {mediaType === 'video' ? (
                      <video src={mediaPreviewUrl} className="max-h-40 w-full object-cover" />
                    ) : (
                      <img src={mediaPreviewUrl} alt="Attachment" className="max-h-40 w-full object-cover" />
                    )}
                  </div>
                  <button
                    onClick={removeMedia}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700"
                  >
                    <FiX size={14} />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{selectedFile?.name}</p>
                </div>
              )}

              {/* Character counts per platform */}
              {selectedPlatforms.length > 0 && content && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedPlatforms.map((p) => {
                    const limit = PLATFORM_CHAR_LIMITS[p];
                    const over = content.length > limit;
                    return (
                      <span
                        key={p}
                        className={`text-xs px-2 py-1 rounded-full ${
                          over ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                        }`}
                      >
                        {PLATFORM_DISPLAY_NAMES[p]}: {content.length}/{limit}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Toolbar */}
            <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedPlatforms.length === 0}
                className="p-2 text-gray-500 hover:text-[#168eea] hover:bg-[#168eea]/10 rounded-lg transition-colors disabled:opacity-40"
                title="Add image"
              >
                <FiImage size={20} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedPlatforms.length === 0}
                className="p-2 text-gray-500 hover:text-[#168eea] hover:bg-[#168eea]/10 rounded-lg transition-colors disabled:opacity-40"
                title="Add video"
              >
                <FiVideo size={20} />
              </button>
              <button
                onClick={() => setContent((prev) => `${prev}${prev ? ' ' : ''}😊`)}
                disabled={selectedPlatforms.length === 0}
                className="p-2 text-gray-500 hover:text-[#168eea] hover:bg-[#168eea]/10 rounded-lg transition-colors disabled:opacity-40"
                title="Add emoji"
              >
                <FiSmile size={20} />
              </button>
              <button
                onClick={() => setPollEnabled((prev) => !prev)}
                disabled={!canUseTwitterPoll || !!selectedFile}
                className="p-2 text-gray-500 hover:text-[#168eea] hover:bg-[#168eea]/10 rounded-lg transition-colors disabled:opacity-40"
                title="Add poll (X)"
              >
                <FiBarChart2 size={20} />
              </button>
            </div>

            {/* Mobile preview */}
            <div className="md:hidden border-t border-gray-100 bg-[#f8f9fb] p-4 max-h-64 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Preview
              </p>
              {selectedPlatforms.length > 0 && activePreviewPlatform ? (
                <>
                  {selectedPlatforms.length > 1 && (
                    <div className="flex gap-1 mb-3 overflow-x-auto">
                      {selectedPlatforms.map((platform) => (
                        <button
                          key={platform}
                          onClick={() => setActivePreviewPlatform(platform)}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs whitespace-nowrap ${
                            activePreviewPlatform === platform
                              ? 'bg-white shadow-sm text-gray-900'
                              : 'text-gray-500'
                          }`}
                        >
                          {getPlatformIcon(platform, 12)}
                        </button>
                      ))}
                    </div>
                  )}
                  <PlatformPreview
                    platform={activePreviewPlatform}
                    content={content}
                    mediaUrl={mediaPreviewUrl}
                    mediaType={mediaType}
                    userName={getPlatformProfile(activePreviewPlatform).name}
                    profileImageUrl={getPlatformProfile(activePreviewPlatform).imageUrl}
                    isThreadMode={isThreadMode}
                  />
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Select channels to preview</p>
              )}
            </div>
          </div>

          {/* Right: Preview Panel (desktop) */}
          <div className="w-[380px] flex-shrink-0 bg-[#f8f9fb] flex flex-col hidden md:flex">
            <div className="px-4 py-3 border-b border-gray-200/60">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Preview
              </p>
            </div>

            {/* Preview platform tabs */}
            {selectedPlatforms.length > 1 && (
              <div className="flex gap-1 px-3 py-2 border-b border-gray-200/60 overflow-x-auto">
                {selectedPlatforms.map((platform) => {
                  const isActive = activePreviewPlatform === platform;
                  return (
                    <button
                      key={platform}
                      onClick={() => setActivePreviewPlatform(platform)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                      }`}
                    >
                      {getPlatformIcon(platform, 14)}
                      {PLATFORM_DISPLAY_NAMES[platform]}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {selectedPlatforms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 px-4">
                  <FiImage size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">Select channels to see previews</p>
                </div>
              ) : activePreviewPlatform ? (
                <PlatformPreview
                  platform={activePreviewPlatform}
                  content={content}
                  mediaUrl={mediaPreviewUrl}
                  mediaType={mediaType}
                  userName={getPlatformProfile(activePreviewPlatform).name}
                  profileImageUrl={getPlatformProfile(activePreviewPlatform).imageUrl}
                  isThreadMode={isThreadMode}
                />
              ) : null}

              {/* Show all previews when multiple selected on mobile hint */}
              {selectedPlatforms.length > 1 && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  Switch tabs above to preview each channel
                </p>
              )}
            </div>
          </div>

          {showAI && (
            <AIAssistant
              content={content}
              onApply={(text) => setContent(text)}
              onClose={() => setShowAI(false)}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setScheduleMode(scheduleMode === 'now' ? 'later' : 'now')}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-white rounded-lg border border-gray-200 transition-colors"
              >
                {scheduleMode === 'now' ? (
                  <>
                    <FiSend size={16} />
                    Publish Now
                  </>
                ) : (
                  <>
                    <FiCalendar size={16} />
                    Schedule
                  </>
                )}
                <FiChevronDown size={14} />
              </button>
            </div>

            {scheduleMode === 'later' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
                />
                <FiClock className="text-gray-400" size={16} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>

            {selectedFile ? (
              <button
                onClick={() => handlePublish(true)}
                disabled={publishing || !canPublishMedia}
                className="px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {publishing ? <FaSpinner className="animate-spin" size={16} /> : <FiSend size={16} />}
                {publishing ? 'Publishing...' : scheduleMode === 'later' ? 'Schedule Post' : 'Publish'}
              </button>
            ) : (
              <button
                onClick={() => handlePublish(false)}
                disabled={publishing || !canPublishText}
                className="px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                {publishing ? <FaSpinner className="animate-spin" size={16} /> : <FiSend size={16} />}
                {publishing ? 'Publishing...' : scheduleMode === 'later' ? 'Schedule Post' : 'Publish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposerModal;

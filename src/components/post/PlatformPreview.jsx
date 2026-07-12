import React from 'react';
import {
  FaHeart,
  FaComment,
  FaShare,
  FaRetweet,
  FaThumbsUp,
  FaPlay,
  FaGlobe,
  FaEllipsisH,
  FaBookmark,
  FaRegHeart,
  FaRegComment,
  FaRegBookmark,
  FaPoll,
  FaRegSmile,
} from 'react-icons/fa';
import { FiMoreHorizontal, FiSend, FiThumbsUp } from 'react-icons/fi';
import {
  PLATFORM_CONFIG,
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_CHAR_LIMITS,
  getPlatformIcon,
} from '../../constants/platforms';

const Avatar = ({ name, imageUrl, size = 'md' }) => {
  const initials = (name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || 'Profile'}
        className={`${sizeClass} rounded-md object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-md bg-gradient-to-br from-[#168eea] to-[#0d6efd] flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
};

const MediaPreview = ({ mediaUrl, mediaType, platform }) => {
  if (!mediaUrl) return null;

  const isVideo = mediaType === 'video';

  if (platform === 'instagram') {
    return (
      <div className="relative aspect-square bg-gray-100">
        {isVideo ? (
          <video src={mediaUrl} className="w-full h-full object-cover" />
        ) : (
          <img src={mediaUrl} alt="Post media" className="w-full h-full object-cover" />
        )}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-black/40 rounded-full flex items-center justify-center">
              <FaPlay className="text-white ml-1" size={16} />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (platform === 'youtube') {
    return (
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        {isVideo ? (
          <video src={mediaUrl} className="w-full h-full object-cover" />
        ) : (
          <img src={mediaUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg">
            <FaPlay className="text-white ml-1" size={18} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden bg-gray-100">
      {isVideo ? (
        <video src={mediaUrl} className="w-full max-h-64 object-cover" controls={false} />
      ) : (
        <img src={mediaUrl} alt="Post media" className="w-full max-h-64 object-cover" />
      )}
    </div>
  );
};

const CharCount = ({ content, platform }) => {
  const limit = PLATFORM_CHAR_LIMITS[platform] || 5000;
  const count = content?.length || 0;
  const remaining = limit - count;
  const isOver = remaining < 0;
  const isWarning = remaining < limit * 0.1 && remaining >= 0;

  return (
    <span
      className={`text-xs font-medium ${
        isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-400'
      }`}
    >
      {count}/{limit}
    </span>
  );
};

const FacebookPreview = ({ content, mediaUrl, mediaType, userName, profileImageUrl }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="p-3 flex items-start gap-2">
      <Avatar name={userName} imageUrl={profileImageUrl} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900">{userName}</p>
        <p className="text-xs text-gray-500 flex items-center gap-1">
          Just now · <FaGlobe size={10} />
        </p>
      </div>
      <FaEllipsisH className="text-gray-400 mt-1" size={14} />
    </div>
    {content && (
      <div className="px-3 pb-2">
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{content}</p>
      </div>
    )}
    {mediaUrl && (
      <div className="px-0">
        <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} platform="facebook" />
      </div>
    )}
    <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-around text-gray-500">
      <button className="flex items-center gap-1.5 text-xs hover:text-blue-600 py-1">
        <FaThumbsUp size={14} /> Like
      </button>
      <button className="flex items-center gap-1.5 text-xs hover:text-blue-600 py-1">
        <FaComment size={14} /> Comment
      </button>
      <button className="flex items-center gap-1.5 text-xs hover:text-blue-600 py-1">
        <FaShare size={14} /> Share
      </button>
    </div>
  </div>
);

const InstagramPreview = ({ content, mediaUrl, mediaType, userName, profileImageUrl }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden max-w-sm mx-auto">
    <div className="p-3 flex items-center gap-2 border-b border-gray-100">
      <Avatar name={userName} imageUrl={profileImageUrl} size="sm" />
      <p className="font-semibold text-sm text-gray-900 flex-1">{userName}</p>
      <FiMoreHorizontal className="text-gray-600" />
    </div>
    {mediaUrl ? (
      <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} platform="instagram" />
    ) : (
      <div className="aspect-square bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
        Add an image or video
      </div>
    )}
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-gray-800">
          <FaRegHeart size={22} />
          <FaRegComment size={22} />
          <FiSend size={22} />
        </div>
        <FaRegBookmark size={22} className="text-gray-800" />
      </div>
      {content && (
        <p className="text-sm text-gray-800">
          <span className="font-semibold mr-1">{userName}</span>
          <span className="whitespace-pre-wrap break-words">{content}</span>
        </p>
      )}
    </div>
  </div>
);

const TwitterPreview = ({ content, mediaUrl, mediaType, userName, profileImageUrl, isThreadMode }) => {
  const lines = content?.split('\n').filter((l) => l.trim()) || [];
  const isThread = isThreadMode && lines.length > 1;

  if (isThread) {
    return (
      <div className="space-y-0">
        {lines.map((line, i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 relative"
          >
            <div className="flex gap-2">
              <Avatar name={userName} imageUrl={profileImageUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm text-gray-900">{userName}</span>
                  <span className="text-gray-500 text-sm">@{userName?.toLowerCase().replace(/\s/g, '')}</span>
                  <span className="text-gray-400 text-sm">· now</span>
                </div>
                <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap break-words">{line}</p>
                {i === 0 && mediaUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
                    <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} platform="twitter" />
                  </div>
                )}
                <div className="flex items-center justify-between mt-2 text-gray-400 max-w-xs">
                  <FaComment size={14} />
                  <FaRetweet size={14} />
                  <FaHeart size={14} />
                  <FaShare size={14} />
                </div>
              </div>
            </div>
            {i < lines.length - 1 && (
              <div className="absolute left-5 bottom-0 w-0.5 h-3 bg-gray-200 translate-y-full" />
            )}
          </div>
        ))}
        <p className="text-xs text-[#1DA1F2] mt-2 text-center">Thread · {lines.length} posts</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
      <div className="flex gap-2">
        <Avatar name={userName} imageUrl={profileImageUrl} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm text-gray-900">{userName}</span>
            <span className="text-gray-500 text-sm">@{userName?.toLowerCase().replace(/\s/g, '')}</span>
            <span className="text-gray-400 text-sm">· now</span>
          </div>
          {content && (
            <p className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap break-words">{content}</p>
          )}
          {mediaUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-gray-200">
              <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} platform="twitter" />
            </div>
          )}
          <div className="flex items-center justify-between mt-3 text-gray-400 max-w-xs">
            <FaComment size={14} />
            <FaRetweet size={14} />
            <FaHeart size={14} />
            <FaShare size={14} />
          </div>
          <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs">
            <FaRegSmile size={13} />
            <FaPoll size={13} />
            <FaBookmark size={13} />
          </div>
        </div>
      </div>
    </div>
  );
};

const LinkedInPreview = ({ content, mediaUrl, mediaType, userName, profileImageUrl }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="p-3 flex items-start gap-2">
      <Avatar name={userName} imageUrl={profileImageUrl} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900">{userName}</p>
        <p className="text-xs text-gray-500">Professional title · 1st</p>
        <p className="text-xs text-gray-400">Just now · <FaGlobe className="inline" size={10} /></p>
      </div>
      <FiMoreHorizontal className="text-gray-400" />
    </div>
    {content && (
      <div className="px-3 pb-2">
        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words line-clamp-6">{content}</p>
      </div>
    )}
    {mediaUrl && (
      <div className="px-0">
        <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} platform="linkedin" />
      </div>
    )}
    <div className="px-3 py-2 border-t border-gray-100 flex items-center justify-around text-gray-500">
      <button className="flex items-center gap-1 text-xs py-1">
        <FiThumbsUp size={16} /> Like
      </button>
      <button className="flex items-center gap-1 text-xs py-1">
        <FaComment size={14} /> Comment
      </button>
      <button className="flex items-center gap-1 text-xs py-1">
        <FaShare size={14} /> Repost
      </button>
      <button className="flex items-center gap-1 text-xs py-1">
        <FiSend size={16} /> Send
      </button>
    </div>
  </div>
);

const YouTubePreview = ({ content, mediaUrl, mediaType, userName }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    {mediaUrl ? (
      <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} platform="youtube" />
    ) : (
      <div className="aspect-video bg-gray-900 flex items-center justify-center text-gray-500 text-sm">
        Add a video to preview
      </div>
    )}
    <div className="p-3">
      <p className="font-semibold text-sm text-gray-900 line-clamp-2">
        {content?.split('\n')[0] || 'Video title'}
      </p>
      <p className="text-xs text-gray-500 mt-1">{userName} · 0 views · Just now</p>
      {content?.includes('\n') && (
        <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap line-clamp-3">
          {content.split('\n').slice(1).join('\n')}
        </p>
      )}
    </div>
  </div>
);

const WhatsAppPreview = ({ content, mediaUrl, mediaType, userName }) => (
  <div className="bg-[#e5ddd5] rounded-lg p-4 min-h-[120px]">
    <div className="flex justify-end">
      <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-2 max-w-[85%] shadow-sm">
        {mediaUrl && (
          <div className="mb-1 rounded overflow-hidden">
            <MediaPreview mediaUrl={mediaUrl} mediaType={mediaType} platform="whatsapp" />
          </div>
        )}
        {content && (
          <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">{content}</p>
        )}
        <p className="text-[10px] text-gray-500 text-right mt-1">Just now ✓✓</p>
      </div>
    </div>
  </div>
);

const TikTokPreview = ({ content, mediaUrl, mediaType, userName, profileImageUrl }) => (
  <div className="bg-black rounded-xl overflow-hidden shadow-sm max-w-[280px] mx-auto">
    <div className="relative aspect-[9/16] bg-gray-900">
      {mediaUrl ? (
        mediaType === 'video' ? (
          <video src={mediaUrl} className="w-full h-full object-cover" />
        ) : (
          <img src={mediaUrl} alt="TikTok" className="w-full h-full object-cover" />
        )
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
          <FaPlay size={28} className="text-white/60" />
          <span className="text-xs">Add a video</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Avatar name={userName} imageUrl={profileImageUrl} size="sm" />
          <span className="text-sm font-semibold">@{userName?.replace(/\s+/g, '').toLowerCase() || 'you'}</span>
        </div>
        {content && (
          <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">{content}</p>
        )}
      </div>
      <div className="absolute right-2 bottom-20 flex flex-col gap-4 text-white items-center text-xs">
        <FaHeart size={22} />
        <FaComment size={22} />
        <FaShare size={20} />
      </div>
    </div>
  </div>
);

const previewComponents = {
  facebook: FacebookPreview,
  instagram: InstagramPreview,
  twitter: TwitterPreview,
  linkedin: LinkedInPreview,
  youtube: YouTubePreview,
  whatsapp: WhatsAppPreview,
  tiktok: TikTokPreview,
};

const PlatformPreview = ({
  platform,
  content,
  mediaUrl,
  mediaType,
  userName,
  profileImageUrl,
  isThreadMode = false,
}) => {
  const PreviewComponent = previewComponents[platform];
  const config = PLATFORM_CONFIG[platform];

  if (!PreviewComponent) return null;

  return (
    <div className="h-full">
      <div className="flex items-center gap-2 mb-3">
        {getPlatformIcon(platform, 18)}
        <span className="text-sm font-medium text-gray-700">
          {PLATFORM_DISPLAY_NAMES[platform]}
        </span>
        <CharCount content={content} platform={platform} />
        {config?.requiresMedia && !mediaUrl && (
          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-auto">
            Media required
          </span>
        )}
      </div>
      <PreviewComponent
        content={content}
        mediaUrl={mediaUrl}
        mediaType={mediaType}
        userName={userName}
        profileImageUrl={profileImageUrl}
        isThreadMode={isThreadMode}
      />
    </div>
  );
};

export default PlatformPreview;

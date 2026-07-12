import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { posts } from '../services/api';
import {
  FaYoutube, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaWhatsapp, FaTiktok,
  FaCalendar, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEye, FaTrash,
  FaChartLine, FaGlobe, FaTrashAlt, FaImage, FaVideo, FaFileAlt
} from 'react-icons/fa';
import { FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PostCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
    <div className="aspect-[16/10] bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
        <div className="h-6 bg-gray-200 rounded-full w-16" />
      </div>
    </div>
  </div>
);

const platformConfig = {
  facebook: { icon: FaFacebook, name: 'Facebook', color: 'text-blue-600', bg: 'bg-blue-50' },
  instagram: { icon: FaInstagram, name: 'Instagram', color: 'text-pink-600', bg: 'bg-pink-50' },
  linkedin: { icon: FaLinkedin, name: 'LinkedIn', color: 'text-blue-700', bg: 'bg-blue-50' },
  youtube: { icon: FaYoutube, name: 'YouTube', color: 'text-red-600', bg: 'bg-red-50' },
  twitter: { icon: FaTwitter, name: 'X', color: 'text-sky-500', bg: 'bg-sky-50' },
  tiktok: { icon: FaTiktok, name: 'TikTok', color: 'text-gray-900', bg: 'bg-gray-100' },
  whatsapp: { icon: FaWhatsapp, name: 'WhatsApp', color: 'text-green-600', bg: 'bg-green-50' },
  threads: { icon: FaGlobe, name: 'Threads', color: 'text-gray-800', bg: 'bg-gray-100' },
};

const detectPlatforms = (post) => {
  if (post.platforms && Array.isArray(post.platforms) && post.platforms.length > 0) {
    return post.platforms;
  }
  if (post.analytics?.length) {
    return [...new Set(post.analytics.map((a) => a.platform).filter(Boolean))];
  }
  if (post.platform) return [post.platform];
  return [];
};

const getPlatformDisplay = (platform) => {
  const config = platformConfig[platform];
  if (!config) {
    return { icon: FaGlobe, name: platform || 'Unknown', color: 'text-gray-400', bg: 'bg-gray-50' };
  }
  return config;
};

const Posts = () => {
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [twitterFeed, setTwitterFeed] = useState([]);
  const [tiktokFeed, setTiktokFeed] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await posts.getPosts(50, true, true);
      let postsData = [];
      if (response.data?.posts) postsData = response.data.posts;
      else if (Array.isArray(response.data)) postsData = response.data;

      setUserPosts(
        postsData.map((post) => ({
          ...post,
          detectedPlatforms: detectPlatforms(post),
        }))
      );
      setTwitterFeed(response.data?.twitter_feed || []);
      setTiktokFeed(response.data?.tiktok_feed || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (
      !window.confirm(
        'Delete this post from SocialHub and all connected social platforms?'
      )
    ) {
      return;
    }

    setDeleting(postId);
    try {
      const response = await posts.deletePost(postId, true);
      if (response.data?.success || response.status === 200) {
        setUserPosts((prev) => prev.filter((p) => p.id !== postId));
        setSelectedPosts((prev) => prev.filter((id) => id !== postId));
        toast.success('Post deleted');
      } else {
        toast.error(response.data?.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete post');
    } finally {
      setDeleting(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedPosts.length === 0) {
      toast.error('Please select at least one post');
      return;
    }
    if (
      !window.confirm(
        `Delete ${selectedPosts.length} posts from SocialHub and social platforms?`
      )
    ) {
      return;
    }

    let deleted = 0;
    let failed = 0;
    for (const postId of selectedPosts) {
      try {
        await posts.deletePost(postId, true);
        deleted++;
      } catch {
        failed++;
      }
    }

    if (deleted > 0) {
      toast.success(
        `${deleted} post${deleted === 1 ? '' : 's'} deleted${failed ? `, ${failed} failed` : ''}`
      );
      setUserPosts((prev) => prev.filter((p) => !selectedPosts.includes(p.id)));
      setSelectedPosts([]);
      setDeleteMode(false);
    } else {
      toast.error('Failed to delete posts');
    }
  };

  const togglePostSelection = (postId) => {
    setSelectedPosts((prev) =>
      prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { icon: FaCheckCircle, text: 'Published', color: 'text-green-700 bg-green-50' },
      partial: { icon: FaExclamationTriangle, text: 'Partial', color: 'text-amber-700 bg-amber-50' },
      failed: { icon: FaExclamationTriangle, text: 'Failed', color: 'text-red-700 bg-red-50' },
      processing: { icon: FaSpinner, text: 'Processing', color: 'text-[#168eea] bg-[#168eea]/10' },
      scheduled: { icon: FaCalendar, text: 'Scheduled', color: 'text-purple-700 bg-purple-50' },
    };
    const config = statusConfig[status] || statusConfig.processing;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.color}`}>
        <Icon className={status === 'processing' ? 'animate-spin' : ''} size={11} />
        {config.text}
      </span>
    );
  };

  const truncateText = (text, maxLength = 140) => {
    if (!text) return '';
    return text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;
  };

  const filteredPosts =
    filter === 'all'
      ? userPosts
      : userPosts.filter((post) => post.detectedPlatforms?.includes(filter));

  const allPlatforms = [...new Set(userPosts.flatMap((p) => p.detectedPlatforms || []))];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FiBookOpen className="text-[#168eea]" size={24} />
            Posts
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Published content across your channels · {userPosts.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDeleteMode(!deleteMode);
              setSelectedPosts([]);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              deleteMode
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {deleteMode ? 'Cancel' : 'Select'}
          </button>
          {deleteMode && selectedPosts.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
            >
              <FaTrashAlt size={13} />
              Delete ({selectedPosts.length})
            </button>
          )}
        </div>
      </div>

      {userPosts.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#168eea] text-white'
                : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
            }`}
          >
            All ({userPosts.length})
          </button>
          {allPlatforms.map((platform) => {
            const config = getPlatformDisplay(platform);
            const Icon = config.icon;
            const count = userPosts.filter((p) => p.detectedPlatforms?.includes(platform)).length;
            return (
              <button
                key={platform}
                onClick={() => setFilter(platform)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === platform
                    ? 'bg-[#168eea] text-white'
                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Icon size={14} />
                {config.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {twitterFeed.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FaTwitter className="text-sky-500" /> Recent from X
          </h2>
          <div className="space-y-2 max-h-56 overflow-auto">
            {twitterFeed.map((tweet) => (
              <a
                key={tweet.id}
                href={tweet.url}
                target="_blank"
                rel="noreferrer"
                className="block p-3 rounded-lg border border-gray-100 hover:border-[#168eea]/30 hover:bg-[#168eea]/5 transition-colors"
              >
                <p className="text-sm text-gray-700 line-clamp-3">{tweet.text}</p>
                <div className="mt-2 text-xs text-gray-400 flex gap-3">
                  <span className="inline-flex items-center gap-1">
                    <FaChartLine size={10} /> {tweet.likes}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {tiktokFeed.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-gray-100 p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FaTiktok /> Recent from TikTok
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiktokFeed.map((video) => (
              <a
                key={video.id}
                href={video.share_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-lg border border-gray-100 overflow-hidden hover:border-gray-300 transition-colors"
              >
                {video.cover_image_url && (
                  <img
                    src={video.cover_image_url}
                    alt={video.title || 'TikTok video'}
                    className="w-full h-36 object-cover"
                  />
                )}
                <div className="p-3">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {video.title || video.description || 'TikTok video'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#168eea]/10 flex items-center justify-center">
            <FiBookOpen className="text-[#168eea]" size={24} />
          </div>
          <p className="text-gray-700 font-medium mb-1">No posts yet</p>
          <p className="text-sm text-gray-400">
            {userPosts.length === 0
              ? 'Publish from the dashboard to see your content here.'
              : `No posts for this filter.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPosts.map((post) => {
            const platforms = post.detectedPlatforms || [];
            const isSelected = selectedPosts.includes(post.id);
            const isDeleting = deleting === post.id;
            const mediaUrl = post.media_url;
            const mediaType = post.media_type;
            const content = post.content || post.content_text || '';

            return (
              <article
                key={post.id}
                className={`group bg-white rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                  isSelected ? 'border-[#168eea] ring-1 ring-[#168eea]/30' : 'border-gray-100'
                }`}
              >
                <div className="relative aspect-[16/10] bg-[#f0f2f5] overflow-hidden">
                  {mediaUrl && mediaType === 'image' ? (
                    <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                  ) : mediaUrl && mediaType === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900/5">
                      <FaVideo className="text-gray-400" size={28} />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6">
                      <p className="text-sm text-gray-500 line-clamp-4 text-center leading-relaxed">
                        {content || 'Text post'}
                      </p>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {getStatusBadge(post.status)}
                  </div>

                  {deleteMode && (
                    <label className="absolute top-3 right-3 bg-white/95 rounded-md px-2 py-1 shadow-sm cursor-pointer flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePostSelection(post.id)}
                        className="w-3.5 h-3.5 text-[#168eea] rounded border-gray-300"
                      />
                      <span className="text-[11px] text-gray-600">Select</span>
                    </label>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="inline-flex items-center gap-1.5">
                      <FaCalendar size={11} />
                      {new Date(post.created_at || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {mediaType && (
                      <span className="inline-flex items-center gap-1 capitalize">
                        {mediaType === 'image' ? <FaImage size={11} /> : mediaType === 'video' ? <FaVideo size={11} /> : <FaFileAlt size={11} />}
                        {mediaType}
                      </span>
                    )}
                  </div>

                  {content && (
                    <p className="text-sm text-gray-800 leading-relaxed mb-3 line-clamp-3">
                      {truncateText(content)}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {platforms.map((platform) => {
                        const config = getPlatformDisplay(platform);
                        const Icon = config.icon;
                        return (
                          <span
                            key={platform}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.bg} ${config.color}`}
                          >
                            <Icon size={11} />
                            {config.name}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => navigate(`/posts/${post.id}`)}
                        className="p-2 text-gray-400 hover:text-[#168eea] hover:bg-[#168eea]/10 rounded-lg transition-colors"
                        title="View details"
                      >
                        <FaEye size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete from SocialHub and social platforms"
                      >
                        {isDeleting ? (
                          <FaSpinner className="animate-spin" size={14} />
                        ) : (
                          <FaTrash size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Posts;

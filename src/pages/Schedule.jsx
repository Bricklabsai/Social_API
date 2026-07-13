import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiCalendar,
  FiClock,
  FiTrash2,
  FiImage,
  FiVideo,
  FiRepeat,
} from 'react-icons/fi';
import { getPlatformIcon, PLATFORM_DISPLAY_NAMES } from '../constants/platforms';
import PostComposerModal from '../components/post/PostComposerModal';
import { platforms, posts, recurring } from '../services/api';
import {
  DAYS_SHORT,
  DAYS_LONG,
  WEEK_OF_MONTH_OPTIONS,
  describeRecurringSchedule,
  expandRecurringForMonth,
} from '../utils/recurrence';
import toast from 'react-hot-toast';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toLocalDateKey = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalTime = (isoString) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const QUEUE_POLL_MS = 20000;

const STATUS_STYLES = {
  scheduled: 'bg-[#168eea]/10 text-[#168eea]',
  processing: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  partial: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-600',
};

const statusLabel = (status) => {
  if (status === 'completed') return 'Posted';
  if (status === 'partial') return 'Posted (partial)';
  if (status === 'processing') return 'Posting…';
  if (status === 'failed') return 'Failed';
  return 'Upcoming';
};

const emptyRecurringForm = () => ({
  name: '',
  content: '',
  platforms: [],
  frequency: 'weekly',
  week_of_month: 1,
  days_of_week: [],
  time_utc: '09:00',
  media_url: null,
  media_type: null,
});

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [view, setView] = useState('calendar');
  const [showComposer, setShowComposer] = useState(false);
  const [platformConnections, setPlatformConnections] = useState({});
  const [loading, setLoading] = useState(true);
  const [recurringSchedules, setRecurringSchedules] = useState([]);
  const [recurringForm, setRecurringForm] = useState(emptyRecurringForm);
  const [savingRecurring, setSavingRecurring] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null);
  const mediaInputRef = useRef(null);

  const fetchScheduledPosts = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await posts.getScheduled();
      const upcoming = response.data?.upcoming || response.data?.posts || [];
      const recent = response.data?.recent || [];
      setScheduledPosts(upcoming);
      setRecentPosts(recent);
    } catch (error) {
      console.error('Failed to fetch scheduled posts:', error);
      if (!silent) toast.error('Failed to load scheduled posts');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchRecurringSchedules = useCallback(async () => {
    try {
      const response = await recurring.list();
      setRecurringSchedules(response.data?.schedules || []);
    } catch (error) {
      console.error('Failed to fetch recurring schedules:', error);
    }
  }, []);

  useEffect(() => {
    fetchScheduledPosts();
    fetchConnections();
    fetchRecurringSchedules();
  }, [fetchScheduledPosts, fetchRecurringSchedules]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchScheduledPosts({ silent: true });
    }, QUEUE_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchScheduledPosts]);

  const fetchConnections = async () => {
    try {
      const response = await platforms.getConnections();
      const connectionsObj = {};
      if (response.data?.platforms) {
        response.data.platforms.forEach((p) => {
          connectionsObj[p.platform] = p;
        });
      }
      setPlatformConnections(connectionsObj);
    } catch {
      /* silent */
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const recurringEventsByDay = useMemo(() => {
    const map = {};
    expandRecurringForMonth(recurringSchedules, year, month).forEach((event) => {
      if (!map[event.dateKey]) map[event.dateKey] = [];
      map[event.dateKey].push(event);
    });
    return map;
  }, [recurringSchedules, year, month]);

  const getPostsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const all = [...scheduledPosts, ...recentPosts];
    return all.filter((p) => toLocalDateKey(p.scheduled_at) === dateStr);
  };

  const getRecurringForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return recurringEventsByDay[dateStr] || [];
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this scheduled post?')) return;
    try {
      await posts.cancelScheduled(id);
      await fetchScheduledPosts();
      toast.success('Scheduled post removed');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove scheduled post');
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  const connectedPlatforms = Object.keys(platformConnections).filter(
    (p) => platformConnections[p]?.connected
  );

  const setFrequency = (frequency) => {
    setRecurringForm((prev) => ({
      ...prev,
      frequency,
      days_of_week:
        frequency === 'monthly_weekday'
          ? prev.days_of_week.slice(0, 1)
          : prev.days_of_week,
      week_of_month: prev.week_of_month || 1,
    }));
  };

  const toggleRecurringDay = (day) => {
    setRecurringForm((prev) => {
      if (prev.frequency === 'monthly_weekday') {
        return { ...prev, days_of_week: [day] };
      }
      return {
        ...prev,
        days_of_week: prev.days_of_week.includes(day)
          ? prev.days_of_week.filter((d) => d !== day)
          : [...prev.days_of_week, day],
      };
    });
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setRecurringForm((prev) => ({ ...prev, media_url: null, media_type: null }));
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const handleRecurringMedia = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) {
      toast.error('Please choose an image or video');
      return;
    }

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'recurring_media');
      const response = await posts.uploadMediaOnly(formData);
      const url =
        response.data?.media_url ||
        response.data?.url ||
        response.data?.secure_url ||
        response.data?.file_url;
      if (!url) throw new Error('No media URL returned');

      setMediaPreview(URL.createObjectURL(file));
      setRecurringForm((prev) => ({
        ...prev,
        media_url: url,
        media_type: isVideo ? 'video' : 'image',
      }));
      toast.success('Media attached');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload media');
      clearMedia();
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleCreateRecurring = async () => {
    if (!recurringForm.content.trim()) {
      toast.error('Enter post content');
      return;
    }
    if (recurringForm.platforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }
    if (recurringForm.days_of_week.length === 0) {
      toast.error(
        recurringForm.frequency === 'monthly_weekday'
          ? 'Select a weekday'
          : 'Select at least one day'
      );
      return;
    }

    setSavingRecurring(true);
    try {
      const payload = {
        name: recurringForm.name || null,
        content: recurringForm.content.trim(),
        platforms: recurringForm.platforms,
        frequency: recurringForm.frequency,
        week_of_month:
          recurringForm.frequency === 'monthly_weekday'
            ? recurringForm.week_of_month
            : null,
        days_of_week: recurringForm.days_of_week,
        time_utc: recurringForm.time_utc,
        media_url: recurringForm.media_url || null,
        media_type: recurringForm.media_type || null,
      };
      await recurring.create(payload);
      toast.success('Recurring schedule saved — it will appear on your calendar');
      setRecurringForm(emptyRecurringForm());
      clearMedia();
      await fetchRecurringSchedules();
      setView('calendar');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save recurring schedule');
    } finally {
      setSavingRecurring(false);
    }
  };

  const handleDeleteRecurring = async (id) => {
    if (!window.confirm('Delete this recurring schedule?')) return;
    try {
      await recurring.delete(id);
      toast.success('Recurring schedule deleted');
      await fetchRecurringSchedules();
    } catch (error) {
      toast.error('Failed to delete recurring schedule');
    }
  };

  const upcomingPosts = [...scheduledPosts].sort(
    (a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)
  );

  const postedQueue = [...recentPosts].sort(
    (a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at)
  );

  const renderQueueCard = (post, { showDelete = false } = {}) => (
    <div
      key={post.id}
      className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4"
    >
      {post.media_url && (
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {post.media_type === 'video' ? (
            <video src={post.media_url} className="w-full h-full object-cover" />
          ) : (
            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      )}
      <div className="flex-shrink-0 text-center">
        <div className="text-xs text-gray-400 uppercase">
          {new Date(post.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {new Date(post.scheduled_at).getDate()}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1 justify-center mt-1">
          <FiClock size={10} />
          {toLocalTime(post.scheduled_at)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
              STATUS_STYLES[post.status] || STATUS_STYLES.scheduled
            }`}
          >
            {statusLabel(post.status)}
          </span>
          {post.media_url && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
              {post.media_type === 'video' ? <FiVideo size={10} /> : <FiImage size={10} />}
              Media
            </span>
          )}
        </div>
        <p className="text-sm text-gray-800 line-clamp-2">{post.content}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(post.platforms || []).map((p) => (
            <span
              key={p}
              className="flex items-center gap-1 text-xs bg-gray-50 px-2 py-0.5 rounded-full text-gray-600"
            >
              {getPlatformIcon(p, 12)}
              {PLATFORM_DISPLAY_NAMES[p]}
            </span>
          ))}
        </div>
      </div>
      {showDelete && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => handleDelete(post.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Plan one-off and recurring posts — text and media
            </p>
          </div>
          <button
            onClick={() => setShowComposer(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white font-semibold rounded-lg transition-colors text-sm"
          >
            <FiPlus size={18} />
            Schedule Post
          </button>
        </div>

        <div className="flex gap-1 bg-white rounded-lg border border-gray-100 p-1 mb-6 w-fit">
          {['calendar', 'queue', 'recurring'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-[#168eea] text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
            Loading scheduled posts...
          </div>
        ) : view === 'calendar' ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500">
                <FiChevronLeft size={20} />
              </button>
              <h2 className="font-semibold text-gray-900">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500">
                <FiChevronRight size={20} />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-gray-50 flex flex-wrap gap-3 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#168eea]" /> One-off / posted
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-500" /> Recurring
              </span>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS_SHORT.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const dayPosts = getPostsForDay(day);
                const dayRecurring = getRecurringForDay(day);
                const isToday =
                  day &&
                  today.getDate() === day &&
                  today.getMonth() === month &&
                  today.getFullYear() === year;
                const items = [
                  ...dayPosts.map((p) => ({ type: 'post', data: p })),
                  ...dayRecurring.map((e) => ({ type: 'recurring', data: e })),
                ];

                return (
                  <div
                    key={i}
                    className={`min-h-[100px] border-b border-r border-gray-50 p-2 ${
                      !day ? 'bg-gray-50/50' : 'hover:bg-gray-50/30'
                    }`}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm ${
                            isToday
                              ? 'bg-[#168eea] text-white font-semibold'
                              : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {items.slice(0, 3).map((item, idx) => {
                            if (item.type === 'post') {
                              const post = item.data;
                              const posted = post.status && post.status !== 'scheduled';
                              return (
                                <div
                                  key={`p-${post.id}`}
                                  className={`text-[10px] rounded px-1.5 py-0.5 truncate cursor-pointer ${
                                    posted
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : 'bg-[#168eea]/10 text-[#168eea] hover:bg-[#168eea]/20'
                                  }`}
                                  title={post.content}
                                >
                                  {toLocalTime(post.scheduled_at)}
                                  {post.media_url ? ' · 📷' : ''} ·{' '}
                                  {posted ? 'Posted' : post.content?.slice(0, 16) || 'Scheduled'}
                                </div>
                              );
                            }
                            const schedule = item.data.schedule;
                            return (
                              <div
                                key={`r-${schedule.id}-${idx}`}
                                className="text-[10px] rounded px-1.5 py-0.5 truncate bg-violet-50 text-violet-700 hover:bg-violet-100 cursor-default"
                                title={`${describeRecurringSchedule(schedule)} — ${schedule.content || ''}`}
                              >
                                <span className="inline-flex items-center gap-0.5">
                                  <FiRepeat size={9} />
                                  {schedule.time_utc} · {schedule.name || schedule.content?.slice(0, 14) || 'Recurring'}
                                </span>
                              </div>
                            );
                          })}
                          {items.length > 3 && (
                            <div className="text-[10px] text-gray-400">+{items.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : view === 'queue' ? (
          <div className="space-y-8">
            <p className="text-sm text-gray-500">
              One-off schedules (including media). Use the composer — attach an image or video before scheduling.
            </p>
            {upcomingPosts.length === 0 && postedQueue.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-[#168eea]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="text-[#168eea]" size={28} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">No scheduled posts</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Schedule text or media posts from the composer
                </p>
                <button
                  onClick={() => setShowComposer(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#168eea] text-white font-semibold rounded-lg text-sm"
                >
                  <FiPlus size={16} />
                  Schedule Post
                </button>
              </div>
            ) : (
              <>
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Upcoming</h3>
                    <span className="text-xs text-gray-400">{upcomingPosts.length}</span>
                  </div>
                  {upcomingPosts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 text-sm text-gray-400 text-center">
                      Nothing queued — new schedules will appear here
                    </div>
                  ) : (
                    upcomingPosts.map((post) => renderQueueCard(post, { showDelete: true }))
                  )}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Posted</h3>
                    <span className="text-xs text-gray-400">{postedQueue.length}</span>
                  </div>
                  {postedQueue.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-6 text-sm text-gray-400 text-center">
                      After a schedule goes live, it will show here as Posted
                    </div>
                  ) : (
                    postedQueue.map((post) => renderQueueCard(post))
                  )}
                </section>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h3 className="font-semibold text-gray-900">Create recurring schedule</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Weekly days, or the 1st / 2nd / 3rd / 4th / last weekday of each month — with optional media.
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
                  <FiRepeat size={18} />
                </div>
              </div>

              <input
                value={recurringForm.name}
                onChange={(e) => setRecurringForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Schedule name (optional)"
                className="w-full mb-3 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
              />
              <textarea
                value={recurringForm.content}
                onChange={(e) => setRecurringForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="What should be posted?"
                rows={4}
                className="w-full mb-4 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
              />

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Media (optional)</p>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleRecurringMedia}
                  />
                  <button
                    type="button"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploadingMedia}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {uploadingMedia ? 'Uploading…' : (
                      <>
                        <FiImage size={16} />
                        Add image or video
                      </>
                    )}
                  </button>
                  {(mediaPreview || recurringForm.media_url) && (
                    <div className="relative">
                      {recurringForm.media_type === 'video' ? (
                        <video
                          src={mediaPreview || recurringForm.media_url}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      ) : (
                        <img
                          src={mediaPreview || recurringForm.media_url}
                          alt=""
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                      )}
                      <button
                        type="button"
                        onClick={clearMedia}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Platforms</p>
                <div className="flex flex-wrap gap-2">
                  {connectedPlatforms.map((platform) => {
                    const selected = recurringForm.platforms.includes(platform);
                    return (
                      <button
                        key={platform}
                        type="button"
                        onClick={() =>
                          setRecurringForm((prev) => ({
                            ...prev,
                            platforms: selected
                              ? prev.platforms.filter((p) => p !== platform)
                              : [...prev.platforms, platform],
                          }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border ${
                          selected
                            ? 'bg-[#168eea]/10 text-[#168eea] border-[#168eea]/30'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {getPlatformIcon(platform, 12)}
                        {PLATFORM_DISPLAY_NAMES[platform]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Repeat</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    { id: 'weekly', label: 'Every week' },
                    { id: 'monthly_weekday', label: 'Monthly (e.g. 1st Monday)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFrequency(opt.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border ${
                        recurringForm.frequency === opt.id
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {recurringForm.frequency === 'monthly_weekday' && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">Which week of the month?</p>
                    <div className="flex flex-wrap gap-2">
                      {WEEK_OF_MONTH_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setRecurringForm((prev) => ({ ...prev, week_of_month: opt.value }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs border ${
                            recurringForm.week_of_month === opt.value
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-2">
                  {recurringForm.frequency === 'monthly_weekday' ? 'Weekday' : 'Days'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {DAYS_SHORT.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleRecurringDay(index)}
                      className={`px-3 py-1.5 rounded-lg text-xs border ${
                        recurringForm.days_of_week.includes(index)
                          ? 'bg-[#168eea] text-white border-[#168eea]'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                      title={DAYS_LONG[index]}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-5">
                <label className="text-xs text-gray-500">Time (UTC)</label>
                <input
                  type="time"
                  value={recurringForm.time_utc}
                  onChange={(e) =>
                    setRecurringForm((prev) => ({ ...prev, time_utc: e.target.value }))
                  }
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              {recurringForm.days_of_week.length > 0 && (
                <p className="text-xs text-violet-700 bg-violet-50 rounded-xl px-3 py-2 mb-4">
                  {describeRecurringSchedule(recurringForm)}
                </p>
              )}

              <button
                type="button"
                onClick={handleCreateRecurring}
                disabled={savingRecurring || uploadingMedia}
                className="px-5 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {savingRecurring ? 'Saving...' : 'Save recurring schedule'}
              </button>
            </div>

            <div className="space-y-3">
              {recurringSchedules.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                  No recurring schedules yet — create one above and it will show on the calendar
                </div>
              ) : (
                recurringSchedules.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 min-w-0">
                        {item.media_url && (
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.media_type === 'video' ? (
                              <video src={item.media_url} className="w-full h-full object-cover" />
                            ) : (
                              <img src={item.media_url} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {item.name || 'Recurring post'}
                            </h4>
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                              <FiRepeat size={10} />
                              {(item.frequency || 'weekly') === 'monthly_weekday'
                                ? 'Monthly'
                                : 'Weekly'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.content}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {describeRecurringSchedule(item)}
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(item.platforms || []).map((p) => (
                              <span
                                key={p}
                                className="flex items-center gap-1 text-[10px] bg-gray-50 px-2 py-0.5 rounded-full text-gray-600"
                              >
                                {getPlatformIcon(p, 10)}
                                {PLATFORM_DISPLAY_NAMES[p]}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRecurring(item.id)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <PostComposerModal
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          fetchScheduledPosts();
        }}
        platformConnections={platformConnections}
        onPublishSuccess={fetchScheduledPosts}
        defaultScheduleMode="later"
      />
    </div>
  );
};

export default Schedule;

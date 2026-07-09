import React, { useState, useEffect } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiCalendar,
  FiClock,
  FiTrash2,
} from 'react-icons/fi';
import { getPlatformIcon, PLATFORM_DISPLAY_NAMES } from '../constants/platforms';
import PostComposerModal from '../components/post/PostComposerModal';
import { platforms } from '../services/api';
import toast from 'react-hot-toast';

import { getScheduledPosts, deleteScheduledPost } from '../utils/scheduledPosts';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const Schedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [view, setView] = useState('calendar');
  const [showComposer, setShowComposer] = useState(false);
  const [platformConnections, setPlatformConnections] = useState({});

  useEffect(() => {
    setScheduledPosts(getScheduledPosts());
    fetchConnections();
  }, []);

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

  const getPostsForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledPosts.filter((p) => p.scheduledDate === dateStr);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Remove this scheduled post?')) return;
    deleteScheduledPost(id);
    setScheduledPosts(getScheduledPosts());
    toast.success('Scheduled post removed');
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const today = new Date();

  const upcomingPosts = [...scheduledPosts]
    .filter((p) => new Date(`${p.scheduledDate}T${p.scheduledTime}`) >= new Date())
    .sort((a, b) =>
      new Date(`${a.scheduledDate}T${a.scheduledTime}`) -
      new Date(`${b.scheduledDate}T${b.scheduledTime}`)
    );

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Plan and queue your content calendar
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

        {/* View toggle */}
        <div className="flex gap-1 bg-white rounded-lg border border-gray-100 p-1 mb-6 w-fit">
          {['calendar', 'queue'].map((v) => (
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

        {view === 'calendar' ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Calendar header */}
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

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                const posts = getPostsForDay(day);
                const isToday =
                  day &&
                  today.getDate() === day &&
                  today.getMonth() === month &&
                  today.getFullYear() === year;

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
                          {posts.slice(0, 2).map((post) => (
                            <div
                              key={post.id}
                              className="text-[10px] bg-[#168eea]/10 text-[#168eea] rounded px-1.5 py-0.5 truncate cursor-pointer hover:bg-[#168eea]/20"
                              title={post.content}
                            >
                              {post.scheduledTime} · {post.content?.slice(0, 20)}...
                            </div>
                          ))}
                          {posts.length > 2 && (
                            <div className="text-[10px] text-gray-400">+{posts.length - 2} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingPosts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-[#168eea]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="text-[#168eea]" size={28} />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">No scheduled posts</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Schedule your first post to see it in your queue
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
              upcomingPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4"
                >
                  <div className="flex-shrink-0 text-center">
                    <div className="text-xs text-gray-400 uppercase">
                      {new Date(post.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {new Date(post.scheduledDate).getDate()}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 justify-center mt-1">
                      <FiClock size={10} />
                      {post.scheduledTime}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <PostComposerModal
        isOpen={showComposer}
        onClose={() => {
          setShowComposer(false);
          setScheduledPosts(getScheduledPosts());
        }}
        platformConnections={platformConnections}
        onPublishSuccess={() => setScheduledPosts(getScheduledPosts())}
        defaultScheduleMode="later"
      />
    </div>
  );
};

export default Schedule;

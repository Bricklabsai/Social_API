import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiPlus,
  FiTrash2,
  FiZap,
  FiRefreshCw,
  FiEdit2,
  FiX,
  FiLayers,
  FiChevronDown,
} from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { assistant, contentIdeas } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isPremiumPlan } from '../utils/plan';
import UpgradeGate from '../components/UpgradeGate';

const COLUMNS = [
  { id: 'planned', label: 'Plan', hint: 'Ideas to explore' },
  { id: 'todo', label: 'To do', hint: 'Ready to work on' },
  { id: 'in_progress', label: 'In progress', hint: 'Currently drafting' },
  { id: 'done', label: 'Done', hint: 'Published or finished' },
];

const PERIOD_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annually' },
];

const CONTENT_TYPE_OPTIONS = [
  { value: 'influencer', label: 'Influencer' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'tech', label: 'Tech / SaaS' },
  { value: 'education', label: 'Education' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'personal_brand', label: 'Personal brand' },
];

const Create = () => {
  const { user } = useAuth();
  const canUseAi = isPremiumPlan(user?.plan);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('');
  const [period, setPeriod] = useState('weekly');
  const [contentType, setContentType] = useState('influencer');
  const [generating, setGenerating] = useState(false);
  const [draggedId, setDraggedId] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newStatus, setNewStatus] = useState('planned');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const fetchIdeas = useCallback(async () => {
    try {
      const response = await contentIdeas.list();
      setIdeas(response.data?.ideas || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load ideas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  const byStatus = useMemo(() => {
    const map = { planned: [], todo: [], in_progress: [], done: [] };
    ideas.forEach((idea) => {
      const status = map[idea.status] ? idea.status : 'planned';
      map[status].push(idea);
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.id - b.id);
    });
    return map;
  }, [ideas]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const response = await contentIdeas.create({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        status: newStatus,
      });
      setIdeas((prev) => [...prev, response.data.idea]);
      setShowNewModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewStatus('planned');
      toast.success('Idea added');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create idea');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateIdeas = async () => {
    if (!canUseAi) {
      toast.error('AI idea generation is available on Pro plans');
      return;
    }
    setGenerating(true);
    try {
      const response = await assistant.generate({
        action: 'ideas',
        content: topic,
        topic: topic || 'social media growth',
        period,
        content_type: contentType,
      });
      const suggestions = response.data?.suggestions || [];
      if (!suggestions.length) {
        toast.error('No ideas generated. Try another topic.');
        return;
      }
      const bulk = await contentIdeas.createBulk({
        status: 'planned',
        ideas: suggestions.map((title) => ({ title })),
      });
      setIdeas((prev) => [...prev, ...(bulk.data?.ideas || [])]);
      toast.success(`Added ${suggestions.length} AI ideas to Plan`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate ideas');
    } finally {
      setGenerating(false);
    }
  };

  const moveIdea = async (ideaId, toStatus, toIndex) => {
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;

    const previous = ideas;
    const without = ideas.filter((i) => i.id !== ideaId);
    const columnItems = without
      .filter((i) => i.status === toStatus)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const insertAt = Math.max(0, Math.min(toIndex, columnItems.length));
    columnItems.splice(insertAt, 0, { ...idea, status: toStatus });

    const reindexed = columnItems.map((item, idx) => ({ ...item, position: idx }));
    const other = without.filter((i) => i.status !== toStatus);
    setIdeas([...other, ...reindexed]);

    try {
      await contentIdeas.update(ideaId, { status: toStatus, position: insertAt });
      await Promise.all(
        reindexed
          .filter((item) => item.id !== ideaId)
          .map((item) => contentIdeas.update(item.id, { position: item.position }))
      );
    } catch (error) {
      setIdeas(previous);
      toast.error(error.response?.data?.detail || 'Failed to move idea');
    }
  };

  const handleDrop = (status, index) => {
    if (draggedId == null) return;
    moveIdea(draggedId, status, index);
    setDraggedId(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this idea?')) return;
    try {
      await contentIdeas.delete(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
      toast.success('Idea deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const startEdit = (idea) => {
    setEditingId(idea.id);
    setEditTitle(idea.title);
    setEditDescription(idea.description || '');
  };

  const saveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    try {
      const response = await contentIdeas.update(editingId, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setIdeas((prev) => prev.map((i) => (i.id === editingId ? response.data.idea : i)));
      setEditingId(null);
      toast.success('Idea updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-40 animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-white rounded-xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FiLayers className="text-[#168eea]" size={24} />
            Create
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Plan content, drag cards between columns, and generate ideas with AI
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => {
              setLoading(true);
              fetchIdeas();
            }}
            className="inline-flex items-center justify-center w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 hover:border-[#168eea]/30 transition-colors"
            title="Refresh"
          >
            <FiRefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-lg text-sm font-medium whitespace-nowrap shadow-sm shadow-[#168eea]/20 transition-colors"
          >
            <FiPlus size={16} />
            New idea
          </button>
        </div>
      </div>

      {/* AI controls — separate row so nothing crowds the primary CTA */}
      {canUseAi ? (
        <div className="mb-6 rounded-xl border border-[#168eea]/15 bg-gradient-to-r from-[#168eea]/5 to-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <FiZap className="text-[#168eea]" size={16} />
            <span className="text-sm font-semibold text-gray-800">AI idea generator</span>
            <span className="text-xs text-gray-400">Pick a period, niche, and topic</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#168eea] mb-1.5">
                Period
              </span>
              <div className="relative">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full appearance-none pl-3 pr-9 py-2.5 text-sm font-medium text-gray-800 bg-white border border-[#168eea]/25 rounded-lg shadow-sm hover:border-[#168eea]/50 focus:outline-none focus:ring-2 focus:ring-[#168eea]/25 focus:border-[#168eea] transition-colors cursor-pointer"
                  title="Content planning period"
                >
                  {PERIOD_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#168eea]">
                  <FiChevronDown size={16} />
                </span>
              </div>
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#168eea] mb-1.5">
                Content type
              </span>
              <div className="relative">
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full appearance-none pl-3 pr-9 py-2.5 text-sm font-medium text-gray-800 bg-white border border-[#168eea]/25 rounded-lg shadow-sm hover:border-[#168eea]/50 focus:outline-none focus:ring-2 focus:ring-[#168eea]/25 focus:border-[#168eea] transition-colors cursor-pointer"
                  title="Content niche / type"
                >
                  {CONTENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#168eea]">
                  <FiChevronDown size={16} />
                </span>
              </div>
            </label>

            <label className="block sm:col-span-2 lg:col-span-1">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-[#168eea] mb-1.5">
                Topic
              </span>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. growing a SaaS on LinkedIn"
                className="w-full px-3 py-2.5 text-sm text-gray-800 bg-white border border-[#168eea]/25 rounded-lg shadow-sm placeholder:text-gray-400 hover:border-[#168eea]/50 focus:outline-none focus:ring-2 focus:ring-[#168eea]/25 focus:border-[#168eea] transition-colors"
              />
            </label>

            <button
              onClick={handleGenerateIdeas}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-lg text-sm font-medium disabled:opacity-50 shadow-sm shadow-[#168eea]/20 transition-colors"
            >
              {generating ? <FaSpinner className="animate-spin" /> : <FiZap size={16} />}
              Generate ideas
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <UpgradeGate feature="AI idea generation" compact />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((column) => (
          <div
            key={column.id}
            className="bg-[#f0f2f5] rounded-xl border border-gray-200/80 min-h-[420px] flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column.id, byStatus[column.id].length)}
          >
            <div className="px-3 py-3 border-b border-gray-200/80">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">{column.label}</h2>
                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                  {byStatus[column.id].length}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">{column.hint}</p>
            </div>

            <div className="p-2 space-y-2 flex-1">
              {byStatus[column.id].map((idea, index) => (
                <div
                  key={idea.id}
                  draggable={editingId !== idea.id}
                  onDragStart={() => setDraggedId(idea.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleDrop(column.id, index);
                  }}
                  className={`bg-white rounded-lg border border-gray-100 p-3 shadow-sm cursor-grab active:cursor-grabbing ${
                    draggedId === idea.id ? 'opacity-50' : ''
                  }`}
                >
                  {editingId === idea.id ? (
                    <div className="space-y-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 resize-none"
                        placeholder="Notes (optional)"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          className="px-2.5 py-1 text-xs bg-[#168eea] text-white rounded-md"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900 leading-snug">{idea.title}</p>
                      {idea.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-3">{idea.description}</p>
                      )}
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <button
                          onClick={() => startEdit(idea)}
                          className="p-1 text-gray-400 hover:text-[#168eea] rounded"
                          title="Edit"
                        >
                          <FiEdit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(idea.id)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                          title="Delete"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {byStatus[column.id].length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-300 rounded-lg mx-1">
                  Drop ideas here
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">New idea</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
                  placeholder="What's the idea?"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30 resize-none"
                  placeholder="Optional details"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Column</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-[#168eea] hover:bg-[#1378d4] text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? <FaSpinner className="animate-spin inline" /> : 'Add idea'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Create;

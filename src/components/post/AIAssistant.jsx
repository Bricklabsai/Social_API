import React, { useState } from 'react';
import { FiZap, FiX, FiRefreshCw, FiHash, FiMinimize2, FiMaximize2, FiBriefcase } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';

const HASHTAG_SETS = {
  general: ['#socialmedia', '#contentcreator', '#digitalmarketing', '#growth', '#branding'],
  business: ['#entrepreneur', '#startup', '#business', '#leadership', '#success'],
  lifestyle: ['#lifestyle', '#motivation', '#inspiration', '#goals', '#mindset'],
  tech: ['#technology', '#innovation', '#ai', '#future', '#tech'],
};

const TONE_REWRITES = {
  professional: (text) =>
    text
      .replace(/!/g, '.')
      .replace(/\b(awesome|cool|amazing)\b/gi, 'excellent')
      .replace(/\b(hey|hi)\b/gi, 'Hello')
      + '\n\n— Shared via SocialHub',

  casual: (text) => {
    const emojis = ['✨', '🙌', '💡', '🔥'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${emoji} ${text.replace(/\./g, '!')} ${emoji}`;
  },

  shorter: (text) => {
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    return sentences.slice(0, 2).join('. ').trim() + (sentences.length > 2 ? '...' : '');
  },
};

const generateIdeas = (topic) => {
  const base = topic || 'your brand';
  return [
    `5 things I wish I knew before growing ${base} on social media`,
    `Behind the scenes: how we create content for ${base}`,
    `The #1 mistake most brands make on social (and how to fix it)`,
    `Quick tip: consistency beats perfection every time 📈`,
    `Ask me anything about ${base} — drop your questions below!`,
  ];
};

const AIAssistant = ({ content, onApply, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [topic, setTopic] = useState('');

  const simulateAI = async (action, result) => {
    setLoading(true);
    setSuggestions([]);
    await new Promise((r) => setTimeout(r, 800));
    setSuggestions(Array.isArray(result) ? result : [result]);
    setLoading(false);
  };

  const actions = [
    {
      id: 'improve',
      label: 'Improve caption',
      icon: FiMaximize2,
      run: () =>
        simulateAI('improve', content
          ? `${content.trim()}\n\n✨ What do you think? Let us know in the comments!`
          : 'Start writing your caption and I\'ll help polish it for maximum engagement.'),
    },
    {
      id: 'hashtags',
      label: 'Add hashtags',
      icon: FiHash,
      run: () => {
        const tags = HASHTAG_SETS.general.slice(0, 5).join(' ');
        simulateAI('hashtags', content ? `${content}\n\n${tags}` : tags);
      },
    },
    {
      id: 'shorter',
      label: 'Make shorter',
      icon: FiMinimize2,
      run: () =>
        simulateAI('shorter', content ? TONE_REWRITES.shorter(content) : 'Write something first, then I\'ll trim it down.'),
    },
    {
      id: 'professional',
      label: 'Professional tone',
      icon: FiBriefcase,
      run: () =>
        simulateAI('professional', content ? TONE_REWRITES.professional(content) : 'Add your draft and I\'ll make it more professional.'),
    },
    {
      id: 'ideas',
      label: 'Generate ideas',
      icon: FiZap,
      run: () => simulateAI('ideas', generateIdeas(topic || 'social media')),
    },
  ];

  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-100 shadow-xl flex flex-col z-10">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#168eea]/10 rounded-lg flex items-center justify-center">
            <FiZap className="text-[#168eea]" size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI Assistant</p>
            <p className="text-[10px] text-gray-400">Powered by SocialHub AI</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
          <FiX size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-xs text-gray-500 mb-4">
          Get help writing captions, adding hashtags, and generating post ideas.
        </p>

        {actions.find((a) => a.id === 'ideas') && (
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic for ideas (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#168eea]/30"
          />
        )}

        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.run}
                disabled={loading}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-[#168eea]/5 hover:text-[#168eea] rounded-lg border border-gray-100 transition-colors disabled:opacity-50"
              >
                <Icon size={16} className="text-[#168eea] flex-shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-400">
            <FaSpinner className="animate-spin" size={18} />
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        {suggestions.length > 0 && !loading && (
          <div className="mt-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suggestions</p>
            {suggestions.map((s, i) => (
              <div key={i} className="bg-[#f8f9fb] rounded-lg p-3 border border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{s}</p>
                <button
                  onClick={() => onApply(s)}
                  className="text-xs text-[#168eea] font-medium hover:underline flex items-center gap-1"
                >
                  <FiRefreshCw size={12} />
                  Use this
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;

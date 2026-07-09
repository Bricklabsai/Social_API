import React, { useEffect, useRef, useState } from 'react';
import { mentions } from '../services/api';

const MENTION_REGEX = /@([A-Za-z0-9_]{0,15})$/;

const getMentionContext = (text, cursorPosition) => {
  const beforeCursor = text.slice(0, cursorPosition);
  const match = beforeCursor.match(MENTION_REGEX);
  if (!match) return null;

  return {
    query: match[1],
    start: beforeCursor.length - match[0].length,
    end: cursorPosition,
  };
};

const MentionTextarea = ({
  value,
  onChange,
  enableMentions = false,
  className = '',
  rows = 4,
  placeholder = "What's on your mind?",
  ...props
}) => {
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mentionContext, setMentionContext] = useState(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const closeSuggestions = () => {
    setIsOpen(false);
    setSuggestions([]);
    setActiveIndex(0);
    setMentionContext(null);
  };

  const fetchSuggestions = (query) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!enableMentions) {
      closeSuggestions();
      return;
    }

    if (!query) {
      setSuggestions([]);
      setIsOpen(true);
      setLoading(false);
      setActiveIndex(0);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await mentions.searchTwitter(query, 8);
        const results = response.data || [];
        setSuggestions(results);
        setIsOpen(true);
        setActiveIndex(0);
      } catch (error) {
        console.error('Mention search failed:', error);
        closeSuggestions();
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const updateMentionState = (text, cursorPosition) => {
    const context = getMentionContext(text, cursorPosition);
    setMentionContext(context);

    if (!enableMentions || !context) {
      closeSuggestions();
      return;
    }

    fetchSuggestions(context.query);
  };

  const handleChange = (event) => {
    onChange(event);
    updateMentionState(event.target.value, event.target.selectionStart);
  };

  const handleClick = (event) => {
    updateMentionState(event.target.value, event.target.selectionStart);
  };

  const handleKeyUp = (event) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
      return;
    }
    updateMentionState(event.target.value, event.target.selectionStart);
  };

  const insertMention = (user) => {
    if (!mentionContext || !textareaRef.current) return;

    const username = user.username;
    const before = value.slice(0, mentionContext.start);
    const after = value.slice(mentionContext.end);
    const mentionText = `@${username} `;
    const nextValue = `${before}${mentionText}${after}`;
    const nextCursor = before.length + mentionText.length;

    onChange({ target: { value: nextValue } });
    closeSuggestions();

    requestAnimationFrame(() => {
      if (!textareaRef.current) return;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleKeyDown = (event) => {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      insertMention(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeSuggestions();
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target)
      ) {
        closeSuggestions();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onClick={handleClick}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        rows={rows}
        placeholder={placeholder}
        className={className}
        {...props}
      />

      {enableMentions && isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Searching users...</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              {mentionContext?.query ? 'No users found' : 'Start typing a username'}
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto py-1">
              {suggestions.map((user, index) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      insertMention(user);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors ${
                      index === activeIndex ? 'bg-pink-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {user.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-600">
                        {(user.name || user.username || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {user.name}
                        {user.verified ? (
                          <span className="ml-1 text-sky-500" title="Verified">
                            ✓
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-gray-500">@{user.username}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {enableMentions && (
        <p className="mt-1 text-xs text-gray-400">
          Type <span className="font-medium text-gray-500">@</span> to mention X users
        </p>
      )}
    </div>
  );
};

export default MentionTextarea;

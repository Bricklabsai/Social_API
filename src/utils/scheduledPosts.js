const STORAGE_KEY = 'socialhub_scheduled_posts';

export const getScheduledPosts = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const saveScheduledPost = (post) => {
  const existing = getScheduledPosts();
  const entry = {
    ...post,
    id: `sched-${Date.now()}`,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  existing.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  return entry;
};

export const deleteScheduledPost = (id) => {
  const filtered = getScheduledPosts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

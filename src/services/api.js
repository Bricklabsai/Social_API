import axios from 'axios';
import toast from 'react-hot-toast';

// Use environment variable or fallback to Render URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://socialbackend.bricklabsai.com/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Default timeout for normal requests
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'undefined' && token !== 'null') {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config?.skipErrorToast) {
      return Promise.reject(error);
    }

    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }
    
    const { status, data } = error.response;
    
    if (status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      toast.error('Session expired. Please login again.');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error('You don\'t have permission to perform this action.');
    } else if (status === 404) {
      toast.error('Resource not found.');
    } else if (status === 422) {
      const errorMsg = data?.detail || data?.message || 'Validation error. Please check your input.';
      toast.error(errorMsg);
    } else if (status === 429) {
      toast.error('Too many requests. Please wait a moment and try again.');
    } else if (status === 500) {
      toast.error('Server error. Please try again later.');
    } else {
      const message = data?.detail || data?.message || data?.error || 'An error occurred. Please try again.';
      if (typeof message === 'string' && message.length > 0) {
        toast.error(message);
      } else {
        toast.error('An error occurred. Please try again.');
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const auth = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  me: () => api.get('/users/me'),
  getBadges: () => api.get('/users/me/badges'),
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  },
};

// ============================================
// PLATFORMS API
// ============================================
export const platforms = {
  getConnections: async () => {
    try {
      const response = await api.get('/users/me/platforms');
      let platformsData = [];
      
      if (response.data && response.data.platforms) {
        platformsData = response.data.platforms;
      } else if (Array.isArray(response.data)) {
        platformsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        platformsData = Object.entries(response.data).map(([key, value]) => ({
          platform: key,
          ...value
        }));
      }
      
      const profileImageUrl = response.data?.profile_image_url || null;
      return { data: { platforms: platformsData, profile_image_url: profileImageUrl } };
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      throw error;
    }
  },
  
  connect: (platform) => {
    try {
      if (platform === 'bluesky') {
        toast('Use the Bluesky connect form on the dashboard');
        window.location.href = '/dashboard?platform=bluesky&connect=1';
        return;
      }

      let userId = 1;
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          const user = JSON.parse(userStr);
          userId = user.id || 1;
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      }
      
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authUrl = `${API_BASE_URL}/auth/${platform}/connect?user_id=${userId}`;
      
      const authWindow = window.open(
        authUrl,
        `${platform}_auth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!authWindow) {
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }
      
      const checkInterval = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkInterval);
          toast.success(`${platform} connection updated`);
        }
      }, 500);
      
    } catch (error) {
      console.error('Connection error:', error);
      toast.error(`Failed to connect ${platform}`);
      throw error;
    }
  },

  /** Bluesky uses AT Proto app passwords (no browser OAuth redirect). */
  connectBluesky: (identifier, appPassword) => {
    let userId = null;
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        userId = JSON.parse(userStr)?.id || null;
      } catch {
        /* ignore */
      }
    }
    return api.post('/auth/bluesky/connect', {
      identifier,
      app_password: appPassword,
      ...(userId ? { user_id: userId } : {}),
    });
  },
  
  disconnect: (platform, tokenId = null) =>
    api.delete(`/auth/${platform}/tokens${tokenId ? `?token_id=${tokenId}` : ''}`),
  getStatus: (platform) => api.get(`/auth/${platform}/tokens`),
};

// ============================================
// POSTS API - FIXED with proper toast handling
// ============================================
export const posts = {
  publish: (data) => api.post('/publish/', data),
  uploadMediaOnly: (formData) =>
    api.post('/publish/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    }),
  uploadFile: (formData) => api.post('/publish/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000,
  }),
  
  publishWithMedia: (formData) => {
    let loadingToastId = null;
    
    return api.post('/publish/upload-with-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 180000,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`📤 Upload progress: ${percentCompleted}%`);
        
        // Only update toast at key milestones
        if (percentCompleted === 100) {
          if (loadingToastId) {
            toast.dismiss(loadingToastId);
          }
          loadingToastId = toast.loading('Processing media...', { id: 'upload-progress' });
        } else if (percentCompleted > 0 && percentCompleted < 100 && percentCompleted % 25 === 0) {
          if (loadingToastId) {
            toast.dismiss(loadingToastId);
          }
          loadingToastId = toast.loading(`Uploading... ${percentCompleted}%`, { id: 'upload-progress' });
        }
      },
    }).then(response => {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      return response;
    }).catch(error => {
      if (loadingToastId) {
        toast.dismiss(loadingToastId);
      }
      throw error;
    });
  },
  
  publishBackground: (data) => api.post('/publish/background', data),
  getPosts: (limit = 20, includeTwitterFeed = false, includeTiktokFeed = false) =>
    api.get(
      `/publish/posts?limit=${limit}&include_twitter_feed=${includeTwitterFeed}&include_tiktok_feed=${includeTiktokFeed}`
    ),
  getPost: (id) => api.get(`/publish/posts/${id}`),
  deletePost: (id, deleteFromSocial = true) => {
    return api.delete(`/posts/${id}?delete_from_social=${deleteFromSocial}`);
  },
  batchDelete: (postIds, deleteFromSocial = true) => {
    return api.delete(`/posts/batch?delete_from_social=${deleteFromSocial}`, {
      data: postIds,
    });
  },
  getThreads: (limit = 10) => api.get(`/publish/threads?limit=${limit}`),
  postThread: (tweets, tokenId = null) =>
    api.post('/publish/thread', { tweets, token_id: tokenId }),
  postThreadsThread: (posts, tokenId = null) =>
    api.post('/publish/threads/thread', { posts, token_id: tokenId }),
  publishTwitterPoll: (data) => api.post('/publish/twitter/poll', data),
  getStatus: (taskId) => api.get(`/publish/status/${taskId}`),
  schedule: (data) => api.post('/publish/schedule', data),
  scheduleWithMedia: (formData) =>
    api.post('/publish/schedule/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000,
    }),
  getScheduled: () => api.get('/publish/scheduled'),
  cancelScheduled: (postId) => api.delete(`/publish/scheduled/${postId}`),
};

export const recurring = {
  list: () => api.get('/recurring/'),
  create: (data) => api.post('/recurring/', data),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  delete: (id) => api.delete(`/recurring/${id}`),
};
// ============================================
// ANALYTICS API
// ============================================
export const analytics = {
  getSummary: () => api.get('/analytics/summary'),
  getPostAnalytics: (postId) => api.get(`/analytics/${postId}`),
  getPlatformAnalytics: (platform) => api.get(`/analytics/platform/${platform}`),
  refresh: () => api.post('/analytics/refresh'),
  refreshPost: (postId) => api.post(`/analytics/refresh/${postId}`),
};

// ============================================
// COMMENTS API
// ============================================
export const comments = {
  getInbox: (limit = 50) => api.get(`/comments/inbox?limit=${limit}`),
  getFilteredInbox: (filterType = 'all', platform = null, limit = 100) => {
    const params = new URLSearchParams({ filter_type: filterType, limit });
    if (platform && platform !== 'all') params.append('platform', platform);
    return api.get(`/comments/inbox/filtered?${params.toString()}`);
  },
  getPostComments: (postId, platform, limit = 50) => 
    api.get(`/comments/posts/${postId}/${platform}?limit=${limit}`),
  replyToComment: (platform, commentId, replyText) => 
    api.post(`/comments/${platform}/${commentId}/reply`, { reply_text: replyText }),
  getPlatforms: () => api.get('/comments/platforms'),
};

// ============================================
// MESSAGES API
// ============================================
export const messages = {
  getMessages: (platform = null, limit = 50) => {
    const params = new URLSearchParams();
    if (platform && platform !== 'all') params.append('platform', platform);
    params.append('limit', limit);
    return api.get(`/messages/?${params.toString()}`);
  },
  getPlatforms: () => api.get('/messages/platforms'),
  getMessageDetail: (platform, messageId) => api.get(`/messages/${platform}/${messageId}`),
  markRead: ({ conversationId, peerKey, platform, peerId } = {}) =>
    api.post('/messages/mark-read', {
      conversation_id: conversationId || null,
      peer_key: peerKey || null,
      platform: platform || null,
      peer_id: peerId || null,
    }),
  replyToMessage: (platform, message, recipientId = null) => {
    return api.post(`/messages/${platform}/reply`, {
      message: message,
      recipient_id: recipientId
    });
  },
  deleteConversation: (conversationId) =>
    api.delete(`/messages/conversation/${conversationId}`),
};

// ============================================
// API KEYS
// ============================================
export const apiKeys = {
  list: () => api.get('/api-keys/list'),
  create: (data) => api.post('/api-keys/create', data),
  update: (keyId, data) => api.put(`/api-keys/${keyId}`, data),
  delete: (keyId) => api.delete(`/api-keys/${keyId}`),
};

// ============================================
// MENTIONS API
// ============================================
export const mentions = {
  searchTwitter: (query, limit = 8) =>
    api.get('/mentions/twitter', {
      params: { q: query, limit },
    }),
};

// ============================================
// ASSISTANT API
// ============================================
export const assistant = {
  generate: (data) => api.post('/assistant/generate', data),
};

// ============================================
// STUDIO API — AI content repurposing
// ============================================
export const studio = {
  listJobs: (limit = 20) =>
    api.get(`/studio/jobs?limit=${limit}`, { skipErrorToast: true }),
  getJob: (id) => api.get(`/studio/jobs/${id}`, { skipErrorToast: true }),
  deleteJob: (id) => api.delete(`/studio/jobs/${id}`),
  createJob: (formData) =>
    api.post('/studio/jobs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
    }),
  sendToBoard: (jobId, data = {}) =>
    api.post(`/studio/jobs/${jobId}/send-to-board`, data),
  getPlatforms: () => api.get('/studio/platforms', { skipErrorToast: true }),
};

// ============================================
// TEMPLATES API
// ============================================
export const templates = {
  list: () => api.get('/templates/'),
  create: (data) => api.post('/templates/', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`),
};

// ============================================
// CONTENT IDEAS (Create board)
// ============================================
export const contentIdeas = {
  list: (status) =>
    api.get('/content-ideas/', { params: status ? { status } : {} }),
  create: (data) => api.post('/content-ideas/', data),
  createBulk: (data) => api.post('/content-ideas/bulk', data),
  update: (id, data) => api.patch(`/content-ideas/${id}`, data),
  delete: (id) => api.delete(`/content-ideas/${id}`),
};

// ============================================
// TEAM API
// ============================================
export const team = {
  list: () => api.get('/users/me/team'),
  add: (data) => api.post('/users/me/team', data),
};

// ============================================
// SETTINGS API - FIXED
// ============================================
export const settings = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data) => api.put('/settings/profile', data),
  changePassword: (data) => api.post('/settings/change-password', data),
  // FIXED: These match the backend endpoints
  getApiKeys: () => api.get('/api-keys/list'),
  generateApiKey: (data) => api.post('/api-keys/create', data),
  revokeApiKey: (publicKey) => api.post(`/api-keys/${publicKey}/revoke`),
};

export default api;

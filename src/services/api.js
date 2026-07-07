import axios from 'axios';
import toast from 'react-hot-toast';

// Use environment variable or fallback to Render URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://unified-social-api.onrender.com/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
      
      return { data: { platforms: platformsData } };
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      throw error;
    }
  },
  
  connect: (platform) => {
    try {
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
  
  disconnect: (platform) => api.delete(`/auth/${platform}/tokens`),
  getStatus: (platform) => api.get(`/auth/${platform}/tokens`),
};

// ============================================
// POSTS API
// ============================================
export const posts = {
  publish: (data) => api.post('/publish/', data),
  
  uploadFile: (formData) => api.post('/publish/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  
  publishWithMedia: (formData) => {
    return api.post('/publish/upload-with-media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  publishBackground: (data) => api.post('/publish/background', data),
  getPosts: (limit = 20) => api.get(`/publish/posts?limit=${limit}`),
  getPost: (id) => api.get(`/publish/posts/${id}`),
  deletePost: (id, deleteFromSocial = true) => {
    // FIXED: Pass delete_from_social as query parameter
    return api.delete(`/publish/posts/${id}?delete_from_social=${deleteFromSocial}`);
  },
  // FIXED: Added batchDelete method
  batchDelete: (postIds, deleteFromSocial = true) => {
    return api.post('/publish/posts/batch-delete', {
      post_ids: postIds,
      delete_from_social: deleteFromSocial
    });
  },
  getThreads: (limit = 10) => api.get(`/publish/threads?limit=${limit}`),
  postThread: (tweets) => api.post('/publish/thread', { tweets }),
  getStatus: (taskId) => api.get(`/publish/status/${taskId}`),
};

// ============================================
// ANALYTICS API
// ============================================
export const analytics = {
  getSummary: () => api.get('/analytics/summary'),
  getPostAnalytics: (postId) => api.get(`/analytics/${postId}`),
  refresh: () => api.post('/analytics/refresh'),
  refreshPost: (postId) => api.post(`/analytics/refresh/${postId}`),
};

// ============================================
// COMMENTS API
// ============================================
export const comments = {
  getInbox: (limit = 20) => api.get(`/comments/inbox?limit=${limit}`),
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
    return api.get(`/messages?${params.toString()}`);
  },
  getPlatforms: () => api.get('/messages/platforms'),
  getMessageDetail: (platform, messageId) => api.get(`/messages/${platform}/${messageId}`),
  replyToMessage: (platform, message, recipientId = null) => {
    return api.post(`/messages/${platform}/reply`, {
      message: message,
      recipient_id: recipientId
    });
  },
};

// ============================================
// API KEYS - FIXED to match Settings page expectations
// ============================================
export const apiKeys = {
  // FIXED: list() instead of getKeys()
  list: () => api.get('/settings/api-keys'),
  // FIXED: create() instead of generateKey()
  create: (data) => api.post('/settings/api-keys/generate', data),
  // FIXED: update() for toggling active status
  update: (keyId, data) => api.put(`/settings/api-keys/${keyId}`, data),
  // FIXED: delete() instead of revokeKey()
  delete: (keyId) => api.delete(`/settings/api-keys/${keyId}`),
  // Keep the old methods for backward compatibility
  getKeys: () => api.get('/settings/api-keys'),
  generateKey: (data) => api.post('/settings/api-keys/generate', data),
  revokeKey: (publicKey) => api.post(`/settings/api-keys/${publicKey}/revoke`),
};

// ============================================
// SETTINGS API
// ============================================
export const settings = {
  getProfile: () => api.get('/settings/profile'),
  updateProfile: (data) => api.put('/settings/profile', data),
  changePassword: (data) => api.post('/settings/change-password', data),
  getApiKeys: () => api.get('/settings/api-keys'),
  generateApiKey: (data) => api.post('/settings/api-keys/generate', data),
  revokeApiKey: (publicKey) => api.post(`/settings/api-keys/${publicKey}/revoke`),
};

export default api;

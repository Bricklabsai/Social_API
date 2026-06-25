import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && token !== 'undefined') {
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
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
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
      console.error('Error fetching connections:', error);
      throw error;
    }
  },
  connect: (platform) => {
    let userId = 1;
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined') {
      try {
        const user = JSON.parse(userStr);
        userId = user.id;
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }
    window.open(`${API_BASE_URL}/auth/${platform}/connect?user_id=${userId}`, '_blank', 'width=600,height=700');
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
  deletePost: (id) => api.delete(`/publish/posts/${id}`),
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
  deleteConversation: (conversationId) => {
    return api.delete(`/messages/conversation/${conversationId}`);
  },
};

// ============================================
// API KEYS (FIXED - Correct endpoints)
// ============================================
export const apiKeys = {
  // Create a new API key
  create: (data) => api.post('/api-keys/create', data),
  
  // List all API keys for the current user
  list: () => api.get('/api-keys/list'),
  
  // Update an API key
  update: (keyId, data) => api.put(`/api-keys/${keyId}`, data),
  
  // Delete an API key
  delete: (keyId) => api.delete(`/api-keys/${keyId}`),
  
  // Get usage statistics for an API key
  usage: (keyId) => api.get(`/api-keys/usage/${keyId}`),
};

// ============================================
// SETTINGS API (FIXED - Uses correct endpoints)
// ============================================
export const settings = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.post('/users/change-password', data),
  
  // API Keys are now in the apiKeys object above
  // These are just aliases for convenience
  getApiKeys: () => apiKeys.list(),
  generateApiKey: (data) => apiKeys.create(data),
  revokeApiKey: (keyId) => apiKeys.delete(keyId),
};

export default api;
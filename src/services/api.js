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
  getConnections: () => api.get('/users/me/platforms'),
  connect: (platform) => {
    // Get user ID from localStorage
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
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default api;
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 15000, // 15-second timeout to mitigate client hanging
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for rate-limiting and session timeouts
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn('[Security] Rate limit reached:', error.response?.data?.message || 'Too many requests');
    }
    return Promise.reject(error);
  }
);

export default API;

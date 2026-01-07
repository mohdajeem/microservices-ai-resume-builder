// import { api } from './api'; // Importing your existing axios instance
// Ensure this points to your Gateway Port 8000
import axios from "axios";
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Request Interceptor: Add Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// 2. Response Interceptor: Handle 401 (Logout)
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    // Optional: Only redirect if not already on login page to avoid loops
    if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});


export const interviewApi = {
  // Start a new session
  startSession: (data) => api.post('/api/interview/start', data),

  // Send a message (Chat turn)
  sendMessage: (data) => api.post('/api/interview/chat', data),
  
  // (Optional) Get past sessions if you implement history later
  getHistory: () => api.get('/api/interview/history'),
};
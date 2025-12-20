import axios from 'axios';
// Ensure this points to your Gateway Port 8000
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

// --- API DEFINITIONS ---

export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  changePassword: (data) => api.put('/api/auth/password', data),
  getMe: () => api.get('/api/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

export const resumeAPI = {
  list: () => api.get('/api/resume/list'),
  create: (data) => api.post('/api/resume/create', data),
  getProfile: () => api.get('/api/resume/profile'), 
  getDetail: (id) => api.get(`/api/resume/detail/${id}`),
  update: (id, data) => api.put(`/api/resume/update/${id}`, data), 
  delete: (id) => api.delete(`/api/resume/delete/${id}`),
  audit: (data) => api.post('/api/resume/audit', data),
  generateCoverLetter: (data) => api.post('/api/resume/cover-letter', data),
};

export const atsAPI = {
  analyze: (formData) => api.post('/api/ats/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  parse: (formData) => api.post('/api/ats/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const compilerAPI = {
  compile: (latexCode) => api.post('/api/compiler/compile', 
    { tex: latexCode }, 
    { 
      responseType: 'blob', // CRITICAL: Tells Axios to expect binary PDF data
      headers: { 'Accept': 'application/pdf' }
    }
  )
};

export const subscriptionAPI = {
  // Now calls the Stripe checkout session endpoint
  createCheckoutSession: async (plan) => {
    const response = await api.post('/api/payment/create-checkout-session', { plan });
    // This returns { url: "https://checkout.stripe.com/..." }
    return response.data;
  }
};

// Default export of the axios instance (useful if you need direct access)
export default api;
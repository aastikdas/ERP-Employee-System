import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem('erp_token');
      if (token) {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        // Let AuthContext handle state cleanup, but perform a hard redirect if page needs it
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

import axios from 'axios';

// Base instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Should be in env var eventually
  withCredentials: true,
});

let _accessToken = null;

export const setAccessToken = (token) => {
  _accessToken = token;
};

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// Response interceptor: refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we receive a 401 and haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't intercept 401s from the refresh endpoint itself, or login
      if (originalRequest.url === '/auth/refresh' || originalRequest.url === '/auth/login') {
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post(
          'http://localhost:5000/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );
        
        const newAccessToken = data.data.accessToken;
        setAccessToken(newAccessToken);
        
        // Update header and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. cookie expired).
        // Let the AuthContext handle clearing user state
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

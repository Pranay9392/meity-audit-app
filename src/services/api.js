// src/services/api.js
// Centralized API service for making authenticated requests to the Django backend.

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IMPORTANT: Replace with your Django backend's IP address or Render URL
// If running locally on physical device: Use your machine's actual local IP (e.g., http://192.168.1.10:8000/api/)
// If deploying to Render: Use your Render backend service URL (e.g., https://your-django-app.onrender.com/api/)
//export const API_BASE_URL = 'https://meity-audit-v2-1.onrender.com/api/'; // Example: Replace with your actual IP or deployed URL
//export const API_BASE_URL = 'http://192.168.29.64:8000/api/'; // Example: Replace with your actual IP or deployed URL
export const API_BASE_URL = 'http://10.3.20.183:8000/api/'; // Example: Replace with your actual IP or deployed URL


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token to outgoing requests
// This runs before every request made using 'api' instance.
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    console.log('API Interceptor: Attempting to retrieve token from AsyncStorage...');
    if (token) {
      console.log('API Interceptor: Token FOUND. Length:', token.length);
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('API Interceptor: Authorization header set:', config.headers.Authorization.substring(0, 50) + '...'); // Log first 50 chars
    } else {
      console.log('API Interceptor: Token NOT FOUND in AsyncStorage.');
    }
    return config;
  },
  (error) => {
    console.error('API Interceptor: Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration and refresh (if refresh tokens are used)
api.interceptors.response.use(
  (response) => {
    // console.log('API Interceptor: Response successful for:', response.config.url, 'Status:', response.status); // Debug log
    return response;
  },
  async (error) => {
    console.error('API Interceptor: Response error for:', error.config.url, 'Status:', error.response?.status, 'Data:', error.response?.data); // Debug log
    const originalRequest = error.config;

    // If error is 401 Unauthorized and this request hasn't been retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark as retried to prevent infinite loops
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('API Interceptor: 401 Unauthorized. Attempting token refresh...');

      if (refreshToken) {
        try {
          // Attempt to get a new access token using the refresh token
          const response = await axios.post(`${API_BASE_URL}token/refresh/`, {
            refresh: refreshToken,
          });
          const { access } = response.data;
          console.log('API Interceptor: Token refresh SUCCESS. New access token obtained.');

          // Store the new access token
          await AsyncStorage.setItem('userToken', access);
          // Update the default Authorization header for future requests
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          // Update the Authorization header for the original failed request and retry it
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          console.log('API Interceptor: Retrying original request with new token...');
          return api(originalRequest); // Retry the original request
        } catch (refreshError) {
          console.error('API Interceptor: Refresh token FAILED:', refreshError.response?.data || refreshError.message);
          // If refresh fails, clear all tokens and force logout (redirect to login screen)
          await AsyncStorage.removeItem('userToken');
          await AsyncStorage.removeItem('refreshToken');
          console.log('API Interceptor: Tokens cleared. Forcing logout.');
          // You might need to trigger a global logout action here
          // if AuthContext's logout isn't automatically called by setting authState.
          // For now, assume the next protected route access will fail and redirect.
          return Promise.reject(refreshError);
        }
      } else {
        console.log('API Interceptor: No refresh token found. Cannot refresh.');
        // No refresh token, so just reject the original 401
      }
    }
    return Promise.reject(error);
  }
);

export default api;

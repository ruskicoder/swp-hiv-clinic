import axios from 'axios';

/**
 * API client configuration with interceptors
 */
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 0, // Remove timeout restriction
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Add detailed error logging
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request error:', error.request);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        // Only redirect if we're not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } catch (e) {
        console.error('Error handling 401:', e);
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - server may be down');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
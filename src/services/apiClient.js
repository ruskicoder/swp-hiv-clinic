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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Handle successful responses
    if (response.config.method !== 'get') {
      // For non-GET requests, check if we need to trigger a refresh
      const needsRefresh = [
        '/doctors/availability',
        '/appointments',
        '/patient-records'
      ].some(path => response.config.url.includes(path));

      if (needsRefresh) {
        // Emit custom event for components to reload data
        window.dispatchEvent(new CustomEvent('dataUpdated', {
          detail: { path: response.config.url }
        }));
      }
    }
    return response;
  },
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
        // Remove userData from sessionStorage on 401
        sessionStorage.removeItem('userData');
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
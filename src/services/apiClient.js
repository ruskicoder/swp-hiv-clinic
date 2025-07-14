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
      // Use standard header assignment for Axios
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Only dispatch dataUpdated event for successful non-GET requests
    if (response.config.method !== 'get') {
      const needsRefresh = [
        '/doctors/availability',
        '/appointments',
        '/patient-records'
      ].some(path => response.config.url.includes(path));

      if (needsRefresh && response.status >= 200 && response.status < 300) {
        window.dispatchEvent(new CustomEvent('dataUpdated', {
          detail: { path: response.config.url }
        }));
      }
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
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
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        sessionStorage.removeItem('userData');
      } catch (e) {
        console.error('Error handling 401:', e);
      }
    }

    // Handle forbidden errors (403)
    if (error.response?.status === 403) {
      alert('You do not have permission to access this resource.');
    }

    // Prevent further processing to avoid loops
    return Promise.reject(error);
  }
);

export default apiClient;
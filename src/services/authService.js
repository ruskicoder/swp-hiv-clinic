import apiClient from './apiClient';

const authService = {
  // Login user
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },

  // Register user
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get user profile';
      throw new Error(errorMessage);
    }
  },

  // Check username availability
  checkUsername: async (username) => {
    try {
      const response = await apiClient.get(`/auth/check-username?username=${username}`);
      return response.data;
    } catch (error) {
      console.error('Check username error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check username';
      throw new Error(errorMessage);
    }
  },

  // Check email availability
  checkEmail: async (email) => {
    try {
      const response = await apiClient.get(`/auth/check-email?email=${email}`);
      return response.data;
    } catch (error) {
      console.error('Check email error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check email';
      throw new Error(errorMessage);
    }
  }
};

export default authService;
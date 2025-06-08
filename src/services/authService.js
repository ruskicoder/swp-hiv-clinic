import apiClient from './apiClient';

/**
 * Authentication service
 */
export const authService = {
  /**
   * Login user
   */
  async login(credentials) {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return {
        success: true,
        token: response.data.token,
        id: response.data.id,
        username: response.data.username,
        email: response.data.email,
        role: response.data.role
      };
    } catch (error) {
      console.error('Login service error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  },

  /**
   * Register new user
   */
  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      return {
        success: true,
        message: response.data.message || 'Registration successful'
      };
    } catch (error) {
      console.error('Registration service error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  },

  /**
   * Get user profile
   */
  async getUserProfile() {
    try {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put('/auth/profile', profileData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed'
      };
    }
  },

  /**
   * Logout user
   */
  logout() {
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};
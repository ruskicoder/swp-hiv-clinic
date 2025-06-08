import apiClient from './apiClient';

/**
 * Authentication service for handling user login, registration, and profile management
 */
const authService = {
  /**
   * Login user with credentials
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
   * Get current user profile
   */
  async getUserProfile() {
    try {
      const response = await apiClient.get('/auth/me');
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
   * Update profile image
   */
  async updateProfileImage(imageData) {
    try {
      const response = await apiClient.post('/auth/profile-image', {
        imageData: imageData
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Update profile image error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Profile image update failed'
      };
    }
  },

  /**
   * Check username availability
   */
  async checkUsername(username) {
    try {
      const response = await apiClient.get(`/auth/check-username?username=${username}`);
      return response.data;
    } catch (error) {
      console.error('Check username error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check username'
      };
    }
  },

  /**
   * Check email availability
   */
  async checkEmail(email) {
    try {
      const response = await apiClient.get(`/auth/check-email?email=${email}`);
      return response.data;
    } catch (error) {
      console.error('Check email error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check email'
      };
    }
  },

  /**
   * Logout user (client-side cleanup)
   */
  logout() {
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
};

// Export as both named and default export for compatibility
export { authService };
export default authService;
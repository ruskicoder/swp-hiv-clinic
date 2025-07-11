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
   * Get current user profile with better error handling
   */
  async getUserProfile() {
    try {
      const response = await apiClient.get('/auth/me');
      
      // Transform the response to ensure consistent data structure
      return {
        ...response.data,
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phoneNumber: response.data.phoneNumber || '',
        dateOfBirth: response.data.dateOfBirth || '',
        address: response.data.address || '',
        profileImageBase64: response.data.profileImageBase64 || '',
        role: response.data.role || 'Patient' // Default to Patient if not specified
      };
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error('Failed to load user profile');
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
   * Check session status and remaining time
   */
  async checkSessionStatus() {
    try {
      const response = await apiClient.get('/auth/session/status');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Check session status error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check session status'
      };
    }
  },

  /**
   * Extend/refresh current session
   */
  async extendSession() {
    try {
      const response = await apiClient.post('/auth/session/extend');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Extend session error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to extend session'
      };
    }
  },

  /**
   * Get user's last login time
   */
  async getLastLogin() {
    try {
      const response = await apiClient.get('/auth/last-login');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get last login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch last login time'
      };
    }
  },

  /**
   * Logout user (server-side session invalidation + client-side cleanup)
   */
  async logout() {
    try {
      // Invalidate session on server
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Server logout error:', error);
      // Continue with client-side cleanup even if server call fails
    }
    
    try {
      // Client-side cleanup
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Client logout error:', error);
    }
  }
};

// Export as both named and default export for compatibility
export { authService };
export default authService;
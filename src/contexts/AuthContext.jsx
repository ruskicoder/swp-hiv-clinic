import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

/**
 * Authentication Context for managing user authentication state
 * Provides login, logout, and user state management across the application
 */
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
            // Verify token is still valid by getting user profile
            const userProfile = await authService.getUserProfile();
            setUser(userProfile);
          } catch (error) {
            console.error('Token validation failed:', error);
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login function that authenticates user and stores token
   */
  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.login(credentials);
      
      if (response.success) {
        // Store token
        localStorage.setItem('token', response.token);
        
        // Load full profile data after successful login
        const profileResponse = await authService.getUserProfile();
        
        // Set user data with combined login and profile info
        setUser({
          id: response.id,
          userId: response.id,  
          username: response.username,
          email: response.email,
          role: response.role,
          // Add profile data
          firstName: profileResponse.firstName || '',
          lastName: profileResponse.lastName || '',
          phoneNumber: profileResponse.phoneNumber || '',
          dateOfBirth: profileResponse.dateOfBirth || '',
          address: profileResponse.address || '',
          profileImageBase64: profileResponse.profileImageBase64 || ''
        });
        
        return { success: true };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register function for new user registration
   */
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.register(userData);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function that clears user state and token
   */
  const logout = () => {
    try {
      localStorage.removeItem('token');
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Update user profile data
   */
  const updateUser = (userData) => {
    setUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        ...userData
      };
      // Persist user data if needed
      try {
        localStorage.setItem('userData', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error saving user data:', error);
      }
      return updatedUser;
    });
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
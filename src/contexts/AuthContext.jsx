import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import notificationService from '../services/notificationService';
import useSessionMonitor from './useSessionMonitor';
import SessionTimeoutModal from '../components/ui/SessionTimeoutModal';
import ProfileLoadingModal from '../components/ui/ProfileLoadingModal';

/**
 * Authentication Context for managing user authentication state
 * Provides login, logout, and user state management across the application
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showProfileLoadingModal, setShowProfileLoadingModal] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  // Check token and load user profile on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (token) {
          try {
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

  // Show profile loading modal after first login
  useEffect(() => {
    if (isFirstLogin && user && !showProfileLoadingModal) {
      // Always show modal on first login to ensure page reload for optimal experience
      setShowProfileLoadingModal(true);
      setIsFirstLogin(false);
    }
  }, [isFirstLogin, user, showProfileLoadingModal]);

  /**
   * Handle profile loading modal close
   */
  const handleProfileModalClose = () => {
    setShowProfileLoadingModal(false);
  };

  /**
   * Enhanced logout function that handles both server and client cleanup
   */
  const logout = useCallback(async () => {
    try {
      // Server-side logout
      await authService.logout();
      
      // Reset notification polling state
      notificationService.resetPollingState();
      
      // Client-side cleanup
      setUser(null);
      setError(null);
      setShowProfileLoadingModal(false);
      setIsFirstLogin(false);
    } catch (error) {
      console.error('Logout error:', error);
      // Still perform client-side cleanup even if server call fails
      notificationService.resetPollingState();
      setUser(null);
      setError(null);
      setShowProfileLoadingModal(false);
      setIsFirstLogin(false);
    }
  }, []);

  // Session monitoring integration
  const {
    sessionStatus,
    showTimeoutModal,
    extendSession
  } = useSessionMonitor(!!user, logout);

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
        sessionStorage.setItem('token', response.token);
        
        // Set initial user data immediately from login response
        const initialUser = {
          id: response.id,
          userId: response.id,
          username: response.username,
          email: response.email,
          role: response.role,
          firstName: '',
          lastName: '',
          phoneNumber: '',
          dateOfBirth: '',
          address: '',
          profileImageBase64: ''
        };
        
        // Set user immediately so components have access to userId/doctorId
        setUser(initialUser);
        
        // Load full profile data after successful login (async)
        try {
          const profileResponse = await authService.getUserProfile();
          
          // Update user data with profile information
          setUser(prevUser => ({
            ...prevUser,
            firstName: profileResponse.firstName || '',
            lastName: profileResponse.lastName || '',
            phoneNumber: profileResponse.phoneNumber || '',
            dateOfBirth: profileResponse.dateOfBirth || '',
            address: profileResponse.address || '',
            profileImageBase64: profileResponse.profileImageBase64 || ''
          }));
        } catch (profileError) {
          console.error('Failed to load user profile:', profileError);
          // Don't fail login if profile loading fails - user data is already set
        }
        
        // Initialize notifications after successful login
        try {
          await notificationService.getInitialNotifications();
        } catch (notificationError) {
          console.error('Failed to initialize notifications:', notificationError);
          // Don't fail login if notification initialization fails
        }
        
        // Always set first login flag to show modal for page reload
        setIsFirstLogin(true);
        
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
        sessionStorage.setItem('userData', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error saving user data:', error);
      }
      return updatedUser;
    });
  };

  /**
   * Handle session timeout modal extend action
   */
  const handleExtendSession = async () => {
    try {
      await extendSession();
    } catch (error) {
      console.error('Failed to extend session:', error);
      await logout();
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    sessionStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Session Timeout Modal */}
      <SessionTimeoutModal
        isOpen={showTimeoutModal}
        remainingSeconds={sessionStatus.remainingSeconds}
        onExtendSession={handleExtendSession}
        onLogout={logout}
      />
      
      {/* Profile Loading Modal */}
      <ProfileLoadingModal
        isOpen={showProfileLoadingModal}
        onClose={handleProfileModalClose}
      />
    </AuthContext.Provider>
  );
};

export default AuthContext;
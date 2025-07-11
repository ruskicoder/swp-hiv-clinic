import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';

/**
 * Custom hook for monitoring user session and handling timeout
 * 
 * Features:
 * - Monitors session status every 30 seconds
 * - Shows warning modal 1 minute before expiration
 * - Handles session extension and automatic logout
 * - Pauses monitoring when user is inactive
 */
const useSessionMonitor = (isAuthenticated, onLogout) => {
  const [sessionStatus, setSessionStatus] = useState({
    isActive: false,
    remainingMinutes: 0,
    expiresAt: null
  });
  
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const sessionCheckInterval = useRef(null);
  const activityTimer = useRef(null);
  const timeoutModalShown = useRef(false);
  
  // Session monitoring interval (30 seconds)
  const SESSION_CHECK_INTERVAL = 30000;
  
  // Warning threshold (1 minute = 60 seconds)
  const WARNING_THRESHOLD_SECONDS = 60;
  
  // Activity timeout (5 minutes of inactivity pauses monitoring)
  const ACTIVITY_TIMEOUT = 5 * 60 * 1000;

  /**
   * Handle automatic logout
   */
  const handleAutoLogout = useCallback(() => {
    setShowTimeoutModal(false);
    timeoutModalShown.current = false;
    
    // Clear intervals
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
    
    if (activityTimer.current) {
      clearTimeout(activityTimer.current);
      activityTimer.current = null;
    }
    
    // Call the logout function
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  /**
   * Check current session status
   */
  const checkSessionStatus = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await authService.checkSessionStatus();
      
      if (response.success && response.data) {
        const { isActive, remainingMinutes, expiresAt } = response.data;
        
        setSessionStatus({
          isActive,
          remainingMinutes,
          expiresAt: expiresAt ? new Date(expiresAt) : null
        });
        
        // Show warning modal if session is about to expire
        const remainingSeconds = remainingMinutes * 60;
        if (isActive && remainingSeconds <= WARNING_THRESHOLD_SECONDS && remainingSeconds > 0) {
          if (!timeoutModalShown.current) {
            setShowTimeoutModal(true);
            timeoutModalShown.current = true;
          }
        } else if (remainingSeconds > WARNING_THRESHOLD_SECONDS) {
          // Reset modal flag if we're outside warning threshold
          timeoutModalShown.current = false;
          setShowTimeoutModal(false);
        }
        
        // Auto-logout if session is expired
        if (!isActive || remainingSeconds <= 0) {
          handleAutoLogout();
        }
      } else {
        // Session check failed, likely expired
        handleAutoLogout();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Don't auto-logout on network errors, just log
    }
  }, [isAuthenticated, handleAutoLogout]);

  /**
   * Extend current session
   */
  const extendSession = useCallback(async () => {
    try {
      const response = await authService.extendSession();
      
      if (response.success) {
        setShowTimeoutModal(false);
        timeoutModalShown.current = false;
        
        // Immediately check session status to update UI
        await checkSessionStatus();
        
        return true;
      } else {
        console.error('Failed to extend session:', response.message);
        handleAutoLogout();
        return false;
      }
    } catch (error) {
      console.error('Session extension failed:', error);
      handleAutoLogout();
      return false;
    }
  }, [checkSessionStatus, handleAutoLogout]);

  /**
   * Update last activity timestamp
   */
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  /**
   * Check if user has been inactive for too long
   */
  const checkUserActivity = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    
    // If user has been inactive for more than ACTIVITY_TIMEOUT, pause monitoring
    return timeSinceActivity < ACTIVITY_TIMEOUT;
  }, [lastActivity, ACTIVITY_TIMEOUT]);

  /**
   * Start session monitoring
   */
  const startMonitoring = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
    }
    
    sessionCheckInterval.current = setInterval(() => {
      // Only check session if user has been active recently
      if (checkUserActivity()) {
        checkSessionStatus();
      }
    }, SESSION_CHECK_INTERVAL);
    
    // Initial check
    checkSessionStatus();
  }, [checkSessionStatus, checkUserActivity]);

  /**
   * Stop session monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
    
    if (activityTimer.current) {
      clearTimeout(activityTimer.current);
      activityTimer.current = null;
    }
    
    setShowTimeoutModal(false);
    timeoutModalShown.current = false;
  }, []);

  /**
   * Setup activity tracking
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, updateActivity]);

  /**
   * Main effect - start/stop monitoring based on authentication
   */
  useEffect(() => {
    if (isAuthenticated) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [isAuthenticated, startMonitoring, stopMonitoring]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    sessionStatus,
    showTimeoutModal,
    extendSession,
    handleAutoLogout,
    updateActivity
  };
};

export default useSessionMonitor;
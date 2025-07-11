import { useState, useEffect, useCallback, useRef } from 'react';
import authService from '../services/authService';

/**
 * Custom hook for client-side session timeout management
 * 
 * Features:
 * - Client-side session timeout calculation (30 minutes)
 * - Mouse movement detection for user activity
 * - Countdown timer starting when user becomes idle
 * - Session invalidation request only when timeout occurs
 * - Early warning 1 minute before timeout
 * - Eliminates frequent server session checks
 */
const useSessionMonitor = (isAuthenticated, onLogout) => {
  const [sessionStatus, setSessionStatus] = useState({
    isActive: false,
    remainingSeconds: 0,
    expiresAt: null
  });
  
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  const sessionTimer = useRef(null);
  const countdownTimer = useRef(null);
  const timeoutModalShown = useRef(false);
  const sessionStartTime = useRef(Date.now());
  
  // Session timeout duration (30 minutes)
  const SESSION_TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
  
  // Warning threshold (1 minute = 60 seconds)
  const WARNING_THRESHOLD_SECONDS = 60;
  
  // Countdown update interval (1 second)
  const COUNTDOWN_UPDATE_INTERVAL = 1000;

  /**
   * Calculate remaining session time based on last activity
   */
  const calculateRemainingTime = useCallback(() => {
    const now = Date.now();
    const timeSinceActivity = now - lastActivity;
    const remaining = SESSION_TIMEOUT_DURATION - timeSinceActivity;
    return Math.max(0, Math.floor(remaining / 1000)); // Return seconds
  }, [lastActivity, SESSION_TIMEOUT_DURATION]);

  /**
   * Handle automatic logout with session invalidation
   */
  const handleAutoLogout = useCallback(async () => {
    setShowTimeoutModal(false);
    timeoutModalShown.current = false;
    
    // Clear timers
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
      sessionTimer.current = null;
    }
    
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    
    try {
      // Send session invalidation request to server
      await authService.logout();
    } catch (error) {
      console.error('Session invalidation failed:', error);
    }
    
    // Call the logout function
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  /**
   * Update session status and handle timeout logic
   */
  const updateSessionStatus = useCallback(() => {
    if (!isAuthenticated) return;
    
    const remainingSeconds = calculateRemainingTime();
    const expiresAt = new Date(lastActivity + SESSION_TIMEOUT_DURATION);
    
    setSessionStatus({
      isActive: remainingSeconds > 0,
      remainingSeconds,
      expiresAt
    });
    
    // Show warning modal if session is about to expire
    if (remainingSeconds <= WARNING_THRESHOLD_SECONDS && remainingSeconds > 0) {
      if (!timeoutModalShown.current) {
        setShowTimeoutModal(true);
        timeoutModalShown.current = true;
      }
    } else if (remainingSeconds > WARNING_THRESHOLD_SECONDS) {
      // Reset modal flag if we're outside warning threshold
      timeoutModalShown.current = false;
      setShowTimeoutModal(false);
    }
    
    // Auto-logout if session has expired
    if (remainingSeconds <= 0) {
      handleAutoLogout();
    }
  }, [isAuthenticated, calculateRemainingTime, lastActivity, SESSION_TIMEOUT_DURATION, handleAutoLogout]);

  /**
   * Extend current session by resetting activity timestamp
   */
  const extendSession = useCallback(async () => {
    try {
      // Reset activity timestamp to current time
      const now = Date.now();
      setLastActivity(now);
      sessionStartTime.current = now;
      
      // Hide timeout modal
      setShowTimeoutModal(false);
      timeoutModalShown.current = false;
      
      // Optionally notify server of session extension
      await authService.extendSession();
      
      // Update session status immediately
      updateSessionStatus();
      
      return true;
    } catch (error) {
      console.error('Session extension failed:', error);
      handleAutoLogout();
      return false;
    }
  }, [updateSessionStatus, handleAutoLogout]);

  /**
   * Update last activity timestamp on user activity
   */
  const updateActivity = useCallback(() => {
    const now = Date.now();
    setLastActivity(now);
    
    // Reset modal flag when user becomes active again
    if (timeoutModalShown.current) {
      timeoutModalShown.current = false;
      setShowTimeoutModal(false);
    }
  }, []);

  /**
   * Start session monitoring timers
   */
  const startMonitoring = useCallback(() => {
    if (!isAuthenticated) return;
    
    // Clear existing timers
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
    }
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
    }
    
    // Initialize session start time
    const now = Date.now();
    sessionStartTime.current = now;
    setLastActivity(now);
    
    // Start countdown timer that updates every second
    countdownTimer.current = setInterval(() => {
      updateSessionStatus();
    }, COUNTDOWN_UPDATE_INTERVAL);
    
    // Set session timeout timer
    sessionTimer.current = setTimeout(() => {
      handleAutoLogout();
    }, SESSION_TIMEOUT_DURATION);
    
    // Initial status update
    updateSessionStatus();
  }, [isAuthenticated, updateSessionStatus, handleAutoLogout, SESSION_TIMEOUT_DURATION]);

  /**
   * Stop session monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
      sessionTimer.current = null;
    }
    
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    
    setShowTimeoutModal(false);
    timeoutModalShown.current = false;
    
    setSessionStatus({
      isActive: false,
      remainingSeconds: 0,
      expiresAt: null
    });
  }, []);

  /**
   * Reset session timeout when user activity is detected
   */
  const resetSessionTimeout = useCallback(() => {
    if (!isAuthenticated) return;
    
    // Clear existing session timeout
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current);
    }
    
    // Set new session timeout
    sessionTimer.current = setTimeout(() => {
      handleAutoLogout();
    }, SESSION_TIMEOUT_DURATION);
    
    updateActivity();
  }, [isAuthenticated, handleAutoLogout, updateActivity, SESSION_TIMEOUT_DURATION]);

  /**
   * Setup mouse movement detection for user activity
   */
  useEffect(() => {
    if (!isAuthenticated) return;
    
    let mouseMoveTimer = null;
    
    const handleMouseMove = () => {
      // Throttle mouse movement events to prevent excessive updates
      if (mouseMoveTimer) {
        clearTimeout(mouseMoveTimer);
      }
      
      mouseMoveTimer = setTimeout(() => {
        resetSessionTimeout();
      }, 100); // 100ms throttle
    };
    
    const handleUserActivity = () => {
      resetSessionTimeout();
    };
    
    // Activity events to monitor
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add mouse movement listener
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    
    // Add other activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });
    
    // Cleanup
    return () => {
      if (mouseMoveTimer) {
        clearTimeout(mouseMoveTimer);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [isAuthenticated, resetSessionTimeout]);

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
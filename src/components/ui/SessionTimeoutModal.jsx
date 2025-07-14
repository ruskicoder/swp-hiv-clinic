import React, { useState, useEffect } from 'react';
import './SessionTimeoutModal.css';

/**
 * Modal component that appears when user session is about to expire
 * Provides options to extend the session or logout
 * Works with client-side session management system
 */
const SessionTimeoutModal = ({
  isOpen,
  remainingSeconds,
  onExtendSession,
  onLogout
}) => {
  const [countdown, setCountdown] = useState(remainingSeconds || 0);

  useEffect(() => {
    if (isOpen && remainingSeconds > 0) {
      setCountdown(remainingSeconds);
    }
  }, [isOpen, remainingSeconds]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          clearInterval(timer);
          onLogout(); // Auto-logout when countdown reaches 0
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onLogout]);

  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="session-timeout-modal-overlay">
      <div className="session-timeout-modal">
        <div className="session-timeout-modal-header">
          <h3>⚠️ Session Expiring</h3>
        </div>
        
        <div className="session-timeout-modal-content">
          <p>Your session is about to expire due to inactivity.</p>
          <p>You will be automatically logged out in:</p>
          
          <div className="session-countdown">
            <span className="countdown-time">{formatTime(countdown)}</span>
          </div>
          
          <p>Would you like to extend your session?</p>
        </div>
        
        <div className="session-timeout-modal-actions">
          <button 
            className="btn btn-primary"
            onClick={onExtendSession}
            disabled={countdown <= 0}
          >
            Yes, Extend Session
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={onLogout}
          >
            No, Logout Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
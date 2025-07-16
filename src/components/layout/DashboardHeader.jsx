import { useAuth } from '../../contexts/useAuth';
import UserProfileDropdown from './UserProfileDropdown';
import { useEffect, useState, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import notificationService from '../../services/notificationService';
import NotificationIcon from '../notifications/NotificationIcon';
import NotificationPanel from '../notifications/NotificationPanel';
import './DashboardHeader.css';

const DashboardHeader = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);

  // Function to check if user is a patient
  const isPatient = useCallback(() => {
    return user && (user.role === 'Patient' || user?.role?.roleName === 'Patient');
  }, [user]);

  // Handle notification updates from the service
  const handleNotificationUpdate = useCallback((notificationData, isNewNotifications) => {
    setNotifications(notificationData);
    setUnreadCount(notificationData.filter(n => !n.isRead).length);
    
    // Only log when new notifications are received
    if (isNewNotifications) {
      console.log('New notifications received:', notificationData.filter(n => !n.isRead).length);
    }
  }, []);

  // Separate useEffect for clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate useEffect for initial data loading
  useEffect(() => {
    const loadPrivateMode = async () => {
      if (isPatient()) {
        try {
          const response = await apiClient.get('/patients/privacy-settings');
          const privacyState = response.data?.isPrivate ?? false;
          setIsPrivate(privacyState);
          sessionStorage.setItem('privateMode', JSON.stringify(privacyState));
        } catch (error) {
          console.error('Failed to load privacy settings:', error);
          setError('Failed to load privacy settings');
          // Fallback to localStorage if API fails
          const savedMode = sessionStorage.getItem('privateMode');
          if (savedMode) {
            setIsPrivate(JSON.parse(savedMode));
          }
        }
      }
    };

    loadPrivateMode();
  }, [isPatient]);

  // Separate useEffect for notification management
  useEffect(() => {
    if (!user) return;

    // Initial fetch of notifications on login
    const initializeNotifications = async () => {
      await notificationService.getInitialNotifications();
    };

    initializeNotifications();

    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribeToNotifications(handleNotificationUpdate);

    return () => {
      unsubscribe();
    };
  }, [user, handleNotificationUpdate]);

  // Reset notification state on logout
  useEffect(() => {
    if (!user) {
      notificationService.resetPollingState();
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const togglePrivacy = async () => {
    if (!isPatient() || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newState = !isPrivate;
      
      // Update UI state immediately for better user feedback
      setIsPrivate(newState);
        // Make API call
        const response = await apiClient.post('/patients/privacy-settings', {
          isPrivate: newState
        });
      
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to update privacy settings');
      }
      
      // Update sessionStorage after successful API call
      sessionStorage.setItem('privateMode', JSON.stringify(newState));
      
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setError('Failed to update privacy mode');
      // Revert the UI state if the API call failed
      const savedMode = localStorage.getItem('privateMode');
      if (savedMode) {
        setIsPrivate(JSON.parse(savedMode));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    // Store original state in case we need to revert
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;
    
    // Optimistically update the UI
    setNotifications(notifications.map(n => n.notificationId === notificationId ? { ...n, isRead: true, status: 'READ' } : n));
    setUnreadCount(Math.max(0, unreadCount - 1));
    
    try {
        const result = await notificationService.markAsRead(notificationId);
        
        if (!result.success) {
            console.error('Failed to mark notification as read:', result.error);
            // Revert the UI changes if API call failed
            setNotifications(originalNotifications);
            setUnreadCount(originalUnreadCount);
        }
    } catch (error) {
        console.error('Exception in handleMarkAsRead:', error);
        // Revert the UI changes if API call failed
        setNotifications(originalNotifications);
        setUnreadCount(originalUnreadCount);
    }
  };

  const _handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      
      if (result.success) {
        console.log('Successfully marked all notifications as read');
        // Update UI state after successful API call
        setNotifications(notifications.map(n => ({ ...n, isRead: true, status: 'READ' })));
        setUnreadCount(0);
      } else {
        console.error('Failed to mark all notifications as read:', result.error);
        setError('Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Exception marking all notifications as read:', error);
      setError('Failed to mark notifications as read');
    }
  };

  const formatDateTime = () => {
    const dateOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    const timeOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    const date = currentDateTime.toLocaleDateString('en-GB', dateOptions);
    const time = currentDateTime.toLocaleTimeString('en-GB', timeOptions);
    return { date, time };
  };
  const { date, time } = formatDateTime();

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-content">
        <div className="dashboard-header-info">
          <span
            className="nav-logo"
            tabIndex={0}
            onClick={() => window.location.pathname = '/'}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.pathname = '/'; }}
          >
            <span className="logo-icon">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </span>
            <span className="logo-text">HIV Medical System</span>
          </span>
          <div className="dashboard-header-titles">
            <h1 className="dashboard-title">{title}</h1>
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
          </div>
        </div>
          <div className="dashboard-header-actions">
          {isPatient() && (
            <button 
              className={`privacy-toggle ${isPrivate ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={togglePrivacy}
              disabled={isLoading}
              title={error || `Turn ${isPrivate ? 'off' : 'on'} privacy mode`}
              role="switch"
              aria-checked={isPrivate}
              type="button"
            >
              <span className="icon">
                {isPrivate ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0110 0v4"></path>
                    <line x1="12" y1="15" x2="12" y2="18"></line>
                  </svg>
                )}
              </span>
              {isPrivate ? 'Anonymous' : 'Public'}
            </button>
          )}
          <div className="system-datetime">
            <div className="date">{date}</div>
            <div className="time">{time}</div>
          </div>
          <NotificationIcon count={unreadCount} onClick={async () => {
            // ALWAYS mark all notifications as read when notification button is clicked
            console.log('Notification button clicked - marking all as read');
            
            try {
              // Wait for API response before updating UI
              const result = await notificationService.markAllAsRead();
              
              if (result.success) {
                console.log('Successfully marked all notifications as read');
                // Update UI state immediately after successful API call
                setNotifications(notifications.map(n => ({ ...n, isRead: true, status: 'READ' })));
                setUnreadCount(0);
              } else {
                console.error('Failed to mark all notifications as read:', result.error);
                // Show error feedback to user
                setError('Failed to mark notifications as read');
              }
            } catch (error) {
              console.error('Exception marking all notifications as read:', error);
              setError('Failed to mark notifications as read');
            }
            
            // Show panel after marking as read
            setShowPanel(!showPanel);
          }} />
          {showPanel && (
            <NotificationPanel
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onClose={() => setShowPanel(false)}
            />
          )}
          <UserProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
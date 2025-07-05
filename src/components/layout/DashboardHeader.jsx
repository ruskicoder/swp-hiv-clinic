import { useAuth } from '../../contexts/AuthContext';
import UserProfileDropdown from './UserProfileDropdown';
import { useEffect, useState, useCallback, useRef } from 'react';
import apiClient from '../../services/apiClient';
import NotificationIcon from '../notifications/NotificationIcon';
import NotificationPanel from '../notifications/NotificationPanel';
import './DashboardHeader.css';

const DashboardHeader = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const notificationPanelRef = useRef(null);

  // Function to check if user is a patient
  const isPatient = useCallback(() => {
    return user && (user.role === 'Patient' || user?.role?.roleName === 'Patient');
  }, [user]);

  const isDoctor = useCallback(() => {
    return user && (user.role === 'Doctor' || user?.role?.roleName === 'Doctor');
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    const fetchNotifications = async () => {
      if (!user) return;
      
      setNotificationsLoading(true);
      try {
        let response;
        if (isDoctor()) {
          // For doctors, get all notifications they need to see
          response = await apiClient.get('/notifications/doctor');
          setNotifications(response.data);
          // Count notifications with status "Unread"
          setUnreadCount(response.data.filter(n => n.status === 'Unread').length);
        } else {
          // For patients and other users
          response = await apiClient.get(`/notifications?userId=${user.id}`);
          setNotifications(response.data);
          // Count notifications with status "Unread"
          setUnreadCount(response.data.filter(n => n.status === 'Unread').length);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setNotificationsLoading(false);
      }
    };

    // Load initial private mode state from API
    const loadPrivateMode = async () => {
      if (isPatient()) {
        try {
          const response = await apiClient.get('/patients/privacy-settings');
          const privacyState = response.data?.isPrivate ?? false;
          setIsPrivate(privacyState);
          localStorage.setItem('privateMode', JSON.stringify(privacyState));
        } catch (error) {
          console.error('Failed to load privacy settings:', error);
          setError('Failed to load privacy settings');
          // Fallback to localStorage if API fails
          const savedMode = localStorage.getItem('privateMode');
          if (savedMode) {
            setIsPrivate(JSON.parse(savedMode));
          }
        }
      }
    };

    // Close notification panel when clicking outside
    const handleClickOutside = (event) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target) && 
          !event.target.closest('.notification-icon-wrapper')) {
        setShowPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    loadPrivateMode();
    fetchNotifications();
    const notificationInterval = setInterval(fetchNotifications, 60000); // Poll every minute

    return () => {
      clearInterval(timer);
      clearInterval(notificationInterval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, isPatient, isDoctor]);

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
      
      // Update localStorage after successful API call
      localStorage.setItem('privateMode', JSON.stringify(newState));
      
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
    try {
      await apiClient.post(`/notifications/${notificationId}/read`);
      
      // Update notification status in the local state
      setNotifications(notifications.map(n => {
        if (n.notificationId === notificationId) {
          return { ...n, status: 'Read' };
        }
        return n;
      }));
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAsSeen = async (notificationId) => {
    // This would be called when a notification is displayed but not explicitly marked as read
    try {
      await apiClient.post(`/notifications/${notificationId}/seen`);
      
      // Only update local state if the notification is currently Unread
      setNotifications(notifications.map(n => {
        if (n.notificationId === notificationId && n.status === 'Unread') {
          return { ...n, status: 'Seen' };
        }
        return n;
      }));
      
      // Don't update unread count since "Seen" still counts as unread in the icon badge
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (isDoctor()) {
        await apiClient.post('/notifications/doctor/read-all');
      } else {
        await apiClient.post(`/notifications/read-all?userId=${user.id}`);
      }
      
      // Update all notifications to "Read" status
      setNotifications(notifications.map(n => {
        if (n.status === 'Unread' || n.status === 'Seen') {
          return { ...n, status: 'Read' };
        }
        return n;
      }));
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleRetractNotification = async (notificationId) => {
    try {
      await apiClient.post(`/notifications/${notificationId}/retract`);
      
      // Update notification status in the local state
      setNotifications(notifications.map(n => {
        if (n.notificationId === notificationId) {
          return { ...n, status: 'Retracted' };
        }
        return n;
      }));
      
      // If the notification was unread, update the count
      const wasUnread = notifications.find(n => n.notificationId === notificationId)?.status === 'Unread';
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to retract notification:', error);
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

  const toggleNotificationPanel = () => {
    setShowPanel(!showPanel);
    
    // Mark visible notifications as seen when opening the panel
    if (!showPanel) {
      const unreadNotifications = notifications.filter(n => n.status === 'Unread');
      unreadNotifications.forEach(notification => {
        handleMarkAsSeen(notification.notificationId);
      });
    }
  };

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
          <NotificationIcon 
            count={unreadCount} 
            onClick={toggleNotificationPanel} 
          />
          {showPanel && (
            <div ref={notificationPanelRef}>
              <NotificationPanel
                notifications={notifications}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onRetractNotification={handleRetractNotification}
                loading={notificationsLoading}
              />
            </div>
          )}
          <UserProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
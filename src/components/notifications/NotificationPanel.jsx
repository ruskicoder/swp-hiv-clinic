import React, { useState, useEffect } from 'react';
import NotificationItem from './NotificationItem';
import './NotificationPanel.css';

const NotificationPanel = ({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onRetractNotification,
  loading = false 
}) => {
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Group notifications by date
  const groupNotificationsByDate = (notifications) => {
    const groups = {
      today: [],
      yesterday: [],
      earlier: []
    };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    notifications.forEach(notification => {
      const notificationDate = new Date(notification.createdAt);
      notificationDate.setHours(0, 0, 0, 0);
      
      if (notificationDate.getTime() === today.getTime()) {
        groups.today.push(notification);
      } else if (notificationDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(notification);
      } else {
        groups.earlier.push(notification);
      }
    });
    
    return groups;
  };
  
  // Filter notifications based on selected filter
  const getFilteredNotifications = () => {
    let filtered = [...notifications];
    
    switch (filter) {
      case 'unread':
        filtered = filtered.filter(n => n.status === 'Unread');
        break;
      case 'read':
        filtered = filtered.filter(n => n.status === 'Read');
        break;
      case 'retracted':
        filtered = filtered.filter(n => n.status === 'Retracted');
        break;
      default:
        // 'all' - no filtering needed
        break;
    }
    
    // Sort notifications
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };
  
  const filteredNotifications = getFilteredNotifications();
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const unreadCount = notifications.filter(n => n.status === 'Unread').length;
  
  const renderNotificationGroup = (notifications, title) => {
    if (notifications.length === 0) return null;
    
    return (
      <div className="notification-group" key={title}>
        <div className="group-header">{title}</div>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.notificationId}
            notification={notification}
            onMarkAsRead={onMarkAsRead}
            onRetract={onRetractNotification}
          />
        ))}
      </div>
    );
  };
  
  return (
    <div className="notification-panel" role="dialog" aria-labelledby="notification-title">
      <div className="panel-header">
        <h3 id="notification-title">
          Notifications
          {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
        </h3>
        <button 
          onClick={onMarkAllAsRead}
          disabled={unreadCount === 0}
          aria-label="Mark all notifications as read"
          className={unreadCount === 0 ? 'disabled' : ''}
        >
          Mark all as read
        </button>
      </div>
      
      <div className="panel-filters">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'unread' ? 'active' : ''} 
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
          <button 
            className={filter === 'read' ? 'active' : ''} 
            onClick={() => setFilter('read')}
          >
            Read
          </button>
        </div>
        
        <div className="sort-control">
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)}
            aria-label="Sort notifications"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>
      
      <div className="panel-body" role="log" aria-live="polite">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" width="48" height="48">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" fill="#ccc" />
            </svg>
            <p>No notifications {filter !== 'all' ? `matching "${filter}" filter` : ''}</p>
          </div>
        ) : (
          <>
            {renderNotificationGroup(groupedNotifications.today, 'Today')}
            {renderNotificationGroup(groupedNotifications.yesterday, 'Yesterday')}
            {renderNotificationGroup(groupedNotifications.earlier, 'Earlier')}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
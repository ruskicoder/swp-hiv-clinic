import React, { useState } from 'react';
import PropTypes from 'prop-types';
import NotificationItem from './NotificationItem';
import './NotificationPanel.css';

/**
 * Enhanced notification panel component with filtering and priority indicators
 * Supports different notification types and improved user interactions
 */
const NotificationPanel = ({
  notifications,
  onMarkAsRead,
  onClose
}) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  /**
   * Filter notifications based on current filter
   */
  const getFilteredNotifications = () => {
    let filtered = notifications;

    switch (filter) {
      case 'unread':
        filtered = notifications.filter(n => !n.isRead);
        break;
      case 'high-priority':
        filtered = notifications.filter(n =>
          n.priority === 'HIGH' || n.priority === 'URGENT'
        );
        break;
      case 'today':
        const today = new Date().toDateString();
        filtered = notifications.filter(n =>
          new Date(n.createdAt).toDateString() === today
        );
        break;
      default:
        filtered = notifications;
    }

    // Sort notifications
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'priority':
          const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const highPriorityCount = notifications.filter(n =>
    (n.priority === 'HIGH' || n.priority === 'URGENT') && !n.isRead
  ).length;

  return (
    <div className="notification-panel">
      <div className="panel-header">
        <div className="header-content">
          <h3>Notifications</h3>
          <div className="notification-stats">
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} unread</span>
            )}
            {highPriorityCount > 0 && (
              <span className="priority-badge">{highPriorityCount} urgent</span>
            )}
          </div>
        </div>
        
        <div className="panel-actions">
          {onClose && (
            <button
              className="close-panel-btn"
              onClick={onClose}
              title="Close panel"
              aria-label="Close notification panel"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="panel-controls">
        <div className="filter-controls">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
            aria-label="Filter notifications"
          >
            <option value="all">All ({notifications.length})</option>
            <option value="unread">Unread ({unreadCount})</option>
            <option value="high-priority">High Priority ({highPriorityCount})</option>
            <option value="today">Today</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
            aria-label="Sort notifications"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">By Priority</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="panel-body">
        {filteredNotifications.length > 0 ? (
          <div className="notifications-list">
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.notificationId}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                enhanced={true}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              {filter === 'unread' ? '✅' : '📨'}
            </div>
            <p className="empty-message">
              {filter === 'unread'
                ? 'All caught up! No unread notifications.'
                : filter === 'high-priority'
                ? 'No high priority notifications.'
                : filter === 'today'
                ? 'No notifications today.'
                : 'No notifications found.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer with quick actions */}
      {notifications.length > 0 && (
        <div className="panel-footer">
          <div className="footer-stats">
            <span className="stats-text">
              Showing {filteredNotifications.length} of {notifications.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

NotificationPanel.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.shape({
    notificationId: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    isRead: PropTypes.bool.isRequired,
    createdAt: PropTypes.string.isRequired,
    priority: PropTypes.string,
    type: PropTypes.string
  })).isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  onClose: PropTypes.func
};

export default NotificationPanel;
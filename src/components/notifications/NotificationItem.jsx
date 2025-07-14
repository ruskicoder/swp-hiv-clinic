import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './NotificationItem.css';

/**
 * Enhanced notification item component with priority indicators and actions
 * Supports different notification types and improved styling
 */
const NotificationItem = ({ notification, onMarkAsRead, enhanced = false }) => {
  const { notificationId, title, message, isRead, createdAt, priority, type } = notification;
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * Calculate time ago from creation date
   */
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    
    if (interval > 1) {
      return Math.floor(interval) + " year" + (Math.floor(interval) !== 1 ? "s" : "") + " ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " month" + (Math.floor(interval) !== 1 ? "s" : "") + " ago";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " day" + (Math.floor(interval) !== 1 ? "s" : "") + " ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hour" + (Math.floor(interval) !== 1 ? "s" : "") + " ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minute" + (Math.floor(interval) !== 1 ? "s" : "") + " ago";
    }
    return "Just now";
  };

  /**
   * Get notification type icon
   */
  const getTypeIcon = (notificationType) => {
    const iconMap = {
      'APPOINTMENT_REMINDER': '📅',
      'MEDICATION_REMINDER': '💊',
      'FOLLOW_UP': '🔄',
      'GENERAL': '📢',
      'EMERGENCY': '🚨',
      'EDUCATIONAL': '📚',
      'SYSTEM': '⚙️'
    };
    return iconMap[notificationType] || '📨';
  };

  /**
   * Get priority info
   */
  const getPriorityInfo = (notificationPriority) => {
    const priorityMap = {
      'URGENT': { class: 'urgent', icon: '🔴', text: 'Urgent' },
      'HIGH': { class: 'high', icon: '🟡', text: 'High' },
      'MEDIUM': { class: 'medium', icon: '🔵', text: 'Medium' },
      'LOW': { class: 'low', icon: '⚪', text: 'Low' }
    };
    return priorityMap[notificationPriority] || { class: 'medium', icon: '🔵', text: 'Medium' };
  };

  /**
   * Handle notification click - marks individual notification as read
   */
  const handleNotificationClick = (e) => {
    // Prevent propagation to avoid conflicts with other click handlers
    e.stopPropagation();
    
    // Only mark as read if the notification is currently unread
    if (!isRead && onMarkAsRead) {
      console.log('Marking notification as read:', notificationId);
      onMarkAsRead(notificationId);
    }
  };

  /**
   * Toggle expanded view for long messages
   */
  const toggleExpanded = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const priorityInfo = getPriorityInfo(priority);
  const typeIcon = getTypeIcon(type);
  const isLongMessage = message && message.length > 120;
  const displayMessage = isLongMessage && !isExpanded
    ? `${message.substring(0, 120)}...`
    : message;

  return (
    <div
      className={`notification-item ${isRead ? 'read' : 'unread'} ${enhanced ? 'enhanced' : ''} priority-${priorityInfo.class}`}
      onClick={handleNotificationClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleNotificationClick(e);
        }
      }}
      aria-label={`Notification: ${title}. ${isRead ? 'Read' : 'Unread'}. Priority: ${priorityInfo.text}`}
    >
      {/* Notification Indicator */}
      {!isRead && <div className="unread-indicator" aria-hidden="true"></div>}

      <div className="notification-content">
        {/* Header Section */}
        <div className="item-header">
          <div className="header-left">
            {enhanced && (
              <div className="notification-meta">
                <span className="type-icon" title={type} aria-label={`Type: ${type}`}>
                  {typeIcon}
                </span>
                <span
                  className={`priority-indicator priority-${priorityInfo.class}`}
                  title={`Priority: ${priorityInfo.text}`}
                  aria-label={`Priority: ${priorityInfo.text}`}
                >
                  {priorityInfo.icon}
                </span>
              </div>
            )}
            <span className="item-title">{title}</span>
          </div>
          
          <div className="header-right">
            <span className="item-time" title={new Date(createdAt).toLocaleString()}>
              {timeAgo(createdAt)}
            </span>
          </div>
        </div>

        {/* Message Body */}
        <div className="item-body">
          <div className="message-content">
            {displayMessage}
          </div>
          
          {/* Expand/Collapse for long messages */}
          {isLongMessage && (
            <button
              className="expand-toggle"
              onClick={toggleExpanded}
              aria-label={isExpanded ? 'Show less' : 'Show more'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Enhanced Actions */}
        {enhanced && (
          <div className="notification-actions">
            <button
              className="action-btn details-btn"
              onClick={(e) => {
                e.stopPropagation();
                // Create a detailed view of the notification
                const detailsContent = `
Notification Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 ID: ${notificationId}
📝 Title: ${title}
📄 Message: ${message}
📅 Created: ${new Date(createdAt).toLocaleString()}
🔖 Type: ${type || 'GENERAL'}
⚡ Priority: ${priority || 'MEDIUM'}
👁️ Status: ${isRead ? 'Read' : 'Unread'}
${notification.relatedEntityType ? `🔗 Related: ${notification.relatedEntityType}` : ''}
${notification.relatedEntityId ? `🆔 Entity ID: ${notification.relatedEntityId}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                `;
                
                // Show details in an alert for now - in production this would be a modal
                alert(detailsContent);
                
                console.log('Notification Details:', {
                  notificationId,
                  title,
                  message,
                  createdAt,
                  type,
                  priority,
                  isRead,
                  relatedEntityType: notification.relatedEntityType,
                  relatedEntityId: notification.relatedEntityId
                });
              }}
              title="View notification details"
              aria-label="View detailed information about this notification"
            >
              <span className="action-icon">👁️</span>
              <span className="action-text">Details</span>
            </button>
          </div>
        )}
      </div>

      {/* Priority Border */}
      {enhanced && priority && (priority === 'HIGH' || priority === 'URGENT') && (
        <div className={`priority-border priority-${priorityInfo.class}`} aria-hidden="true"></div>
      )}
    </div>
  );
};

NotificationItem.propTypes = {
  notification: PropTypes.shape({
    notificationId: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    isRead: PropTypes.bool.isRequired,
    createdAt: PropTypes.string.isRequired,
    priority: PropTypes.string,
    type: PropTypes.string
  }).isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  enhanced: PropTypes.bool
};

export default NotificationItem;
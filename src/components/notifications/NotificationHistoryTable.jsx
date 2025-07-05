import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import './NotificationHistoryTable.css';

/**
 * Table component for displaying notification history with actions
 * Supports sorting, filtering, and bulk operations
 */
const NotificationHistoryTable = ({ 
  notifications, 
  patients,
  onUnsend,
  onBulkOperation,
  onRefresh 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);

  /**
   * Sort notifications based on current sort configuration
   */
  const sortedNotifications = useMemo(() => {
    if (!sortConfig.key) return notifications;

    return [...notifications].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle different data types
      if (sortConfig.key === 'createdAt' || sortConfig.key === 'sentAt' || sortConfig.key === 'scheduledAt') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [notifications, sortConfig]);

  /**
   * Handle column sorting
   */
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  /**
   * Handle individual notification selection
   */
  const handleNotificationSelect = (notificationId) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  /**
   * Handle select all notifications
   */
  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.notificationId));
    }
  };

  /**
   * Handle bulk operations
   */
  const handleBulkAction = async (operation) => {
    if (selectedNotifications.length === 0) return;

    setLoading(true);
    try {
      const result = await onBulkOperation(operation, selectedNotifications);
      if (result.success) {
        setSelectedNotifications([]);
      }
    } catch (error) {
      console.error(`Error performing bulk ${operation}:`, error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle unsend individual notification
   */
  const handleUnsend = async (notificationId) => {
    setLoading(true);
    try {
      await onUnsend(notificationId);
    } catch (error) {
      console.error('Error unsending notification:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle row expansion for message content
   */
  const toggleRowExpansion = (notificationId) => {
    setExpandedRows(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  /**
   * Get patient name by ID
   */
  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.userId === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  /**
   * Get status badge class and text
   */
  const getStatusInfo = (status) => {
    const statusMap = {
      SENT: { class: 'sent', text: 'Sent', icon: '✓' },
      PENDING: { class: 'pending', text: 'Pending', icon: '⏳' },
      CANCELLED: { class: 'cancelled', text: 'Cancelled', icon: '✕' },
      FAILED: { class: 'failed', text: 'Failed', icon: '⚠️' }
    };
    return statusMap[status] || { class: 'unknown', text: status, icon: '?' };
  };

  /**
   * Get priority badge class and text
   */
  const getPriorityInfo = (priority) => {
    const priorityMap = {
      LOW: { class: 'low', text: 'Low' },
      MEDIUM: { class: 'medium', text: 'Medium' },
      HIGH: { class: 'high', text: 'High' },
      URGENT: { class: 'urgent', text: 'Urgent' }
    };
    return priorityMap[priority] || { class: 'medium', text: priority };
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  /**
   * Truncate text for display
   */
  const truncateText = (text, maxLength = 50) => {
    if (!text) return '-';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const canUnsend = (notification) => {
    return notification.status === 'PENDING' || notification.status === 'SCHEDULED';
  };

  const selectedUnsendableCount = selectedNotifications.filter(id => {
    const notification = notifications.find(n => n.notificationId === id);
    return notification && canUnsend(notification);
  }).length;

  if (notifications.length === 0) {
    return (
      <div className="notification-history-empty">
        <div className="empty-icon">📨</div>
        <h3>No Notifications Found</h3>
        <p>No notification history available. Send your first notification to see it here.</p>
        <button className="btn-primary" onClick={onRefresh}>
          <span className="icon">🔄</span>
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="notification-history-table">
      {/* Bulk Actions Bar */}
      {selectedNotifications.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="selection-info">
            <span>{selectedNotifications.length} notification{selectedNotifications.length !== 1 ? 's' : ''} selected</span>
            {selectedUnsendableCount > 0 && (
              <span className="unsendable-count">
                ({selectedUnsendableCount} can be unsent)
              </span>
            )}
          </div>
          
          <div className="bulk-actions">
            {selectedUnsendableCount > 0 && (
              <button
                className="btn-danger"
                onClick={() => handleBulkAction('unsend')}
                disabled={loading}
              >
                <span className="icon">🚫</span>
                Unsend Selected
              </button>
            )}
            
            <button
              className="btn-secondary"
              onClick={() => setSelectedNotifications([])}
              disabled={loading}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="table-container">
        <table className="notifications-table">
          <thead>
            <tr>
              <th className="checkbox-column">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={handleSelectAll}
                  disabled={loading}
                  aria-label="Select all notifications"
                />
              </th>
              
              <th 
                className={`sortable ${sortConfig.key === 'subject' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('subject')}
              >
                Subject
                <span className="sort-indicator">
                  {sortConfig.key === 'subject' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              
              <th 
                className={`sortable ${sortConfig.key === 'patientId' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('patientId')}
              >
                Patient
                <span className="sort-indicator">
                  {sortConfig.key === 'patientId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              
              <th 
                className={`sortable ${sortConfig.key === 'status' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('status')}
              >
                Status
                <span className="sort-indicator">
                  {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              
              <th 
                className={`sortable ${sortConfig.key === 'priority' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('priority')}
              >
                Priority
                <span className="sort-indicator">
                  {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              
              <th 
                className={`sortable ${sortConfig.key === 'createdAt' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('createdAt')}
              >
                Created
                <span className="sort-indicator">
                  {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              
              <th 
                className={`sortable ${sortConfig.key === 'sentAt' ? sortConfig.direction : ''}`}
                onClick={() => handleSort('sentAt')}
              >
                Sent
                <span className="sort-indicator">
                  {sortConfig.key === 'sentAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </span>
              </th>
              
              <th>Actions</th>
            </tr>
          </thead>
          
          <tbody>
            {sortedNotifications.map(notification => {
              const statusInfo = getStatusInfo(notification.status);
              const priorityInfo = getPriorityInfo(notification.priority);
              const isExpanded = expandedRows.includes(notification.notificationId);
              const isSelected = selectedNotifications.includes(notification.notificationId);
              
              return (
                <React.Fragment key={notification.notificationId}>
                  <tr className={`notification-row ${isSelected ? 'selected' : ''}`}>
                    <td className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleNotificationSelect(notification.notificationId)}
                        disabled={loading}
                        aria-label={`Select notification ${notification.subject}`}
                      />
                    </td>
                    
                    <td className="subject-column">
                      <div className="subject-content">
                        <span className="subject-text">{notification.subject}</span>
                        <button
                          className="expand-btn"
                          onClick={() => toggleRowExpansion(notification.notificationId)}
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} message content`}
                        >
                          {isExpanded ? '▼' : '▶'}
                        </button>
                      </div>
                      <div className="template-name">
                        {notification.templateName && (
                          <span className="template-badge">📋 {notification.templateName}</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="patient-column">
                      {getPatientName(notification.patientId)}
                    </td>
                    
                    <td className="status-column">
                      <span className={`status-badge ${statusInfo.class}`}>
                        <span className="status-icon">{statusInfo.icon}</span>
                        {statusInfo.text}
                      </span>
                    </td>
                    
                    <td className="priority-column">
                      <span className={`priority-badge ${priorityInfo.class}`}>
                        {priorityInfo.text}
                      </span>
                    </td>
                    
                    <td className="date-column">
                      {formatDate(notification.createdAt)}
                    </td>
                    
                    <td className="date-column">
                      {formatDate(notification.sentAt)}
                    </td>
                    
                    <td className="actions-column">
                      <div className="action-buttons">
                        {canUnsend(notification) && (
                          <button
                            className="btn-danger-small"
                            onClick={() => handleUnsend(notification.notificationId)}
                            disabled={loading}
                            title="Unsend notification"
                          >
                            🚫
                          </button>
                        )}
                        
                        <button
                          className="btn-secondary-small"
                          onClick={() => toggleRowExpansion(notification.notificationId)}
                          title="View message content"
                        >
                          👁️
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Content Row */}
                  {isExpanded && (
                    <tr className="expanded-row">
                      <td colSpan="8">
                        <div className="expanded-content">
                          <div className="message-content">
                            <h4>Message Content:</h4>
                            <div className="message-text">
                              {notification.message || notification.content}
                            </div>
                          </div>
                          
                          {notification.scheduledAt && (
                            <div className="scheduled-info">
                              <h4>Scheduling Information:</h4>
                              <p><strong>Scheduled for:</strong> {formatDate(notification.scheduledAt)}</p>
                            </div>
                          )}
                          
                          {notification.errorMessage && (
                            <div className="error-info">
                              <h4>Error Details:</h4>
                              <p className="error-text">{notification.errorMessage}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
};

NotificationHistoryTable.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.shape({
    notificationId: PropTypes.number.isRequired,
    subject: PropTypes.string.isRequired,
    message: PropTypes.string,
    content: PropTypes.string,
    patientId: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    priority: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    sentAt: PropTypes.string,
    scheduledAt: PropTypes.string,
    templateName: PropTypes.string,
    errorMessage: PropTypes.string
  })).isRequired,
  patients: PropTypes.arrayOf(PropTypes.shape({
    userId: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  })).isRequired,
  onUnsend: PropTypes.func.isRequired,
  onBulkOperation: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default NotificationHistoryTable;
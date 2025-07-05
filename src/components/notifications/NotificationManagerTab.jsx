import React from 'react';
import PropTypes from 'prop-types';
import NotificationManagementDashboard from './NotificationManagementDashboard';
import './NotificationManagerTab.css';

/**
 * Tab component for notification management in the doctor dashboard
 * Wraps the NotificationManagementDashboard with proper tab styling
 */
const NotificationManagerTab = ({ isActive }) => {
  if (!isActive) {
    return null;
  }

  return (
    <div className="notification-manager-tab">
      <div className="tab-content-wrapper">
        <NotificationManagementDashboard />
      </div>
    </div>
  );
};

NotificationManagerTab.propTypes = {
  isActive: PropTypes.bool.isRequired
};

export default NotificationManagerTab;
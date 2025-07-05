import React from 'react';
import NotificationItem from './NotificationItem';
import './NotificationPanel.css';

const NotificationPanel = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
    return (
        <div className="notification-panel">
            <div className="panel-header">
                <h3>Notifications</h3>
                <button onClick={onMarkAllAsRead}>Mark all as read</button>
            </div>
            <div className="panel-body">
                {notifications.map(notification => (
                    <NotificationItem
                        key={notification.notificationId}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                    />
                ))}
            </div>
        </div>
    );
};

export default NotificationPanel;
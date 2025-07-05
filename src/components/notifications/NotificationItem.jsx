import React from 'react';
import './NotificationItem.css';

const NotificationItem = ({ notification, onMarkAsRead }) => {
    const { notificationId, type, message, status, createdAt } = notification;

    // Generate a title based on the notification type if not provided
    const getTitle = () => {
        switch (type) {
            case 'APPOINTMENT_REMINDER':
                return 'Appointment Reminder';
            case 'MEDICATION_REMINDER':
                return 'Medication Reminder';
            case 'FOLLOW_UP_REQUIRED':
                return 'Follow-up Required';
            case 'TEST_RESULTS_AVAILABLE':
                return 'Test Results Available';
            case 'CUSTOM':
                return 'Message from Provider';
            default:
                return 'Notification';
        }
    };

    const title = notification.title || getTitle();
    const isRead = status === 'Read';
    const isSeen = status === 'Seen' || isRead;

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) {
            return Math.floor(interval) + " years ago";
        }
        interval = seconds / 2592000;
        if (interval > 1) {
            return Math.floor(interval) + " months ago";
        }
        interval = seconds / 86400;
        if (interval > 1) {
            return Math.floor(interval) + " days ago";
        }
        interval = seconds / 3600;
        if (interval > 1) {
            return Math.floor(interval) + " hours ago";
        }
        interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + " minutes ago";
        }
        return Math.floor(seconds) + " seconds ago";
    };

    const handleClick = () => {
        // Only mark as read if not already read
        if (!isRead) {
            onMarkAsRead(notificationId);
        }
    };

    const getIconForType = () => {
        switch (type) {
            case 'APPOINTMENT_REMINDER':
                return (
                    <svg className="notification-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                    </svg>
                );
            case 'MEDICATION_REMINDER':
                return (
                    <svg className="notification-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M6 3h12v2H6zm11 3H7c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-1 9h-2.5v2.5h-3V15H8v-3h2.5V9.5h3V12H16v3z" />
                    </svg>
                );
            case 'TEST_RESULTS_AVAILABLE':
                return (
                    <svg className="notification-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                    </svg>
                );
            default:
                return (
                    <svg className="notification-icon" viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 9h-2V5h2v6zm0 4h-2v-2h2v2z" />
                    </svg>
                );
        }
    };

    return (
        <div
            className={`notification-item ${isRead ? 'read' : isSeen ? 'seen' : 'unread'}`}
            onClick={handleClick}
        >
            <div className="item-icon">
                {getIconForType()}
            </div>
            <div className="item-content">
                <div className="item-header">
                    <span className="item-title">{title}</span>
                    <span className="item-time">{timeAgo(createdAt)}</span>
                </div>
                <div className="item-body">{message}</div>
                {notification.payload && notification.payload.appointmentDateTime && (
                    <div className="item-details">
                        <span className="appointment-time">
                            <strong>Appointment:</strong> {new Date(notification.payload.appointmentDateTime).toLocaleString()}
                        </span>
                    </div>
                )}
                {notification.payload && notification.payload.medicationName && (
                    <div className="item-details">
                        <span className="medication-name">
                            <strong>Medication:</strong> {notification.payload.medicationName} {notification.payload.dosage && `(${notification.payload.dosage})`}
                        </span>
                    </div>
                )}
            </div>
            {!isRead && (
                <div className="item-status-indicator"></div>
            )}
        </div>
    );
};

export default NotificationItem;
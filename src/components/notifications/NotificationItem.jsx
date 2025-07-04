import React from 'react';
import './NotificationItem.css';

const NotificationItem = ({ notification, onMarkAsRead }) => {
    const { notificationId, title, message, isRead, createdAt } = notification;

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

    return (
        <div
            className={`notification-item ${isRead ? 'read' : 'unread'}`}
            onClick={() => onMarkAsRead(notificationId)}
        >
            <div className="item-header">
                <span className="item-title">{title}</span>
                <span className="item-time">{timeAgo(createdAt)}</span>
            </div>
            <div className="item-body">{message}</div>
        </div>
    );
};

export default NotificationItem;
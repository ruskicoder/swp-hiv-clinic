import React from 'react';
import './NotificationIcon.css';

const NotificationIcon = ({ count, onClick }) => {
    return (
        <div className="notification-icon" onClick={onClick}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            {count > 0 && <span className="badge">{count}</span>}
        </div>
    );
};

export default NotificationIcon;
import { useAuth } from '../../contexts/AuthContext';
import UserProfileDropdown from './UserProfileDropdown';
import { useState, useEffect } from 'react';
import './DashboardHeader.css';

const DashboardHeader = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    const timeString = date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
    const dateString = date.toLocaleDateString('en-GB', { 
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
    return `${dateString} ${timeString}`;
  };

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-content">
        <div className="dashboard-header-info">
          <span
            className="nav-logo"
            tabIndex={0}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            onClick={() => window.location.pathname = '/'}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') window.location.pathname = '/'; }}
          >
            <span className="logo-icon" style={{ color: '#10b981', fontSize: '1.5rem', display: 'flex', alignItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </span>
            <span style={{ color: '#059669', fontWeight: 700, fontSize: '1.1rem' }}>HIV Medical System</span>
          </span>
          <span className="dashboard-header-titles">
            {title && <h1 className="dashboard-title">{title}</h1>}
            {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
            <p className="dashboard-clock">{formatDateTime(currentDateTime)}</p>
          </span>
        </div>
        
        <div className="dashboard-header-actions">
          <UserProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
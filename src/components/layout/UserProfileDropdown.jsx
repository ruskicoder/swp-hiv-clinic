import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './UserProfileDropdown.css';

const UserProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsOpen(!isOpen);
  };

  const handleDashboard = () => {
    setIsOpen(false);
    // Ensure role is always a string
    let role = user?.role;
    if (typeof role === 'object' && role !== null) {
      role = role.roleName || role.name || '';
    }
    role = (role || '').toLowerCase();
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'doctor':
        navigate('/doctor');
        break;
      case 'patient':
        navigate('/customer');
        break;
      default:
        navigate('/');
    }
  };

  const handleSettings = () => {
    setIsOpen(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/');
  };

  const getInitials = (firstName, lastName) => {
    // Handle empty string or missing names
    const f = (firstName || '').trim();
    const l = (lastName || '').trim();
    if (f && l) {
      return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    const f = (user?.firstName || '').trim();
    const l = (user?.lastName || '').trim();
    if (f && l) {
      return `${f} ${l}`;
    }
    return user?.username || 'User';
  };

  const getUserRole = () => {
    // Always return a string for role
    if (typeof user?.role === 'object' && user?.role !== null) {
      return user.role.roleName || user.role.name || 'User';
    }
    return user?.role || 'User';
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-profile-dropdown" ref={dropdownRef}>
      <button 
        className="profile-button"
        onClick={handleProfileClick}
        aria-label="User profile menu"
        aria-expanded={isOpen}
      >
        <div className="profile-avatar">
          {user?.profileImageBase64 ? (
            <img 
              src={user.profileImageBase64}
              alt="Profile"
              className="profile-image"
            />
          ) : (
            <div className="profile-initials">
              {getInitials(user?.firstName, user?.lastName)}
            </div>
          )}
        </div>
        <div className="profile-info">
          <span className="profile-name">{getUserDisplayName()}</span>
          <span className="profile-role">{getUserRole()}</span>
        </div>
        <svg 
          className={`dropdown-arrow ${isOpen ? 'open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none"
        >
          <path 
            d="M6 9l6 6 6-6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          <div
            className="dropdown-header"
            onClick={handleDashboard}
            style={{ cursor: 'pointer' }}
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleDashboard(); }}
          >
            <div className="dropdown-avatar">
              {user?.profileImageBase64 ? (
                <img 
                  src={user.profileImageBase64}
                  alt="Profile"
                  className="dropdown-profile-image"
                />
              ) : (
                <div className="dropdown-profile-initials">
                  {getInitials(user?.firstName, user?.lastName)}
                </div>
              )}
            </div>
            <div className="dropdown-user-info">
              <span className="dropdown-name">{getUserDisplayName()}</span>
              <span className="dropdown-email">{user?.email}</span>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-items">
            <button 
              className="dropdown-item"
              onClick={handleSettings}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Settings
            </button>

            <div className="dropdown-divider"></div>

            <button 
              className="dropdown-item logout-item"
              onClick={handleLogout}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
                <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;
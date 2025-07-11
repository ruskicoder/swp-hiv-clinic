import React from 'react';
import { formatLastLogin } from '../../utils/dateUtils';
import SafeText from './SafeText';
import './LastLoginDisplay.css';

/**
 * Component to display last login information
 * @param {Object} props - Component props
 * @param {string|Date} props.lastLogin - Last login date/time
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showIcon - Whether to show an icon
 * @param {string} props.variant - Display variant ('inline', 'card', 'simple')
 */
const LastLoginDisplay = ({ 
  lastLogin, 
  className = '', 
  showIcon = false, 
  variant = 'simple' 
}) => {
  const formattedDate = formatLastLogin(lastLogin);
  const isNever = !lastLogin || formattedDate === 'Never';
  
  const baseClasses = `last-login-display ${variant} ${className}`;
  const statusClass = isNever ? 'never' : 'has-login';
  
  const renderContent = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`${baseClasses} ${statusClass}`}>
            <div className="last-login-header">
              {showIcon && <span className="last-login-icon">🕒</span>}
              <span className="last-login-label">Last Login</span>
            </div>
            <div className="last-login-value">
              <SafeText>{formattedDate}</SafeText>
            </div>
          </div>
        );
        
      case 'inline':
        return (
          <span className={`${baseClasses} ${statusClass}`}>
            {showIcon && <span className="last-login-icon">🕒</span>}
            <span className="last-login-text">
              Last login: <SafeText>{formattedDate}</SafeText>
            </span>
          </span>
        );
        
      default: // 'simple'
        return (
          <span className={`${baseClasses} ${statusClass}`}>
            <SafeText>{formattedDate}</SafeText>
          </span>
        );
    }
  };
  
  return renderContent();
};

export default LastLoginDisplay;
import React from 'react';

/**
 * Enhanced utility functions for safe rendering of data
 */

/**
 * Safely renders a value, handling null, undefined, and object cases
 * @param {any} value - The value to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Safe string representation
 */
export const safeRender = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object') {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    
    // For other objects, try to extract meaningful data
    if (value.toString && typeof value.toString === 'function') {
      const stringValue = value.toString();
      if (stringValue !== '[object Object]') {
        return stringValue;
      }
    }
    
    // Last resort: JSON stringify
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Error stringifying object:', error);
      return '[Complex Object]';
    }
  }
  
  return String(value);
};

/**
 * Safely renders a date value
 * @param {any} dateValue - The date value to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted date string
 */
export const safeDate = (dateValue) => {
  if (!dateValue) return '';
  
  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (Array.isArray(dateValue) && dateValue.length >= 3) {
      // Handle [year, month, day] format
      date = new Date(dateValue[0], dateValue[1] - 1, dateValue[2]);
    } else {
      return safeRender(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Error formatting date:', dateValue, error);
    return safeRender(dateValue);
  }
};

/**
 * Safely renders a date and time value
 * @param {any} dateTimeValue - The datetime value to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted datetime string
 */
export const safeDateTime = (dateTimeValue) => {
  if (!dateTimeValue) return '';
  
  try {
    const date = new Date(dateTimeValue);
    
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    return date.toLocaleString();
  } catch (error) {
    console.warn('Error formatting datetime:', dateTimeValue, error);
    return safeRender(dateTimeValue);
  }
};

/**
 * Safely renders a time value
 * @param {any} timeValue - The time value to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted time string
 */
export const safeTime = (timeValue) => {
  if (!timeValue) return '';
  
  try {
    // Handle time strings like "14:30:00" or "14:30"
    if (typeof timeValue === 'string') {
      const timeParts = timeValue.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        
        if (!isNaN(hours) && !isNaN(minutes)) {
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
        }
      }
    }
    
    // Handle Date objects
    if (timeValue instanceof Date) {
      return timeValue.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    // Try to parse as date
    const date = new Date(timeValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return 'Invalid Time';
  } catch (error) {
    console.warn('Error formatting time:', timeValue, error);
    return safeRender(timeValue);
  }
};

/**
 * Safely renders user information
 * @param {any} user - The user object to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - User display name
 */
export const safeUser = (user, fallback = 'N/A') => {
  if (!user) return fallback;
  
  if (typeof user === 'string') return user;
  
  if (typeof user === 'object') {
    // Handle nested user objects
    const userObj = user.user || user;
    
    // Try different combinations of name fields
    if (userObj.firstName && userObj.lastName) {
      return `${userObj.firstName} ${userObj.lastName}`;
    }
    if (userObj.username) return userObj.username;
    if (userObj.name) return userObj.name;
    if (userObj.displayName) return userObj.displayName;
    if (userObj.email) return userObj.email;
  }
  
  return fallback;
};

/**
 * Safely renders role information
 * @param {any} role - The role object to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Role name
 */
export const safeRole = (role, fallback = 'N/A') => {
  if (!role) return fallback;
  
  if (typeof role === 'string') return role;
  
  if (typeof role === 'object') {
    // Handle nested role objects
    const roleObj = role.role || role;
    
    if (roleObj.roleName) return roleObj.roleName;
    if (roleObj.name) return roleObj.name;
  }
  
  return fallback;
};

/**
 * Safely renders status with proper capitalization
 * @param {any} status - The status to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted status
 */
export const safeStatus = (status, fallback = 'N/A') => {
  if (!status) return fallback;
  
  const statusStr = String(status);
  return statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();
};

/**
 * Formats duration in minutes to human readable format
 * @param {number} minutes - Duration in minutes
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted duration
 */
export const formatDuration = (minutes, fallback = 'N/A') => {
  if (!minutes || isNaN(minutes)) return fallback;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} hr`;
  } else {
    return `${hours} hr ${mins} min`;
  }
};

// Export all functions as named exports
export default {
  safeRender,
  safeDate,
  safeDateTime,
  safeTime,
  safeUser,
  safeRole,
  safeStatus,
  formatDuration
};

export const debugObject = (obj, label = 'Object') => {
  console.group(`Debug: ${label}`);
  console.log('Type:', typeof obj);
  console.log('Value:', obj);
  console.log('Constructor:', obj?.constructor?.name);
  console.log('Keys:', obj && typeof obj === 'object' ? Object.keys(obj) : 'N/A');
  console.groupEnd();
  return obj;
};
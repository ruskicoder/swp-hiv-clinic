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
export const safeRender = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'object') {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    // For other objects, return fallback instead of trying to stringify
    return fallback;
  }
  
  return String(value);
};

/**
 * Safely renders a date value
 * @param {any} dateValue - The date value to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted date string
 */
export const safeDate = (dateValue, fallback = 'N/A') => {
  if (!dateValue) return fallback;
  
  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string') {
      // Handle date strings consistently
      if (dateValue.includes('T')) {
        // ISO datetime string - extract date part only
        const datePart = dateValue.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        // Simple date string YYYY-MM-DD
        const [year, month, day] = dateValue.split('-').map(Number);
        date = new Date(year, month - 1, day); // month is 0-indexed
      }
    } else if (typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else {
      return fallback;
    }
    
    if (isNaN(date.getTime())) return fallback;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.warn('Failed to parse date:', dateValue, error);
    return fallback;
  }
};

/**
 * Safely renders a date and time value
 * @param {any} dateTimeValue - The datetime value to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted datetime string
 */
export const safeDateTime = (dateTimeValue, fallback = 'N/A') => {
  if (!dateTimeValue) return fallback;
  
  try {
    let date;
    
    if (dateTimeValue instanceof Date) {
      date = dateTimeValue;
    } else if (typeof dateTimeValue === 'string') {
      date = new Date(dateTimeValue);
    } else if (typeof dateTimeValue === 'number') {
      date = new Date(dateTimeValue);
    } else {
      return fallback;
    }
    
    if (isNaN(date.getTime())) return fallback;
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('Failed to parse datetime:', dateTimeValue, error);
    return fallback;
  }
};

/**
 * Safely renders a time value
 * @param {any} timeValue - The time value to render
 * @param {string} fallback - Fallback value if the input is null/undefined
 * @returns {string} - Formatted time string
 */
export const safeTime = (timeValue, fallback = 'N/A') => {
  if (!timeValue) return fallback;
  
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
    
    return fallback;
  } catch (error) {
    console.warn('Failed to parse time:', timeValue, error);
    return fallback;
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
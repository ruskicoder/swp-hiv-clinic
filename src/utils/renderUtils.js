import React from 'react';

/**
 * Utility functions for safe rendering of data
 */

/**
 * Safely render any value, handling null, undefined, and objects
 */
export const safeRender = (value, fallback = 'N/A') => {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  if (typeof value === 'object') {
  // Handle arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : fallback;
  }
  
    // Handle objects with name property (common pattern)
    if (value.name) {
      return value.name;
    }
    
    // Handle objects with username property
    if (value.username) {
      return value.username;
    }
    
    // Handle objects with roleName property
    if (value.roleName) {
      return value.roleName;
    }
    
    // Handle objects with specialtyName property
    if (value.specialtyName) {
      return value.specialtyName;
    }
    
    // For other objects, try to stringify safely
  try {
      return JSON.stringify(value);
  } catch (error) {
      console.warn('Failed to stringify object:', value, error);
      return fallback;
  }
  }
  
  return String(value);
};

/**
 * Safely render date values
 */
export const safeDate = (dateValue, fallback = 'N/A') => {
  if (!dateValue) {
    return fallback;
  }
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleDateString();
  } catch (error) {
    console.warn('Failed to parse date:', dateValue, error);
    return fallback;
  }
};

/**
 * Safely render datetime values
 */
export const safeDateTime = (dateTimeValue, fallback = 'N/A') => {
  if (!dateTimeValue) {
    return fallback;
  }
  
  try {
    const date = new Date(dateTimeValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleString();
  } catch (error) {
    console.warn('Failed to parse datetime:', dateTimeValue, error);
    return fallback;
  }
};

/**
 * Safely render time values
 */
export const safeTime = (timeValue, fallback = 'N/A') => {
  if (!timeValue) {
    return fallback;
  }
  
  try {
    // Handle time strings like "14:30:00"
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      const timeParts = timeValue.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    
    // Handle Date objects
    const date = new Date(timeValue);
    if (isNaN(date.getTime())) {
      return fallback;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.warn('Failed to parse time:', timeValue, error);
    return fallback;
  }
};

/**
 * Safely render user information
 */
export const safeUser = (user, fallback = 'N/A') => {
  if (!user) {
    return fallback;
  }
  
  if (typeof user === 'string') {
    return user;
  }
  
  if (typeof user === 'object') {
    // Try different common user properties
    if (user.username) {
      return user.username;
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.name) {
      return user.name;
    }
    if (user.email) {
      return user.email;
    }
  }
  
  return fallback;
};

/**
 * Safely render role information
 */
export const safeRole = (role, fallback = 'N/A') => {
  if (!role) {
    return fallback;
  }
  
  if (typeof role === 'string') {
    return role;
  }
  
  if (typeof role === 'object' && role.roleName) {
    return role.roleName;
  }
  
  return fallback;
};

/**
 * Safely render status with proper formatting
 */
export const safeStatus = (status, fallback = 'N/A') => {
  if (!status) {
    return fallback;
  }
  
  return String(status).charAt(0).toUpperCase() + String(status).slice(1).toLowerCase();
};

/**
 * Format duration in minutes to readable format
 */
export const formatDuration = (minutes, fallback = 'N/A') => {
  if (!minutes || isNaN(minutes)) {
    return fallback;
  }
  
  const mins = parseInt(minutes);
  if (mins < 60) {
    return `${mins} min`;
  }
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  
  if (remainingMins === 0) {
    return `${hours} hr`;
  }
  
  return `${hours} hr ${remainingMins} min`;
};

/**
 * Safe text component for React
 */
export const SafeText = ({ children, fallback = 'N/A' }) => {
  return safeRender(children, fallback);
};

export default {
  safeRender,
  safeDate,
  safeDateTime,
  safeTime,
  safeUser,
  safeRole,
  safeStatus,
  formatDuration,
  SafeText
};
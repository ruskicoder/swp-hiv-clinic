import React from 'react';

/**
 * Enhanced utility functions for safe rendering of data
 */

/**
 * Safely render any value, handling null, undefined, and objects
 */
export const safeRender = (value, fallback = 'N/A') => {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return fallback;
  }
  
  // Handle primitive types
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
  return String(value);
  }
  
  // Handle objects
  if (typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return fallback;
      return value.map(item => safeRender(item, '')).filter(Boolean).join(', ') || fallback;
    }
    
    // Handle Date objects
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? fallback : value.toLocaleDateString();
    }
    
    // Handle common object patterns
    const extractors = [
      'name',
      'username', 
      'firstName',
      'lastName',
      'title',
      'label',
      'roleName',
      'specialtyName',
      'displayName',
      'email'
    ];
    
    for (const key of extractors) {
      if (value[key] && typeof value[key] === 'string') {
        return value[key];
  }
    }
    
    // Handle full name combination
    if (value.firstName && value.lastName) {
      return `${value.firstName} ${value.lastName}`;
    }
    
    // Handle objects with id and name/title
    if (value.id && (value.name || value.title)) {
      return value.name || value.title;
    }
    
    // Last resort: try to stringify safely
    try {
      const stringified = JSON.stringify(value);
      if (stringified && stringified !== '{}' && stringified !== '[]') {
        return stringified.length > 50 ? `${stringified.substring(0, 47)}...` : stringified;
      }
    } catch (error) {
      console.warn('Failed to stringify object:', value, error);
    }
    
    return fallback;
  }
  
  return String(value);
};

/**
 * Safely render date values
 */
export const safeDate = (dateValue, fallback = 'N/A') => {
  if (!dateValue) return fallback;
  
  try {
    let date;
    
    if (dateValue instanceof Date) {
      date = dateValue;
    } else if (typeof dateValue === 'string' || typeof dateValue === 'number') {
      date = new Date(dateValue);
    } else if (typeof dateValue === 'object' && dateValue.toString) {
      date = new Date(dateValue.toString());
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
 * Safely render datetime values
 */
export const safeDateTime = (dateTimeValue, fallback = 'N/A') => {
  if (!dateTimeValue) return fallback;
  
  try {
    let date;
    
    if (dateTimeValue instanceof Date) {
      date = dateTimeValue;
    } else if (typeof dateTimeValue === 'string' || typeof dateTimeValue === 'number') {
      date = new Date(dateTimeValue);
    } else if (typeof dateTimeValue === 'object' && dateTimeValue.toString) {
      date = new Date(dateTimeValue.toString());
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
 * Safely render time values
 */
export const safeTime = (timeValue, fallback = 'N/A') => {
  if (!timeValue) return fallback;
  
  try {
    // Handle time strings like "14:30:00" or "14:30"
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      const timeParts = timeValue.split(':');
      if (timeParts.length >= 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        
        if (!isNaN(hours) && !isNaN(minutes)) {
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true
          });
        }
      }
    }
    
    // Handle Date objects
    if (timeValue instanceof Date) {
      if (isNaN(timeValue.getTime())) return fallback;
      return timeValue.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      });
    }
    
    // Try to parse as date
    const date = new Date(timeValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
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
 * Safely render user information
 */
export const safeUser = (user, fallback = 'N/A') => {
  if (!user) return fallback;
  
  if (typeof user === 'string') return user;
  
  if (typeof user === 'object') {
    // Try different user property combinations
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    if (user.username) return user.username;
    if (user.name) return user.name;
    if (user.displayName) return user.displayName;
    if (user.email) return user.email;
    
    // Handle user objects with nested properties
    if (user.user) {
      return safeUser(user.user, fallback);
    }
  }
  
  return fallback;
};

/**
 * Safely render role information
 */
export const safeRole = (role, fallback = 'N/A') => {
  if (!role) return fallback;
  
  if (typeof role === 'string') return role;
  
  if (typeof role === 'object') {
    if (role.roleName) return role.roleName;
    if (role.name) return role.name;
    if (role.role) return safeRole(role.role, fallback);
  }
  
  return fallback;
};

/**
 * Safely render status with proper formatting
 */
export const safeStatus = (status, fallback = 'N/A') => {
  if (!status) return fallback;
  
  const statusStr = String(status);
  return statusStr.charAt(0).toUpperCase() + statusStr.slice(1).toLowerCase();
};

/**
 * Format duration in minutes to readable format
 */
export const formatDuration = (minutes, fallback = 'N/A') => {
  if (!minutes || isNaN(minutes)) return fallback;
  
  const mins = parseInt(minutes, 10);
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

// Export all functions as default for backward compatibility
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
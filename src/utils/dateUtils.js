/**
 * Enhanced utility functions for date formatting and validation
 */

/**
 * Format date and time for API requests with enhanced error handling
 * @param {string|Date|Object} date - The date in various formats
 * @param {string|Date|Object} time - The time in various formats
 * @returns {string} - Formatted datetime string for API
 */
export const formatDateTimeForAPI = (date, time) => {
  try {
    if (!date) {
      throw new Error('Date is required');
    }

    let dateStr;
    let timeStr;

    // Handle date parameter
    if (date instanceof Date) {
      if (isNaN(date.getTime())) {
        throw new Error('Invalid Date object');
      }
      dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } else if (typeof date === 'string') {
      // Check if already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        dateStr = date;
      } else {
        // Try to parse and format
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        dateStr = parsedDate.toISOString().split('T')[0];
      }
    } else if (date && typeof date === 'object') {
      // Handle slot date objects that might have nested date properties
      if (date.slotDate) {
        return formatDateTimeForAPI(date.slotDate, time);
      } else if (date.date) {
        return formatDateTimeForAPI(date.date, time);
      } else {
        throw new Error('Invalid date object structure');
      }
    } else {
      throw new Error('Date must be a Date object or string');
    }

    // Handle time parameter - ENSURE SECONDS ARE ALWAYS INCLUDED
    if (!time) {
      timeStr = '00:00:00'; // Default to midnight if no time provided
    } else if (typeof time === 'string') {
      // Handle various time formats and ALWAYS ensure HH:mm:ss format
      if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
        timeStr = time; // Already in HH:mm:ss format
      } else if (/^\d{2}:\d{2}$/.test(time)) {
        timeStr = time + ':00'; // Add seconds
      } else if (/^\d{1,2}:\d{2}$/.test(time)) {
        // Handle single digit hours like "9:00"
        const [hours, minutes] = time.split(':');
        timeStr = hours.padStart(2, '0') + ':' + minutes + ':00';
      } else if (/^\d{4}$/.test(time)) {
        // Handle HHMM format
        timeStr = time.substring(0, 2) + ':' + time.substring(2) + ':00';
      } else if (/^\d{1,2}$/.test(time)) {
        // Handle hour only like "9" or "14"
        timeStr = time.padStart(2, '0') + ':00:00';
      } else {
        throw new Error('Invalid time format. Expected HH:mm:ss, HH:mm, or HHMM');
      }
    } else if (time instanceof Date) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const seconds = time.getSeconds().toString().padStart(2, '0');
      timeStr = `${hours}:${minutes}:${seconds}`;
    } else if (time && typeof time === 'object') {
      // Handle time objects that might have nested time properties
      if (time.startTime) {
        return formatDateTimeForAPI(date, time.startTime);
      } else if (time.time) {
        return formatDateTimeForAPI(date, time.time);
      } else {
        throw new Error('Invalid time object structure');
      }
    } else {
      throw new Error('Time must be a string or Date object');
    }

    // Ensure the final format is exactly YYYY-MM-DDTHH:mm:ss
    const result = `${dateStr}T${timeStr}`;
    
    // Validate the final format
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(result)) {
      throw new Error(`Invalid final format: ${result}. Expected YYYY-MM-DDTHH:mm:ss`);
    }

    console.log(`Formatted date/time: ${result}`);
    return result;

  } catch (error) {
    console.error('Error formatting date/time for API:', error);
    console.error('Input date:', date);
    console.error('Input time:', time);
    throw new Error(`Failed to format date/time: ${error.message}`);
  }
};

/**
 * Format a single datetime value for API requests
 * @param {Date|string|Object} dateTime - The datetime value
 * @returns {string} - Formatted datetime string for API
 */
export const formatSingleDateTimeForAPI = (dateTime) => {
  try {
    if (!dateTime) {
      throw new Error('DateTime is required');
    }

    if (dateTime instanceof Date) {
      const isoString = dateTime.toISOString();
      // Remove milliseconds and Z, ensure format is YYYY-MM-DDTHH:mm:ss
      return isoString.replace(/\.\d{3}Z$/, '');
    }

    if (typeof dateTime === 'string') {
      // Handle ISO string format
      if (dateTime.includes('T')) {
        // Remove milliseconds and Z if present
        let cleaned = dateTime.replace(/\.\d{3}Z?$/, '').replace('Z', '');
        // Ensure seconds are present
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(cleaned)) {
          cleaned += ':00';
        }
        return cleaned;
      }
      // Handle YYYY-MM-DD format (assume midnight)
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateTime)) {
        return `${dateTime}T00:00:00`;
      }
    }

    if (typeof dateTime === 'object') {
      // Handle objects with date and time properties
      if (dateTime.date && dateTime.time) {
        return formatDateTimeForAPI(dateTime.date, dateTime.time);
      }
      if (dateTime.slotDate && dateTime.startTime) {
        return formatDateTimeForAPI(dateTime.slotDate, dateTime.startTime);
      }
    }

    throw new Error('Unsupported datetime format');
  } catch (error) {
    console.error('Error formatting single datetime for API:', error);
    throw new Error(`Failed to format datetime: ${error.message}`);
  }
};

/**
 * Safely format a date value for display
 * @param {Date|string} dateValue - The date value to format
 * @returns {string} - Formatted date string or empty string if invalid
 */
export const safeFormatDate = (dateValue) => {
  try {
    if (!dateValue) return '';
    
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString();
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    return '';
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

/**
 * Safely format a time value for display
 * @param {string|Date} timeValue - The time value to format
 * @returns {string} - Formatted time string or empty string if invalid
 */
export const safeFormatTime = (timeValue) => {
  try {
    if (!timeValue) return '';
    
    if (typeof timeValue === 'string') {
      // Handle time strings like "14:30:00" or "14:30"
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
    
    if (timeValue instanceof Date) {
      return timeValue.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    
    return '';
  } catch (error) {
    console.warn('Error formatting time:', error);
    return '';
  }
};

/**
 * Validate appointment booking data
 * @param {Object} bookingData - The booking data to validate
 * @returns {Object} - Validation result with isValid and errors
 */
export const validateBookingData = (bookingData) => {
  const errors = [];

  if (!bookingData.doctorUserId) {
    errors.push('Doctor ID is required');
  }

  if (!bookingData.availabilitySlotId) {
    errors.push('Availability slot ID is required');
  }

  if (!bookingData.appointmentDateTime) {
    errors.push('Appointment date and time is required');
  } else {
    // Validate datetime format - MUST be exactly YYYY-MM-DDTHH:mm:ss
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (!datetimeRegex.test(bookingData.appointmentDateTime)) {
      errors.push(`Invalid appointment date/time format. Expected: YYYY-MM-DDTHH:mm:ss, got: ${bookingData.appointmentDateTime}`);
    }
  }

  if (!bookingData.durationMinutes || bookingData.durationMinutes < 1) {
    errors.push('Valid duration is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a booking data object with proper formatting
 * @param {Object} slotData - The slot data
 * @param {number} doctorUserId - The doctor's user ID
 * @returns {Object} - Properly formatted booking data
 */
export const createBookingData = (slotData, doctorUserId) => {
  try {
    if (!slotData || !doctorUserId) {
      throw new Error('Slot data and doctor ID are required');
    }

    // Extract date and time components
    const dateStr = slotData.slotDate || slotData.date || (slotData.appointmentDateTime || '').split('T')[0];
    const timeStr = slotData.startTime || slotData.time || (slotData.appointmentDateTime || '').split('T')[1];

    if (!dateStr || !timeStr) {
      throw new Error('Cannot extract date and time from slot data');
    }

    const appointmentDateTime = formatDateTimeForAPI(dateStr, timeStr);

    return {
      doctorUserId,
      availabilitySlotId: slotData.availabilitySlotId,
      appointmentDateTime,
      durationMinutes: slotData.durationMinutes || 30
    };
  } catch (error) {
    console.error('Error creating booking data:', error);
    throw error;
  }
};

/**
 * Extract date and time from slot data with multiple fallback options
 * @param {Object} slotData - The slot data object
 * @returns {Object|null} - Object with date and time properties or null if not found
 */
export const extractDateTimeFromSlot = (slotData) => {
  if (!slotData || typeof slotData !== 'object') {
    return null;
  }

  try {
    // Try direct properties first
    let date = slotData.slotDate || slotData.date;
    let time = slotData.startTime || slotData.time;

    // Try nested slot object
    if ((!date || !time) && slotData.slot) {
      date = date || slotData.slot.slotDate || slotData.slot.date;
      time = time || slotData.slot.startTime || slotData.slot.time;
    }

    // Try other common property names
    if (!date) {
      date = slotData.appointmentDate || slotData.selectedDate;
    }
    if (!time) {
      time = slotData.appointmentTime || slotData.selectedTime;
    }

    return (date && time) ? { date, time } : null;
  } catch (error) {
    console.warn('Error extracting date/time from slot:', error);
    return null;
  }
};

/**
 * Parse and validate date string
 * @param {string} dateStr - Date string to parse
 * @returns {Date} - Parsed date object
 */
export const parseDate = (dateStr) => {
  if (!dateStr) {
    throw new Error('Date string is required');
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date string');
  }

  return date;
};

/**
 * Check if a date is valid
 * @param {Date|string} date - Date to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const isValidDate = (date) => {
  try {
    if (date instanceof Date) {
      return !isNaN(date.getTime());
    }
    if (typeof date === 'string') {
      return !isNaN(new Date(date).getTime());
    }
    return false;
  } catch {
    return false;
  }
};

/**
 * Normalize time format to HH:mm:ss
 * @param {string} timeStr - Time string in various formats
 * @returns {string} - Normalized time string in HH:mm:ss format
 */
export const normalizeTimeFormat = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    return '00:00:00';
  }

  // Already in HH:mm:ss format
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }

  // HH:mm format
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr + ':00';
  }

  // H:mm format (single digit hour)
  if (/^\d{1}:\d{2}$/.test(timeStr)) {
    return '0' + timeStr + ':00';
  }

  // HHMM format
  if (/^\d{4}$/.test(timeStr)) {
    return timeStr.substring(0, 2) + ':' + timeStr.substring(2) + ':00';
  }

  // HH format (hour only)
  if (/^\d{2}$/.test(timeStr)) {
    return timeStr + ':00:00';
  }

  // H format (single digit hour)
  if (/^\d{1}$/.test(timeStr)) {
    return '0' + timeStr + ':00:00';
  }

  throw new Error(`Unable to normalize time format: ${timeStr}`);
};

/**
 * Format availability slot data for API requests
 * @param {Object} slotData - The slot data object
 * @returns {Object} - Formatted slot data for API
 */
export const formatSlotData = (slotData) => {
  try {
    if (!slotData.slotDate || !slotData.startTime) {
      throw new Error('Slot date and start time are required');
    }

    // Ensure proper date format (YYYY-MM-DD)
    let formattedDate = slotData.slotDate;
    if (slotData.slotDate instanceof Date) {
      formattedDate = slotData.slotDate.toISOString().split('T')[0];
    }

    // Ensure time format (HH:mm:ss)
    let startTime = slotData.startTime;
    if (!startTime.includes(':')) {
      startTime = `${startTime.substring(0, 2)}:${startTime.substring(2)}:00`;
    } else if (!startTime.endsWith(':00')) {
      startTime = `${startTime}:00`;
    }

    return {
      slotDate: formattedDate,
      startTime: startTime,
      durationMinutes: slotData.durationMinutes || 30,
      notes: slotData.notes || ''
    };
  } catch (error) {
    console.error('Error formatting slot data:', error);
    throw error;
  }
};

export const formatTimeForAPI = (time) => {
  if (!time) return null;
  // Ensure time is in HH:mm:ss format
  return time.includes(':') ? 
    (time.length === 5 ? `${time}:00` : time) : 
    `${time.substring(0, 2)}:${time.substring(2, 4)}:00`;
};

export const formatDateForAPI = (date) => {
  if (!date) return null;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  try {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

/**
 * Utility functions for date formatting
 */

/**
 * Format a date for last login display
 * @param {string|Date} dateTime - The date/time to format
 * @returns {string} - Formatted date string
 */
export const formatLastLogin = (dateTime) => {
  if (!dateTime) return 'Never';
  
  try {
    const date = new Date(dateTime);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // If it's within the last minute
    if (diffMinutes < 1) {
      return 'Just now';
    }
    
    // If it's within the last hour
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    
    // If it's within the last day
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }
    
    // If it's within the last week
    if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    }
    
    // For older dates, show the full date
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting last login date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date for general display
 * @param {string|Date} dateTime - The date/time to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  try {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a date and time for general display
 * @param {string|Date} dateTime - The date/time to format
 * @returns {string} - Formatted date and time string
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return 'N/A';
  
  try {
    const date = new Date(dateTime);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting date time:', error);
    return 'Invalid date';
  }
};
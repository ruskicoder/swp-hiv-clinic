/**
 * Utility functions for date formatting and validation
 */

/**
 * Format date and time for API requests
 * @param {string|Date} date - The date in various formats
 * @param {string} time - The time in HH:mm or HHmm format
 * @returns {string} - Formatted datetime string for API
 */
export const formatDateTimeForAPI = (date, time) => {
  try {
    // Handle date formatting
    let formattedDate;
    if (date instanceof Date) {
      formattedDate = date.toISOString().split('T')[0];
    } else if (typeof date === 'string') {
      formattedDate = date.includes('T') ? date.split('T')[0] : date;
    } else {
      throw new Error('Invalid date format');
    }

    // Handle time formatting
    let formattedTime = time;
    if (time && !time.includes(':')) {
      // Convert "0900" to "09:00"
      if (time.length === 4) {
        formattedTime = time.substring(0, 2) + ':' + time.substring(2);
      } else if (time.length === 3) {
        formattedTime = '0' + time.substring(0, 1) + ':' + time.substring(1);
      }
    }

    // Ensure seconds are included
    if (formattedTime && !formattedTime.includes(':00')) {
      formattedTime += ':00';
    }

    return `${formattedDate}T${formattedTime}`;
  } catch (error) {
    console.error('Error formatting date/time:', error);
    throw new Error('Invalid date or time format');
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
    // Validate datetime format
    const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
    if (!datetimeRegex.test(bookingData.appointmentDateTime)) {
      errors.push('Invalid appointment date/time format');
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

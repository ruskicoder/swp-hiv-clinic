import React, { useState, useEffect } from 'react';
import './TimeSlotModal.css';

/**
 * Modal for creating new time slots
 */
const TimeSlotModal = ({ 
  isOpen, 
  onClose, 
  onSlotCreated, 
  selectedDate, 
  existingSlots = [] 
}) => {
  const [formData, setFormData] = useState({
    slotDate: '',
    startTime: '09:00',
    durationMinutes: 30,
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen && selectedDate) {
      // Ensure we format the date correctly for the date input
      const formattedDate = formatDateForInput(selectedDate);
      console.log('Setting slot date:', { selectedDate, formattedDate });
      
      setFormData(prev => ({
        ...prev,
        slotDate: formattedDate
      }));
    }
  }, [isOpen, selectedDate]);

  // Format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    if (!date) return '';
    
    try {
      let dateObj;
      
      if (typeof date === 'string') {
        // If it's already in YYYY-MM-DD format, use it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return date;
        }
        // Parse ISO string
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        console.warn('Invalid date format:', date);
        return '';
      }

      // Ensure we get the local date without timezone conversion
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return '';
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationMinutes' ? parseInt(value, 10) : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Validate required fields
    if (!formData.slotDate) {
      newErrors.slotDate = 'Date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.durationMinutes || formData.durationMinutes < 15) {
      newErrors.durationMinutes = 'Duration must be at least 15 minutes';
    }

    if (formData.durationMinutes > 240) {
      newErrors.durationMinutes = 'Duration cannot exceed 4 hours';
    }

    // Validate business hours (8 AM to 6 PM)
    if (formData.startTime) {
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + formData.durationMinutes;
      
      if (startMinutes < 8 * 60) { // Before 8 AM
        newErrors.startTime = 'Start time cannot be before 8:00 AM';
      }
      
      if (endMinutes > 18 * 60) { // After 6 PM
        newErrors.startTime = 'End time cannot be after 6:00 PM';
      }
    }

    // Check for overlapping slots
    if (formData.slotDate && formData.startTime && Array.isArray(existingSlots)) {
      const newStartTime = formData.startTime;
      const newEndMinutes = formData.startTime.split(':').map(Number).reduce((h, m) => h * 60 + m) + formData.durationMinutes;
      const newEndTime = `${Math.floor(newEndMinutes / 60).toString().padStart(2, '0')}:${(newEndMinutes % 60).toString().padStart(2, '0')}`;

      const hasOverlap = existingSlots.some(slot => {
        // Only check slots on the same date
        const slotDateStr = formatDateForInput(slot.slotDate);
        if (slotDateStr !== formData.slotDate) return false;

        const existingStart = slot.startTime;
        const existingEnd = slot.endTime;

        // Check for time overlap
        return (newStartTime < existingEnd && newEndTime > existingStart);
      });

      if (hasOverlap) {
        newErrors.startTime = 'This time slot overlaps with an existing slot';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const slotData = {
        slotDate: formData.slotDate,
        startTime: formData.startTime.includes(':') ? 
          formData.startTime + ':00' : 
          formData.startTime.replace(/^(\d{2})(\d{2})$/, '$1:$2:00'),
        durationMinutes: parseInt(formData.durationMinutes),
        notes: formData.notes || ''
      };

      console.log('Submitting slot data:', slotData);
      
      const result = await onSlotCreated(slotData);
      
      if (result?.error || result?.success === false) {
        throw new Error(result.error || 'Failed to create slot');
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error creating slot:', error);
      setErrors({ 
        submit: error.message || 'Failed to create slot. Please try again.' 
      });
      setLoading(false); // Important: Reset loading state on error
    }
  };

  if (!isOpen) return null;

  return (
    <div className="time-slot-modal-overlay">
      <div className="time-slot-modal">
        <div className="modal-header">
          <h3>Add New Time Slot</h3>
          <button 
            type="button" 
            className="close-btn" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="slot-form">
          <div className="form-group">
            <label htmlFor="slotDate">Date:</label>
            <input
              type="date"
              id="slotDate"
              name="slotDate"
              value={formData.slotDate}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {errors.slotDate && <div className="error">{errors.slotDate}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Start Time:</label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              min="08:00"
              max="17:30"
              step="900" // 15 minute intervals
              required
              disabled={loading}
            />
            {errors.startTime && <div className="error">{errors.startTime}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="durationMinutes">Duration:</label>
            <select
              id="durationMinutes"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
              <option value={240}>4 hours</option>
            </select>
            {errors.durationMinutes && <div className="error">{errors.durationMinutes}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (optional):</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Add any notes for this time slot..."
              disabled={loading}
            />
          </div>

          {errors.submit && (
            <div className="error-message">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Slot'}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeSlotModal;
import React, { useState, useEffect } from 'react';
import './TimeSlotModal.css';

const TimeSlotModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate, 
  initialData = null,
  existingSlots = []
}) => {
  const [formData, setFormData] = useState({
    startTime: '',
    endTime: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Initialize form data when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        startTime: initialData.startTime || '',
        endTime: initialData.endTime || '',
        notes: initialData.notes || ''
      });
    } else {
      setFormData({
        startTime: '',
        endTime: '',
        notes: ''
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (!selectedDate) {
      newErrors.date = 'Date is required';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      
      if (start >= end) {
        newErrors.endTime = 'End time must be after start time';
      }

      // Check for overlapping slots
      const hasOverlap = existingSlots.some(slot => {
        if (initialData && slot.availabilitySlotId === initialData.availabilitySlotId) {
          return false;
        }

        const slotStart = new Date(`2000-01-01T${slot.startTime}`);
        const slotEnd = new Date(`2000-01-01T${slot.endTime}`);
        
        return (start < slotEnd && slotStart < end);
      });

      if (hasOverlap) {
        newErrors.startTime = 'This time slot overlaps with an existing slot';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if two time ranges overlap
  const isTimeOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const slotData = {
        ...formData,
        slotDate: selectedDate ? selectedDate.toISOString().split('T')[0] : null // Ensure proper date format
      };

      if (initialData?.availabilitySlotId) {
        slotData.availabilitySlotId = initialData.availabilitySlotId;
      }

      await onSave(slotData);
      onClose();
    } catch (error) {
      console.error('Error saving slot:', error);
      setErrors(prev => ({
        ...prev,
        submit: error?.response?.data?.message || error.message || 'Failed to save slot. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Generate time options (30-minute intervals)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTimeForDisplay(timeString);
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  // Format time for display (12-hour format)
  const formatTimeForDisplay = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const timeOptions = generateTimeOptions();

  // Helper function to calculate duration
  const calculateDuration = (startTime, endTime) => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
    }
  };

  return (
    <div className="time-modal-overlay" onClick={onClose}>
      <div className="time-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h4>
            {initialData ? 'Edit Time Slot' : 'Add New Time Slot'}
            <br />
            <small>{selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</small>
          </h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {errors.submit && (
              <div className="error-message">
                {errors.submit}
              </div>
            )}

            {/* Date Display */}
            <div className="form-group">
              <label>Date</label>
              <input
                type="text"
                value={selectedDate?.toLocaleDateString() || ''}
                readOnly
                className="readonly-input"
              />
            </div>

            {/* Time Selection */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time *</label>
                <select
                  id="startTime"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={errors.startTime ? 'error' : ''}
                  required
                >
                  <option value="">Select start time</option>
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.startTime && (
                  <span className="field-error">{errors.startTime}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time *</label>
                <select
                  id="endTime"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={errors.endTime ? 'error' : ''}
                  required
                >
                  <option value="">Select end time</option>
                  {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.endTime && (
                  <span className="field-error">{errors.endTime}</span>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any notes about this time slot..."
                rows="3"
              />
            </div>

            {/* Duration Display */}
            {formData.startTime && formData.endTime && formData.startTime < formData.endTime && (
              <div className="duration-display">
                <small>
                  Duration: {calculateDuration(formData.startTime, formData.endTime)}
                </small>
              </div>
            )}
          </form>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button 
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading || !formData.startTime || !formData.endTime}
          >
            {loading ? 'Saving...' : (initialData ? 'Update Slot' : 'Add Slot')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSlotModal;
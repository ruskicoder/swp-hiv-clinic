import React, { useState, useEffect } from 'react';
import './TimeSlotModal.css';

const TimeSlotModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedDate, 
  existingSlots = [],
  initialData = null 
}) => {
  const [formData, setFormData] = useState({
    startTime: '',
    durationMinutes: 30,
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Duration options in minutes
  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Calculate duration from existing slot
        const start = new Date(`2000-01-01T${initialData.startTime}`);
        const end = new Date(`2000-01-01T${initialData.endTime}`);
        const durationMinutes = (end - start) / (1000 * 60);
        
        setFormData({
          startTime: initialData.startTime || '',
          durationMinutes: durationMinutes || 30,
          notes: initialData.notes || ''
        });
      } else {
        setFormData({
          startTime: '',
          durationMinutes: 30,
          notes: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    
    return endDate.toTimeString().slice(0, 5);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    // Validate business hours (8 AM to 6 PM)
    if (formData.startTime) {
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0);

      const endDate = new Date(startDate.getTime() + formData.durationMinutes * 60000);
      const endHour = endDate.getHours();
      const endMinutes = endDate.getMinutes();

      if (hours < 8 || hours >= 18 || (hours === 17 && minutes > 30)) {
        newErrors.startTime = 'Slots must start between 8:00 AM and 5:30 PM';
      }

      if (endHour > 18 || (endHour === 18 && endMinutes > 0)) {
        newErrors.durationMinutes = 'Slot cannot extend beyond 6:00 PM';
      }
    }

    // Check for overlapping slots
    if (formData.startTime && formData.durationMinutes) {
      const [hours, minutes] = formData.startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0);
      const endDate = new Date(startDate.getTime() + formData.durationMinutes * 60000);

      const hasOverlap = existingSlots.some(slot => {
        if (initialData && slot.availabilitySlotId === initialData.availabilitySlotId) {
          return false;
        }

        const slotStart = new Date();
        const [slotHours, slotMinutes] = slot.startTime.split(':').map(Number);
        slotStart.setHours(slotHours, slotMinutes, 0);

        const slotEnd = new Date(slotStart.getTime() + slot.durationMinutes * 60000);

        return startDate < slotEnd && slotStart < endDate;
      });

      if (hasOverlap) {
        newErrors.startTime = 'This time slot overlaps with an existing slot';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'durationMinutes' ? parseInt(value) : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm() || loading) {
      return;
    }

    setLoading(true);
    
    try {
      // Format the data properly
      const formattedData = {
        slotDate: selectedDate instanceof Date 
          ? selectedDate.toISOString().split('T')[0] 
          : selectedDate,
        startTime: formData.startTime + ':00', // Ensure seconds are included
        durationMinutes: parseInt(formData.durationMinutes),
        notes: formData.notes || ''
      };

      const result = await onSave(formattedData);
      if (!result.success) {
        throw new Error(result.error || 'Failed to save time slot');
      }
      onClose();
      
    } catch (error) {
      console.error('Error saving time slot:', error);
      setErrors(prev => ({ 
        ...prev,
        submit: error?.message || 'Failed to save time slot' 
      }));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const endTime = calculateEndTime(formData.startTime, formData.durationMinutes);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Edit Time Slot' : 'Add Time Slot'}</h3>
          <button 
            type="button" 
            className="modal-close" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="time-slot-form">
          <div className="form-group">
            <label htmlFor="selectedDate">Date:</label>
            <input
              type="text"
              id="selectedDate"
              value={selectedDate instanceof Date 
                ? selectedDate.toLocaleDateString() 
                : selectedDate || ''}
              disabled
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="startTime">Start Time: *</label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={`form-control ${errors.startTime ? 'error' : ''}`}
              min="08:00"
              max="17:30"
              step="300" // 5-minute intervals
              required
              disabled={loading}
            />
            {errors.startTime && (
              <span className="error-message">{errors.startTime}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="durationMinutes">Duration: *</label>
            <select
              id="durationMinutes"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              className={`form-control ${errors.durationMinutes ? 'error' : ''}`}
              required
              disabled={loading}
            >
              <option value="">Select duration</option>
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.durationMinutes && (
              <span className="error-message">{errors.durationMinutes}</span>
            )}
          </div>

          {formData.startTime && formData.durationMinutes && (
            <div className="form-group">
              <label>Calculated End Time:</label>
              <input
                type="text"
                value={endTime ? `${endTime}` : ''}
                disabled
                className="form-control calculated-time"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notes:</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-control"
              rows="3"
              placeholder="Optional notes about this time slot..."
              disabled={loading}
            />
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (initialData ? 'Update Slot' : 'Add Slot')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeSlotModal;
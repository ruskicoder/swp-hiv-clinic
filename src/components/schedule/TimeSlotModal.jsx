import React, { useState, useEffect } from 'react';
import './TimeSlotModal.css';

const TimeSlotModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  selectedDate, 
  initialData = null 
}) => {
  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '10:00',
    duration: 30,
    notes: ''
  });

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        startTime: '09:00',
        endTime: '10:00',
        duration: 30,
        notes: ''
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate end time when start time or duration changes
      if (field === 'startTime' || field === 'duration') {
        const startTime = field === 'startTime' ? value : prev.startTime;
        const duration = field === 'duration' ? parseInt(value) : prev.duration;
        
        if (startTime && duration) {
          const [hours, minutes] = startTime.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + duration;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          
          updated.endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Format date consistently as YYYY-MM-DD in local timezone
    let formattedDate = '';
    if (selectedDate instanceof Date) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
    } else if (typeof selectedDate === 'string') {
      formattedDate = selectedDate;
    }

    const slotData = {
      slotDate: formattedDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      duration: formData.duration,
      notes: formData.notes
    };

    onSubmit(slotData);
    onClose();
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="time-modal-overlay" onClick={onClose}>
      <div className="time-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Add Time Slot</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-content">
          <div className="form-group">
            <label>Selected Date:</label>
            <input 
              type="text" 
              value={formatSelectedDate()} 
              readOnly 
              className="readonly-input"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Start Time:</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Duration:</label>
              <select
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                required
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>End Time:</label>
            <input
              type="time"
              value={formData.endTime}
              readOnly
              className="readonly-input"
            />
          </div>
          
          <div className="form-group">
            <label>Notes (Optional):</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows="3"
              placeholder="Add any notes for this time slot..."
            />
          </div>
          
          <div className="modal-actions">
            <button type="submit" className="btn-primary">
              Add Time Slot
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeSlotModal;
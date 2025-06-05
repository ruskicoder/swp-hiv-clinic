import React, { useState } from 'react';
import TimeSlotModal from './TimeSlotModal';
import './SlotManagementModal.css';

const SlotManagementModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  existingSlots = [], 
  onAddSlot, 
  onDeleteSlot 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  if (!isOpen || !selectedDate) return null;

  const availableSlots = existingSlots.filter(slot => !slot.isBooked);
  const bookedSlots = existingSlots.filter(slot => slot.isBooked);

  const handleDeleteSlot = async (slotId, isBooked) => {
    if (isBooked) {
      const confirmed = window.confirm(
        'This slot is currently booked by a patient. Deleting it will cancel the appointment. Are you sure you want to proceed?'
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm('Are you sure you want to delete this availability slot?');
      if (!confirmed) return;
    }

    try {
      await onDeleteSlot(slotId);
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete slot. Please try again.');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className="slot-modal-overlay" onClick={onClose}>
      <div className="slot-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h4>Manage Slots for {selectedDate.toLocaleDateString()}</h4>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          <div className="slot-sections">
            {availableSlots.length > 0 && (
              <div className="slot-section">
                <h5 className="section-title available">Available Slots ({availableSlots.length})</h5>
                <div className="slots-list">
                  {availableSlots.map(slot => (
                    <div key={slot.availabilitySlotId} className="slot-item available">
                      <div className="slot-info">
                        <span className="slot-time">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                        {slot.notes && (
                          <span className="slot-notes">{slot.notes}</span>
                        )}
                      </div>
                      <button 
                        className="btn-danger-small"
                        onClick={() => handleDeleteSlot(slot.availabilitySlotId, false)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bookedSlots.length > 0 && (
              <div className="slot-section">
                <h5 className="section-title booked">Booked Slots ({bookedSlots.length})</h5>
                <div className="slots-list">
                  {bookedSlots.map(slot => (
                    <div key={slot.availabilitySlotId} className="slot-item booked">
                      <div className="slot-info">
                        <span className="slot-time">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                        <span className="booked-indicator">● Booked by Patient</span>
                        {slot.notes && (
                          <span className="slot-notes">{slot.notes}</span>
                        )}
                      </div>
                      <button 
                        className="btn-warning-small"
                        onClick={() => handleDeleteSlot(slot.availabilitySlotId, true)}
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingSlots.length === 0 && (
              <div className="no-slots">
                <p>No slots available for this date.</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              Add New Slot
            </button>
            <button 
              className="btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <TimeSlotModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={(slotData) => {
            onAddSlot(slotData);
            setShowAddModal(false);
          }}
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
};

export default SlotManagementModal;
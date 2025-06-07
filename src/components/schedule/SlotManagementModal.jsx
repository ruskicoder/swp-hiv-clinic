import React, { useState } from 'react';
import TimeSlotModal from './TimeSlotModal';
import './SlotManagementModal.css';

const SlotManagementModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  existingSlots = [], 
  userRole = 'doctor',
  currentUserId,
  doctorInfo = null,
  onAddSlot, 
  onDeleteSlot,
  onBookSlot,
  onCancelBooking
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmBooking, setShowConfirmBooking] = useState(false);
  const [showCancelBooking, setShowCancelBooking] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !selectedDate) return null;

  const availableSlots = existingSlots.filter(slot => !slot.isBooked);
  const bookedSlots = existingSlots.filter(slot => slot.isBooked);

  // Check if patient owns a booking
  const isPatientOwnBooking = (slot) => {
    return userRole === 'patient' && 
           slot.appointment && 
           slot.appointment.patientUser && 
           slot.appointment.patientUser.userId === currentUserId;
  };

  // Handle slot actions based on user role
  const handleSlotAction = (slot) => {
    if (userRole === 'doctor') {
      if (slot.isBooked) {
        // Doctor viewing booked slot details
        alert(`This slot is booked by: ${slot.appointment?.patientUser?.username || 'Unknown Patient'}`);
      } else {
        // Doctor can delete available slots
        handleDeleteSlot(slot.availabilitySlotId);
      }
    } else if (userRole === 'patient') {
      if (slot.isBooked) {
        if (isPatientOwnBooking(slot)) {
          // Patient can cancel their own booking
          setSelectedSlot(slot);
          setShowCancelBooking(true);
        } else {
          // Slot booked by another patient
          alert('This slot is already booked by another patient.');
        }
      } else {
        // Patient can book available slots
        setSelectedSlot(slot);
        setShowConfirmBooking(true);
      }
    }
  };

  // Handle slot deletion (doctors only)
  const handleDeleteSlot = async (slotId) => {
    const slot = existingSlots.find(s => s.availabilitySlotId === slotId);
    const confirmMessage = slot?.isBooked 
      ? 'This slot is currently booked. Deleting it will cancel the appointment. Are you sure?'
      : 'Are you sure you want to delete this availability slot?';
    
    if (window.confirm(confirmMessage)) {
      try {
        await onDeleteSlot(slotId);
        onClose(); // Close modal after successful deletion
      } catch (error) {
        console.error('Error deleting slot:', error);
        alert('Failed to delete slot. Please try again.');
      }
    }
  };

  // Handle booking confirmation (patients only)
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !onBookSlot) return;

    setLoading(true);
    try {
      await onBookSlot(selectedSlot);
      setShowConfirmBooking(false);
      setSelectedSlot(null);
      onClose(); // Close modal after successful booking
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation (patients only)
  const handleCancelBooking = async () => {
    if (!selectedSlot || !onCancelBooking) return;

    const reason = prompt('Please provide a reason for cancellation (optional):') || 'No reason provided';
    
    setLoading(true);
    try {
      await onCancelBooking(selectedSlot.appointment.appointmentId, reason);
      setShowCancelBooking(false);
      setSelectedSlot(null);
      onClose(); // Close modal after successful cancellation
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new slot
  const handleAddSlot = async (slotData) => {
    try {
      await onAddSlot(slotData);
      setShowAddModal(false);
      // Don't close main modal, just refresh the view
    } catch (error) {
      console.error('Failed to add slot:', error);
      throw error; // Re-throw to be handled by TimeSlotModal
    }
  };

  // Format time for display
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
    <div className="slot-modal-overlay">
      <div className="slot-modal">
        <div className="modal-header">
          <h3>
            {userRole === 'doctor' ? 'Manage Availability' : 'Book Appointment'} - {selectedDate.toLocaleDateString()}
          </h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {showConfirmBooking ? (
            /* Booking Confirmation */
            <div className="booking-confirmation">
              <h4>Confirm Appointment Booking</h4>
              <div className="booking-details">
                <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}</p>
                {doctorInfo && (
                  <p><strong>Doctor:</strong> Dr. {doctorInfo.firstName} {doctorInfo.lastName}</p>
                )}
              </div>
              <div className="booking-actions">
                <button 
                  className="btn btn-primary"
                  onClick={handleConfirmBooking}
                  disabled={loading}
                >
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmBooking(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : showCancelBooking ? (
            /* Cancellation Confirmation */
            <div className="cancellation-confirmation">
              <h4>Cancel Appointment</h4>
              <div className="booking-details">
                <p><strong>Date:</strong> {selectedDate.toLocaleDateString()}</p>
                <p><strong>Time:</strong> {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}</p>
              </div>
              <p>Are you sure you want to cancel this appointment?</p>
              <div className="booking-actions">
                <button 
                  className="btn btn-danger"
                  onClick={handleCancelBooking}
                  disabled={loading}
                >
                  {loading ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowCancelBooking(false)}
                  disabled={loading}
                >
                  No, Keep Appointment
                </button>
              </div>
            </div>
          ) : (
            /* Slot List */
            <div className="slot-sections">
              {/* Available Slots */}
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
                          {doctorInfo && userRole === 'patient' && (
                            <span className="slot-doctor">
                              Dr. {doctorInfo.firstName} {doctorInfo.lastName}
                            </span>
                          )}
                        </div>
                        <div className="slot-actions">
                          {userRole === 'doctor' ? (
                            <button 
                              className="btn-danger-small"
                              onClick={() => handleSlotAction(slot)}
                            >
                              Delete
                            </button>
                          ) : (
                            <button 
                              className="btn-primary-small"
                              onClick={() => handleSlotAction(slot)}
                            >
                              Book
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booked Slots */}
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
                          {userRole === 'doctor' && slot.appointment && (
                            <span className="booked-indicator">
                              Patient: {slot.appointment.patientUser?.username || 'Unknown'}
                            </span>
                          )}
                          {userRole === 'patient' && isPatientOwnBooking(slot) && (
                            <span className="own-booking">Your booking</span>
                          )}
                          {slot.notes && (
                            <span className="slot-notes">{slot.notes}</span>
                          )}
                        </div>
                        <div className="slot-actions">
                          {userRole === 'doctor' ? (
                            <button 
                              className="btn-info-small"
                              onClick={() => handleSlotAction(slot)}
                            >
                              View Details
                            </button>
                          ) : isPatientOwnBooking(slot) ? (
                            <button 
                              className="btn-warning-small"
                              onClick={() => handleSlotAction(slot)}
                            >
                              Cancel
                            </button>
                          ) : (
                            <button className="btn-secondary-small" disabled>
                              Booked
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Slots Message */}
              {existingSlots.length === 0 && (
                <div className="no-slots">
                  <p>
                    {userRole === 'doctor' 
                      ? 'No slots available for this date. Click "Add New Slot" to create availability.'
                      : 'No slots available for this date. Please select another date.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {!showConfirmBooking && !showCancelBooking && (
          <div className="modal-actions">
            {userRole === 'doctor' && (
              <button 
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                Add New Slot
              </button>
            )}
            <button 
              className="btn-secondary" 
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Time Slot Modal for adding new slots */}
      {showAddModal && (
        <TimeSlotModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddSlot}
          selectedDate={selectedDate}
          existingSlots={existingSlots}
        />
      )}
    </div>
  );
};

export default SlotManagementModal;
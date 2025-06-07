import React, { useState, useEffect } from 'react';
import TimeSlotModal from './TimeSlotModal';
import './SlotActionModal.css';

const SlotActionModal = ({
  isOpen, 
  onClose, 
  selectedDate, 
  existingSlots = [], 
  onAddSlot, 
  onDeleteSlot,
  onBookSlot,
  userRole = 'doctor', // 'doctor' or 'patient'
  currentUserId, // Added prop for current user ID (patient)
  doctorInfo = null
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmBooking, setShowConfirmBooking] = useState(false);
  const [showCancelBooking, setShowCancelBooking] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddModal(false);
      setSelectedSlot(null);
      setShowConfirmBooking(false);
      setShowCancelBooking(false);
    }
  }, [isOpen]);

  if (!isOpen || !selectedDate) return null;

  // Filter slots by booking status
  const availableSlots = existingSlots.filter(slot => !slot.isBooked);
  const bookedSlots = existingSlots.filter(slot => slot.isBooked);

  // Check if patient owns a booking
  const isPatientOwnBooking = (slot) => {
    return userRole === 'patient' && slot.appointment && 
           slot.appointment.patientUser && 
           slot.appointment.patientUser.userId === currentUserId;
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Handle slot selection based on user role and slot status
  const handleSlotAction = (slot) => {
    if (userRole === 'doctor') {
      if (slot.isBooked) {
        // Doctor can view booked slot details but cannot delete
        alert(`This slot is booked. Patient: ${slot.appointment?.patientUser?.username || 'Unknown'}`);
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
          // Slot is booked by another patient
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
  const handleDeleteSlot = (slotId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this availability slot?');
    if (confirmDelete && onDeleteSlot) {
      onDeleteSlot(slotId);
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
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation (patients only)
  const handleCancelBooking = async () => {
    if (!selectedSlot || !selectedSlot.appointment) return;

    const reason = prompt('Please provide a reason for cancellation (optional):');
    if (reason === null) return; // User cancelled the prompt

    setLoading(true);
    try {
      // Call the appointment cancellation API
      const response = await fetch(`/api/appointments/${selectedSlot.appointment.appointmentId}/cancel?reason=${encodeURIComponent(reason)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('Appointment cancelled successfully.');
        setShowCancelBooking(false);
        setSelectedSlot(null);
        // Refresh the slots
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`Failed to cancel appointment: ${errorData.message}`);
      }
    } catch (error) {
      console.error('Cancellation failed:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new slot
  const handleAddNewSlot = () => {
    setShowAddModal(true);
  };

  // Handle slot creation from TimeSlotModal
  const handleSlotCreated = (slotData) => {
    if (onAddSlot) {
      onAddSlot({
        ...slotData,
        slotDate: selectedDate
      });
    }
    setShowAddModal(false);
  };

  // Render slot list
  const renderSlotList = (slots, title, emptyMessage) => (
    <div className="slot-section">
      <h4 className="slot-section-title">{title}</h4>
      {slots.length === 0 ? (
        <p className="empty-message">{emptyMessage}</p>
      ) : (
        <div className="slot-list">
          {slots.map((slot, index) => (
            <div key={index} className={`slot-item ${slot.isBooked ? 'booked' : 'available'}`}>
              <div className="slot-time">
                {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
              </div>
              {slot.isBooked && slot.appointment && (
                <div className="slot-details">
                  <small>
                    Patient: {slot.appointment.patientUser?.username || 'Unknown'}
                    {isPatientOwnBooking(slot) && <span className="own-booking"> (Your booking)</span>}
                  </small>
                </div>
              )}
              {doctorInfo && userRole === 'patient' && !slot.isBooked && (
                <div className="slot-doctor">
                  <small>Dr. {doctorInfo.firstName} {doctorInfo.lastName}</small>
                </div>
              )}
              <div className="slot-actions">
                {userRole === 'doctor' && (
                  <>
                    {slot.isBooked ? (
                      <button 
                        className="btn btn-info btn-sm"
                        onClick={() => handleSlotAction(slot)}
                      >
                        View Details
                      </button>
                    ) : (
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleSlotAction(slot)}
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
                {userRole === 'patient' && (
                  <>
                    {slot.isBooked ? (
                      isPatientOwnBooking(slot) ? (
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => handleSlotAction(slot)}
                        >
                          Cancel
                        </button>
                      ) : (
                        <button className="btn btn-secondary btn-sm" disabled>
                          Booked
                        </button>
                      )
                    ) : (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSlotAction(slot)}
                      >
                        Book
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="slot-action-modal-overlay" onClick={onClose}>
        <div className="slot-action-modal" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="modal-header">
            <h3>
              {userRole === 'doctor' ? 'Manage Availability' : 'Book Appointment'}
              <br />
              <small>{selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</small>
            </h3>
            <button className="close-button" onClick={onClose}>×</button>
          </div>

          {/* Modal Content */}
          <div className="modal-content">
            {!showConfirmBooking && !showCancelBooking ? (
              <>
                {/* Available Slots */}
                {renderSlotList(
                  availableSlots, 
                  'Available Slots', 
                  userRole === 'doctor' 
                    ? 'No available slots. Click "Add New Slot" to create one.' 
                    : 'No available slots for this date.'
                )}

                {/* Booked Slots */}
                {bookedSlots.length > 0 && renderSlotList(
                  bookedSlots, 
                  'Booked Slots', 
                  'No booked slots.'
                )}
              </>
            ) : showConfirmBooking ? (
              /* Booking Confirmation */
              <div className="booking-confirmation">
                <h4>Confirm Appointment Booking</h4>
                <div className="booking-details">
                  <p><strong>Date:</strong> {selectedDate?.toLocaleDateString()}</p>
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
            ) : (
              /* Cancellation Confirmation */
              <div className="cancellation-confirmation">
                <h4>Cancel Appointment</h4>
                <div className="booking-details">
                  <p><strong>Date:</strong> {selectedDate?.toLocaleDateString()}</p>
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
            )}
          </div>

          {/* Modal Footer */}
          {!showConfirmBooking && !showCancelBooking && (
            <div className="modal-footer">
              {userRole === 'doctor' && (
                <button 
                  className="btn btn-primary"
                  onClick={handleAddNewSlot}
                >
                  Add New Slot
                </button>
              )}
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Time Slot Modal for adding new slots */}
      {showAddModal && (
        <TimeSlotModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSlotCreated}
          selectedDate={selectedDate}
        />
      )}
    </>
  );
};

export default SlotActionModal;
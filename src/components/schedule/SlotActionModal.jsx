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
      // Validate required fields
      if (!selectedSlot.availabilitySlotId) {
        throw new Error('Availability slot ID is missing');
      }
      
      if (!selectedSlot.doctorUser?.userId && !doctorInfo?.userId) {
        throw new Error('Doctor information is missing');
      }

      // Improved date formatting
      let slotDate;
      if (selectedSlot.slotDate instanceof Date) {
        slotDate = selectedSlot.slotDate.toISOString().split('T')[0];
      } else if (typeof selectedSlot.slotDate === 'string') {
        // Handle different string formats
        slotDate = selectedSlot.slotDate.includes('T') 
          ? selectedSlot.slotDate.split('T')[0] 
          : selectedSlot.slotDate;
      } else {
        throw new Error('Invalid slot date format');
      }

      // Ensure time format is correct (HH:mm)
      let startTime = selectedSlot.startTime;
      if (startTime && !startTime.includes(':')) {
        // If time is in format like "0900", convert to "09:00"
        startTime = startTime.substring(0, 2) + ':' + startTime.substring(2);
      }

      const formattedData = {
        doctorUserId: selectedSlot.doctorUser?.userId || doctorInfo?.userId,
        availabilitySlotId: selectedSlot.availabilitySlotId,
        appointmentDateTime: `${slotDate}T${startTime}:00`,
        durationMinutes: selectedSlot.durationMinutes || 30
      };

      console.log('Sending booking data:', formattedData);
      
      const response = await onBookSlot(formattedData);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        if (response.success === false || (response.data && response.data.success === false)) {
          const errorMessage = response.message || response.data?.message || 'Failed to book appointment';
          throw new Error(errorMessage);
        }
      }

      alert('Appointment booked successfully!');
      setShowConfirmBooking(false);
      setSelectedSlot(null);
      onClose();
      
    } catch (error) {
      console.error('Booking failed:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to book appointment. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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

  // Add this helper function before handleSlotCreated
  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime || !durationMinutes) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    date.setMinutes(date.getMinutes() + parseInt(durationMinutes));
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
  };

  // Update handleSlotCreated to use calculated endTime
  const handleSlotCreated = async (slotData) => {
    if (!onAddSlot) return;
    
    try {
      const formattedData = {
        slotDate: selectedDate instanceof Date 
          ? selectedDate.toISOString().split('T')[0] 
          : selectedDate,
        startTime: slotData.startTime + ':00',
        durationMinutes: parseInt(slotData.durationMinutes),
        notes: slotData.notes || ''
      };

      const response = await onAddSlot(formattedData);
      
      if (response?.error) {
        throw new Error(response.error);
      }

      setShowAddModal(false);
      onClose();
      return { success: true };
        
    } catch (error) {
      console.error('Error creating time slot:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create time slot'
      };
    }
  };

  // Helper function to calculate end time
  const addMinutesToTime = (startTime, minutes) => {
    const [hours, mins] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins);
    date.setMinutes(date.getMinutes() + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const processedSlots = React.useMemo(() => {
    if (!Array.isArray(existingSlots)) {
      console.error('existingSlots is not an array:', existingSlots);
      return [];
    }

    return existingSlots
      .filter(slot => slot && typeof slot === 'object')
      .map(slot => ({
        availabilitySlotId: slot.availabilitySlotId,
        slotDate: slot.slotDate,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: Boolean(slot.isBooked),
        notes: slot.notes || '',
        appointment: slot.appointment,
        doctorUser: slot.doctorUser
      }));
  }, [existingSlots]);

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
              <div>
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
              </div>
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
          {/* Time Slot Modal for adding new slots */}
          {showAddModal && (
            <TimeSlotModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSave={handleSlotCreated}
              selectedDate={selectedDate}
              existingSlots={existingSlots}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default SlotActionModal;
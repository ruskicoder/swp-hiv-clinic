import React, { useState, useMemo } from 'react';
import TimeSlotModal from './TimeSlotModal';
import './SlotManagementModal.css';

/**
 * Modal for managing time slots - allows doctors to manage availability and patients to book slots
 */
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

  // Process slots safely
  const processedSlots = useMemo(() => {
    if (!Array.isArray(existingSlots)) {
      console.warn('existingSlots is not an array:', existingSlots);
      return [];
    }

    return existingSlots.filter(slot => {
      if (!slot) {
        console.warn('Invalid slot found:', slot);
        return false;
      }

      // Ensure required properties exist
      if (!slot.availabilitySlotId && !slot.slotId) {
        console.warn('Slot missing ID:', slot);
        return false;
      }

      return true;
    }).map(slot => ({
      availabilitySlotId: slot.availabilitySlotId || slot.slotId,
      startTime: slot.startTime || '00:00',
      endTime: slot.endTime || '00:30',
      isBooked: Boolean(slot.isBooked),
      notes: slot.notes || '',
      appointment: slot.appointment || null,
      slotDate: slot.slotDate,
      doctorUser: slot.doctorUser || doctorInfo
    }));
  }, [existingSlots, doctorInfo]);

  // Separate available and booked slots
  const availableSlots = processedSlots.filter(slot => !slot.isBooked);
  const bookedSlots = processedSlots.filter(slot => slot.isBooked);

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    try {
      // Handle different time formats
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const min = parseInt(minutes, 10);
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
      }
      return timeString;
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString;
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return date.toString();
    }
  };

  // Check if patient owns the booking
  const isPatientOwnBooking = (slot) => {
    if (userRole !== 'patient' || !slot.appointment) return false;
    
    try {
      const patientUser = slot.appointment.patientUser;
      if (!patientUser) return false;
      
      const patientId = patientUser.userId || patientUser.id || patientUser.userID;
      return patientId === currentUserId;
    } catch (error) {
      console.warn('Error checking patient booking ownership:', error);
      return false;
    }
  };

  // Handle slot actions based on user role
  const handleSlotAction = (slot) => {
    try {
      console.log('Slot action triggered:', { slot, userRole, currentUserId });
      
      if (userRole === 'doctor') {
        if (slot.isBooked) {
          // Doctor viewing booked slot details
          const patientName = slot.appointment?.patientUser?.username || 'Unknown Patient';
          alert(`This slot is booked by: ${patientName}`);
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
    } catch (error) {
      console.error('Error handling slot action:', error);
      alert('An error occurred. Please try again.');
    }
  };

  // Handle slot deletion (doctors only)
  const handleDeleteSlot = (slotId) => {
    if (userRole !== 'doctor') {
      alert('Only doctors can delete slots.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this availability slot?');
    if (confirmDelete && onDeleteSlot) {
      console.log('Deleting slot:', slotId);
      onDeleteSlot(slotId);
    }
  };

  // Handle booking confirmation (patients only)
  const handleConfirmBooking = async () => {
    if (!selectedSlot || userRole !== 'patient') return;

    try {
      setLoading(true);
      
      // Validate required fields
      if (!selectedSlot.availabilitySlotId) {
        throw new Error('Availability slot ID is missing');
      }
      
      if (!selectedSlot.doctorUser?.userId && !doctorInfo?.userId) {
        throw new Error('Doctor information is missing');
      }

      // Improved date formatting
      let formattedDate;
      if (selectedDate) {
        // selectedDate should be in YYYY-MM-DD format
        formattedDate = selectedDate;
      } else if (selectedSlot.slotDate) {
        if (selectedSlot.slotDate instanceof Date) {
          formattedDate = selectedSlot.slotDate.toISOString().split('T')[0];
        } else {
          formattedDate = selectedSlot.slotDate.includes('T') 
            ? selectedSlot.slotDate.split('T')[0] 
            : selectedSlot.slotDate;
        }
      } else {
        throw new Error('No date information available');
      }

      // Ensure time format is correct
      let startTime = selectedSlot.startTime;
      if (startTime && !startTime.includes(':')) {
        startTime = startTime.substring(0, 2) + ':' + startTime.substring(2);
      }

      const bookingData = {
        availabilitySlotId: selectedSlot.availabilitySlotId,
        doctorUserId: selectedSlot.doctorUser?.userId || doctorInfo?.userId,
        appointmentDateTime: `${formattedDate}T${startTime}:00`,
        durationMinutes: selectedSlot.durationMinutes || 30
      };

      console.log('Booking appointment with data:', bookingData);
      
      if (onBookSlot) {
        const response = await onBookSlot(bookingData);
        
        // Handle response
        if (response && response.success === false) {
          throw new Error(response.message || 'Failed to book appointment');
        }
      }
      
      setShowConfirmBooking(false);
      setSelectedSlot(null);
      alert('Appointment booked successfully!');
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      
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
    if (!selectedSlot || userRole !== 'patient') return;

    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      setLoading(true);
      
      if (onCancelBooking && selectedSlot.appointment) {
        await onCancelBooking(selectedSlot.appointment.appointmentId, reason);
      }
      
      setShowCancelBooking(false);
      setSelectedSlot(null);
      alert('Appointment cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new slot
  const handleAddNewSlot = () => {
    if (userRole !== 'doctor') {
      alert('Only doctors can add availability slots.');
      return;
    }
    setShowAddModal(true);
  };

  // Handle slot creation
  const handleSlotCreated = (slotData) => {
    if (onAddSlot) {
      onAddSlot(slotData);
    }
    setShowAddModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="slot-modal-overlay">
      <div className="slot-modal">
        <div className="modal-header">
          <h3>Manage Slots - {formatDate(selectedDate)}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {userRole === 'doctor' && (
            <div className="modal-actions">
              <button 
                className="btn-primary"
                onClick={handleAddNewSlot}
              >
                Add New Slot
              </button>
            </div>
          )}

          <div className="slot-sections">
            {/* Available Slots Section */}
            <div className="slot-section">
              <h4>Available Slots ({availableSlots.length})</h4>
              {availableSlots.length === 0 ? (
                <div className="no-slots">
                  <p>No available slots for this date.</p>
                </div>
              ) : (
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
              )}
            </div>

            {/* Booked Slots Section */}
            {bookedSlots.length > 0 && (
              <div className="slot-section">
                <h4>Booked Slots ({bookedSlots.length})</h4>
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
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {showConfirmBooking && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h4>Confirm Booking</h4>
              <p>
                Book appointment on {formatDate(selectedDate)} at{' '}
                {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}?
              </p>
              {doctorInfo && (
                <p>Doctor: Dr. {doctorInfo.firstName} {doctorInfo.lastName}</p>
              )}
              <div className="confirmation-actions">
                <button 
                  className="btn-primary"
                  onClick={handleConfirmBooking}
                  disabled={loading}
                >
                  {loading ? 'Booking...' : 'Confirm'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowConfirmBooking(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {showCancelBooking && (
          <div className="confirmation-modal">
            <div className="confirmation-content">
              <h4>Cancel Booking</h4>
              <p>
                Cancel your appointment on {formatDate(selectedDate)} at{' '}
                {formatTime(selectedSlot?.startTime)} - {formatTime(selectedSlot?.endTime)}?
              </p>
              <div className="confirmation-actions">
                <button 
                  className="btn-warning"
                  onClick={handleCancelBooking}
                  disabled={loading}
                >
                  {loading ? 'Cancelling...' : 'Cancel Booking'}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => setShowCancelBooking(false)}
                  disabled={loading}
                >
                  Keep Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Slot Modal */}
        {showAddModal && (
          <TimeSlotModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            selectedDate={selectedDate}
            onSlotCreated={handleSlotCreated}
          />
        )}
      </div>
    </div>
  );
};

export default SlotManagementModal;
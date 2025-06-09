import React, { useState, useMemo, useEffect } from 'react';
import TimeSlotModal from './TimeSlotModal';
import { createBookingData, validateBookingData } from '../../utils/dateUtils';
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
  doctorInfo,
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
  const [error, setError] = useState(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddModal(false);
      setSelectedSlot(null);
      setShowConfirmBooking(false);
      setShowCancelBooking(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Process slots with error handling
  const processedSlots = useMemo(() => {
    if (!Array.isArray(existingSlots)) {
      console.warn('existingSlots is not an array:', existingSlots);
      return [];
    }

    return existingSlots.filter(slot => {
      if (!slot) return false;
      
      // Validate required properties
      const hasRequiredProps = slot.availabilitySlotId && 
                              (slot.slotDate || slot.date) && 
                              (slot.startTime || slot.time);
      
      if (!hasRequiredProps) {
        console.warn('Slot missing required properties:', slot);
        return false;
      }
      
      return true;
    }).map(slot => ({
      ...slot,
      // Normalize property names
      availabilitySlotId: slot.availabilitySlotId || slot.id,
      slotDate: slot.slotDate || slot.date,
      startTime: slot.startTime || slot.time,
      endTime: slot.endTime || slot.endTime,
      isBooked: Boolean(slot.isBooked),
      durationMinutes: slot.durationMinutes || 30
    }));
  }, [existingSlots]);

  // Filter slots by booking status
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
    setSelectedSlot(slot);
    
    if (userRole === 'doctor') {
      if (slot.isBooked) {
        // Doctor viewing booked slot details
        alert(`Booked by: ${slot.appointment?.patientUser?.username || 'Unknown'}`);
      } else {
        // Doctor can delete available slot
        if (window.confirm('Delete this availability slot?')) {
          handleDeleteSlot(slot);
        }
      }
    } else if (userRole === 'patient') {
      if (slot.isBooked) {
        if (isPatientOwnBooking(slot)) {
          // Patient can cancel their own booking
          setShowCancelBooking(true);
        } else {
          alert('This slot is already booked by another patient.');
        }
      } else {
        // Patient can book available slot
        setShowConfirmBooking(true);
      }
    }
  };

  // Handle slot deletion
  const handleDeleteSlot = async (slot) => {
    if (!onDeleteSlot) return;
    
    try {
      setLoading(true);
      await onDeleteSlot(slot.availabilitySlotId);
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete slot. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking confirmation
  const handleConfirmBooking = async () => {
    if (!selectedSlot || !onBookSlot) return;
    
    try {
      setLoading(true);

      // Validate required fields
      if (!selectedSlot.availabilitySlotId) {
        throw new Error('Availability slot ID is missing');
      }
      if (!selectedSlot.doctorUser?.userId && !doctorInfo?.userId) {
        throw new Error('Doctor information is missing');
      }

      // Create properly formatted booking data
      const slotDataForBooking = {
        availabilitySlotId: selectedSlot.availabilitySlotId,
        slotDate: selectedDate || selectedSlot.slotDate,
        startTime: selectedSlot.startTime,
        durationMinutes: selectedSlot.durationMinutes || 30
      };

      const doctorUserId = selectedSlot.doctorUser?.userId || doctorInfo?.userId;
      const bookingData = createBookingData(slotDataForBooking, doctorUserId);

      console.log('Booking appointment with data:', bookingData);

      // Validate booking data
      const validation = validateBookingData(bookingData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const response = await onBookSlot(bookingData);
      
      // Handle response
      if (response && response.success === false) {
        throw new Error(response.message || 'Failed to book appointment');
      }

      alert('Appointment booked successfully!');
      setShowConfirmBooking(false);
      setSelectedSlot(null);
      
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert(`Booking failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedSlot || !onCancelBooking) return;
    
    try {
      setLoading(true);
      const reason = prompt('Please provide a reason for cancellation (optional):') || 'Patient cancellation';
      
      if (selectedSlot.appointment?.appointmentId) {
        await onCancelBooking(selectedSlot.appointment.appointmentId, reason);
        alert('Appointment cancelled successfully!');
        setShowCancelBooking(false);
        setSelectedSlot(null);
      } else {
        throw new Error('Appointment ID not found');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert(`Cancellation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding new slot
  const handleAddNewSlot = () => {
    setShowAddModal(true);
  };

  // Handle slot creation
  const handleSlotCreated = async (slotData) => {
    try {
      if (!onAddSlot) throw new Error('Add slot handler not provided');
      
      setLoading(true);
      setError(null);

      const response = await onAddSlot(slotData);
      
      if (!response || response.error) {
        throw new Error(response?.error || 'Failed to create slot');
      }

      setShowAddModal(false);
      return { success: true };
      
    } catch (error) {
      console.error('Failed to create slot:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create slot'
      };
    } finally {
      setLoading(false);
    }
  };

  // Render slot list
  const renderSlotList = (slots, title, emptyMessage) => (
    <div className="slot-section">
      <h4 className="slot-section-title">{title}</h4>
      {slots.length === 0 ? (
        <p className="no-slots">{emptyMessage}</p>
      ) : (
        <div className="slots-list">
          {slots.map(slot => (
            <div key={slot.availabilitySlotId} className={`slot-item ${slot.isBooked ? 'booked' : 'available'}`}>
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
                  slot.isBooked ? (
                    <button 
                      className="btn-info-small"
                      onClick={() => handleSlotAction(slot)}
                    >
                      View Details
                    </button>
                  ) : (
                    <button 
                      className="btn-danger-small"
                      onClick={() => handleSlotAction(slot)}
                    >
                      Delete
                    </button>
                  )
                ) : slot.isBooked ? (
                  isPatientOwnBooking(slot) ? (
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
                  )
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
  );

  if (!isOpen || !selectedDate) return null;

  return (
    <div className="slot-modal-overlay">
      <div className="slot-modal">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3>Manage Slots - {formatDate(selectedDate)}</h3>
            {doctorInfo && (
              <small>Dr. {doctorInfo.firstName} {doctorInfo.lastName}</small>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Modal Content */}
        <div className="modal-content">
          {/* Add Slot Button for Doctors */}
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

          {/* Slot Sections */}
          <div className="slot-sections">
            {renderSlotList(
              availableSlots, 
              'Available Slots', 
              'No available slots for this date'
            )}
            
            {renderSlotList(
              bookedSlots, 
              'Booked Slots', 
              'No booked slots for this date'
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
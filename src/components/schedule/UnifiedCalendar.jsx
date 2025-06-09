import React, { useState, useMemo } from 'react';
import SlotManagementModal from './SlotManagementModal';
import './UnifiedCalendar.css';

/**
 * Unified calendar component for managing doctor availability and patient bookings
 */
const UnifiedCalendar = ({
  slots = [],
  userRole = 'doctor',
  currentUserId,
  doctorInfo = null,
  onAddSlot,
  onDeleteSlot,
  onBookSlot,
  onCancelBooking,
  onDateSelect,
  onSlotSelect
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDateSlots, setSelectedDateSlots] = useState([]);

  // Process slot date safely without timezone conversion
  const processSlotDate = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      if (dateValue instanceof Date) {
        return dateValue;
      }
      
      if (typeof dateValue === 'string') {
        // Handle ISO date strings
        if (dateValue.includes('T')) {
          return new Date(dateValue);
        }
        // Handle date-only strings (YYYY-MM-DD) - create date at noon to avoid timezone issues
        const [year, month, day] = dateValue.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
      }
      
      if (Array.isArray(dateValue) && dateValue.length >= 3) {
        // Handle [year, month, day] format
        return new Date(dateValue[0], dateValue[1] - 1, dateValue[2], 12, 0, 0);
      }
      
      return new Date(dateValue);
    } catch (error) {
      console.warn('Error processing slot date:', dateValue, error);
      return null;
    }
  };

  // Format date to YYYY-MM-DD string without timezone conversion
  const formatDateToString = (date) => {
    if (!date) return '';
    
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date to string:', error);
      return '';
    }
  };

  // Process slots with error handling
  const processedSlots = useMemo(() => {
    if (!Array.isArray(slots)) {
      console.warn('Slots is not an array:', slots);
      return [];
    }

    return slots.filter(slot => {
      if (!slot) return false;
      
      const slotDate = processSlotDate(slot.slotDate);
      if (!slotDate || isNaN(slotDate.getTime())) {
        console.warn('Invalid slot date:', slot);
        return false;
      }
      
      return true;
    }).map(slot => {
      const slotDate = processSlotDate(slot.slotDate);
      
      return {
        ...slot,
        slotDate: slotDate,
        availabilitySlotId: slot.availabilitySlotId || slot.slotId || slot.id,
        startTime: slot.startTime || '00:00',
        endTime: slot.endTime || '00:30',
        isBooked: Boolean(slot.isBooked),
        notes: slot.notes || '',
        appointment: slot.appointment || null
      };
    });
  }, [slots]);

  // Get slots for a specific date
  const getDateSlots = (date) => {
    if (!date) return [];
    
    const targetDateStr = formatDateToString(date);
    
    return processedSlots.filter(slot => {
      if (!slot.slotDate) return false;
      
      const slotDateStr = formatDateToString(slot.slotDate);
      return slotDateStr === targetDateStr;
    });
  };

  // Handle date click
  const handleDateClick = (date) => {
    console.log('Date clicked:', date, 'User role:', userRole);
    
    const dateSlots = getDateSlots(date);
    const formattedDate = formatDateToString(date);
    
    console.log('Setting selected date:', { date, formattedDate, dateSlots });
    
    setSelectedDate(formattedDate);
    setSelectedDateSlots(dateSlots);
    setShowSlotModal(true);
    
    if (onDateSelect) {
      onDateSelect(date, dateSlots);
    }
  };

  // Handle slot click
  const handleSlotClick = (slot) => {
    console.log('Slot clicked:', slot, 'User role:', userRole);
    
    if (onSlotSelect) {
      onSlotSelect(slot);
    }
  };

  // Handle adding new slot
  const handleAddSlot = async (slotData) => {
    try {
      console.log('Adding slot with data:', slotData);
      
      if (!onAddSlot) {
        throw new Error('Add slot handler not provided');
      }
      
      const formattedSlotData = {
        ...slotData,
        slotDate: slotData.slotDate, // Already in YYYY-MM-DD format
        startTime: slotData.startTime, // Already in HH:mm:ss format
        durationMinutes: parseInt(slotData.durationMinutes)
      };
      
      await onAddSlot(formattedSlotData);
      setShowSlotModal(false);
      return true;
    } catch (error) {
      console.error('Error adding slot:', error);
      throw new Error(error.message || 'Failed to add slot. Please try again.');
    }
  };

  // Handle slot creation
  const handleSlotCreated = (slotData) => {
    handleAddSlot(slotData);
  };

  // Navigate dates
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + direction);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      default:
        newDate.setDate(newDate.getDate() + direction);
    }
    
    setCurrentDate(newDate);
  };

  // Format current period
  const formatCurrentPeriod = () => {
    const options = {
      year: viewMode === 'year' ? 'numeric' : 'numeric',
      month: viewMode !== 'year' ? 'long' : undefined
    };
    
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Render year view
  const renderYearView = () => {
    const months = [];
    const year = currentDate.getFullYear();
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1, 12, 0, 0);
      const monthSlots = processedSlots.filter(slot => {
        const slotDate = slot.slotDate;
        return slotDate.getFullYear() === year && slotDate.getMonth() === month;
      });
      
      const availableCount = monthSlots.filter(slot => !slot.isBooked).length;
      const bookedCount = monthSlots.filter(slot => slot.isBooked).length;
      
      months.push(
        <div 
          key={month} 
          className="year-month"
          onClick={() => {
            setCurrentDate(monthDate);
            setViewMode('month');
          }}
        >
          <h4>{monthDate.toLocaleDateString('en-US', { month: 'long' })}</h4>
          <div className="month-stats">
            <span className="available-count">{availableCount} available</span>
            <span className="booked-count">{bookedCount} booked</span>
          </div>
        </div>
      );
    }
    
    return <div className="year-view">{months}</div>;
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.push(
      <div key="headers" className="calendar-headers">
        {dayHeaders.map(day => (
          <div key={day} className="calendar-header">{day}</div>
        ))}
      </div>
    );
    
    // Add calendar days
    const calendarDays = [];
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(currentDateObj);
        date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        
        const isCurrentMonth = date.getMonth() === month;
        const isToday = formatDateToString(date) === formatDateToString(today);
        const isPast = date < today;
        
        const daySlots = getDateSlots(date);
        const availableSlots = daySlots.filter(slot => !slot.isBooked);
        const bookedSlots = daySlots.filter(slot => slot.isBooked);
        
        weekDays.push(
          <div
            key={formatDateToString(date)}
            className={`calendar-day ${isCurrentMonth ? 'current-month' : 'other-month'} ${
              isToday ? 'today' : ''
            } ${isPast ? 'past' : ''} ${daySlots.length > 0 ? 'has-slots' : ''}`}
            onClick={() => !isPast && handleDateClick(date)}
          >
            <span className="day-number">{date.getDate()}</span>
            {daySlots.length > 0 && (
              <div className="day-slots">
                {availableSlots.length > 0 && (
                  <span className="available-indicator">{availableSlots.length}</span>
                )}
                {bookedSlots.length > 0 && (
                  <span className="booked-indicator">{bookedSlots.length}</span>
                )}
              </div>
            )}
          </div>
        );
        
        currentDateObj.setDate(currentDateObj.getDate() + 1);
      }
      
      calendarDays.push(
        <div key={week} className="calendar-week">
          {weekDays}
        </div>
      );
      
      if (currentDateObj > lastDay) break;
    }
    
    days.push(
      <div key="calendar" className="calendar-grid">
        {calendarDays}
      </div>
    );
    
    return <div className="month-view">{days}</div>;
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(12, 0, 0, 0);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      date.setHours(12, 0, 0, 0);
      weekDays.push(date);
    }
    
    const timeSlots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push(timeString);
      }
    }
    
    return (
      <div className="week-view">
        <div className="week-header">
          {weekDays.map(date => (
            <div key={formatDateToString(date)} className="week-day-header">
              <span className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="day-date">{date.getDate()}</span>
            </div>
          ))}
        </div>
        
        <div className="week-grid">
          <div className="time-column">
            {timeSlots.map(time => (
              <div key={time} className="time-slot-label">{time}</div>
            ))}
          </div>
          
          {weekDays.map(date => (
            <div key={formatDateToString(date)} className="week-day-column">
              {timeSlots.map(time => {
                const daySlots = getDateSlots(date);
                const slotAtTime = daySlots.find(slot => 
                  slot.startTime && slot.startTime.substring(0, 5) === time
                );
                
                return (
                  <div
                    key={`${formatDateToString(date)}-${time}`}
                    className={`week-time-slot ${slotAtTime ? (slotAtTime.isBooked ? 'booked' : 'available') : 'empty'}`}
                    onClick={() => {
                      if (slotAtTime) {
                        handleSlotClick(slotAtTime);
                      } else {
                        handleDateClick(date);
                      }
                    }}
                  >
                    {slotAtTime && (
                      <div className="slot-content">
                        {slotAtTime.isBooked ? 'Booked' : 'Available'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="unified-calendar">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={() => navigateDate(-1)}>‹</button>
          <h3>{formatCurrentPeriod()}</h3>
          <button onClick={() => navigateDate(1)}>›</button>
        </div>
        
        <div className="calendar-controls">
          <button onClick={() => setCurrentDate(new Date())}>Today</button>
          <div className="view-mode-buttons">
            <button 
              className={viewMode === 'year' ? 'active' : ''}
              onClick={() => setViewMode('year')}
            >
              Year
            </button>
            <button 
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button 
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        {viewMode === 'year' && renderYearView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
      </div>

      {/* Slot Management Modal */}
      {showSlotModal && (
        <SlotManagementModal
          isOpen={showSlotModal}
          onClose={() => setShowSlotModal(false)}
          selectedDate={selectedDate}
          existingSlots={selectedDateSlots}
          userRole={userRole}
          currentUserId={currentUserId}
          doctorInfo={doctorInfo}
          onAddSlot={handleAddSlot}
          onDeleteSlot={onDeleteSlot}
          onBookSlot={onBookSlot}
          onCancelBooking={onCancelBooking}
        />
      )}
    </div>
  );
};

export default UnifiedCalendar;
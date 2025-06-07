import React, { useState, useEffect } from 'react';
import SlotManagementModal from './SlotManagementModal';
import './UnifiedCalendar.css';

const UnifiedCalendar = ({ 
  slots = [], 
  userRole = 'doctor', 
  currentUserId, 
  doctorInfo = null,
  onSlotAction,
  onBookSlot,
  onCancelBooking,
  onAddSlot,
  onDeleteSlot
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'year', 'month', 'week'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDateSlots, setSelectedDateSlots] = useState([]);

  // Ensure valid date handling
  const ensureValidDate = (date) => {
    if (!date) return new Date();
    if (date instanceof Date && !isNaN(date)) return date;
    try {
      const parsedDate = new Date(date);
      return isNaN(parsedDate) ? new Date() : parsedDate;
    } catch {
      return new Date();
    }
  };

  // Process slots to ensure valid dates
  const processedSlots = slots.map(slot => ({
    ...slot,
    slotDate: ensureValidDate(slot.slotDate)
  }));

  // Get slots for a specific date
  const getDateSlots = (date) => {
    if (!date) return [];
    const targetDate = ensureValidDate(date);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    return processedSlots.filter(slot => {
      const slotDate = ensureValidDate(slot.slotDate);
      return slotDate.toISOString().split('T')[0] === targetDateStr;
    });
  };

  // Handle date click
  const handleDateClick = (date) => {
    const validDate = ensureValidDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Don't allow selection of past dates
    if (validDate < today) return;
    
    const dateSlots = getDateSlots(validDate);
    setSelectedDate(validDate);
    setSelectedDateSlots(dateSlots);
    setShowSlotModal(true);
  };

  // Navigation functions
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + direction);
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + direction);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction * 7));
        break;
    }
    
    newDate.setHours(12, 0, 0, 0); // Prevent timezone issues
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setCurrentDate(today);
  };

  // Year view rendering
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = [];
    
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthSlots = processedSlots.filter(slot => {
        const slotDate = ensureValidDate(slot.slotDate);
        return slotDate.getFullYear() === year && slotDate.getMonth() === month;
      });
      
      months.push(
        <div key={month} className="year-month" onClick={() => {
          setCurrentDate(monthDate);
          setViewMode('month');
        }}>
          <div className="month-name">
            {monthDate.toLocaleDateString('en-US', { month: 'long' })}
          </div>
          <div className="month-stats">
            <span className="available-count">
              {monthSlots.filter(slot => !slot.isBooked).length} available
            </span>
            <span className="booked-count">
              {monthSlots.filter(slot => slot.isBooked).length} booked
            </span>
          </div>
        </div>
      );
    }
    
    return <div className="year-grid">{months}</div>;
  };

  // Month view rendering
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = [];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      const isPast = date < today;
      
      const dateSlots = getDateSlots(date);
      const availableSlots = dateSlots.filter(slot => !slot.isBooked);
      const bookedSlots = dateSlots.filter(slot => slot.isBooked);
      
      days.push(
        <div
          key={date.toISOString()}
          className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} 
                     ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
          onClick={() => !isPast && handleDateClick(date)}
        >
          <div className="day-number">{date.getDate()}</div>
          {dateSlots.length > 0 && (
            <div className="day-slots">
              {availableSlots.length > 0 && (
                <div className="slot-indicator available">
                  {availableSlots.length}
                </div>
              )}
              {bookedSlots.length > 0 && (
                <div className="slot-indicator booked">
                  {bookedSlots.length}
                </div>
              )}
            </div>
          )}
          {dateSlots.length === 0 && !isPast && userRole === 'doctor' && (
            <div className="add-slots-hint">+</div>
          )}
        </div>
      );
    }
    
    return <div className="month-grid">{days}</div>;
  };

  // Week view rendering
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    startOfWeek.setHours(12, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeSlots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeSlots.push(timeStr);
      }
    }
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      const isPast = date < today;
      const dateSlots = getDateSlots(date);
      
      weekDays.push(
        <div key={date.toISOString()} className={`week-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}>
          <div className="week-day-header" onClick={() => !isPast && handleDateClick(date)}>
            <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="day-number">{date.getDate()}</div>
          </div>
          <div className="week-day-slots">
            {timeSlots.map(time => {
              const slotData = dateSlots.find(slot => slot.startTime === time + ':00');
              return (
                <div
                  key={time}
                  className={`week-slot ${slotData ? (slotData.isBooked ? 'booked' : 'available') : 'empty'}`}
                  onClick={() => !isPast && handleDateClick(date)}
                  title={slotData ? `${time} - ${slotData.endTime} ${slotData.isBooked ? '(Booked)' : '(Available)'}` : `${time} - Click to add`}
                >
                  {slotData && (
                    <div className="slot-content">
                      <div className="slot-time">{time}</div>
                      <div className="slot-status">
                        {slotData.isBooked ? 'Booked' : 'Available'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {dateSlots.length === 0 && !isPast && userRole === 'doctor' && (
              <div className="no-slots" onClick={() => handleDateClick(date)}>
                Click to add slots
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return <div className="week-grid">{weekDays}</div>;
  };

  // Format current period display
  const formatCurrentPeriod = () => {
    switch (viewMode) {
      case 'year':
        return currentDate.getFullYear().toString();
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week':
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      default:
        return '';
    }
  };

  return (
    <div className="unified-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-navigation">
          <div className="nav-buttons">
            <button className="nav-btn" onClick={() => navigateDate(-1)}>
              &#8249;
            </button>
            <button className="today-btn" onClick={goToToday}>
              Today
            </button>
            <button className="nav-btn" onClick={() => navigateDate(1)}>
              &#8250;
            </button>
          </div>
          
          <div className="current-period">
            <h3>{formatCurrentPeriod()}</h3>
          </div>
          
          <div className="view-selector">
            {['year', 'month', 'week'].map(mode => (
              <button
                key={mode}
                className={`view-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {viewMode === 'year' && renderYearView()}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color booked"></div>
          <span>Booked</span>
        </div>
        {userRole === 'doctor' && (
          <div className="legend-item">
            <div className="legend-color empty"></div>
            <span>No slots</span>
          </div>
        )}
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
          onAddSlot={onAddSlot}
          onDeleteSlot={onDeleteSlot}
          onBookSlot={onBookSlot}
          onCancelBooking={onCancelBooking}
        />
      )}
    </div>
  );
};

export default UnifiedCalendar;

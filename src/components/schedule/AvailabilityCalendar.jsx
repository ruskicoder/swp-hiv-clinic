import React, { useState } from 'react';
import './AvailabilityCalendar.css';

const AvailabilityCalendar = ({ 
  slots = [], 
   
  onDateSelect,
  viewMode = 'month',
  userRole = 'doctor',
  
}) => {
  // Ensure currentDate is always a valid Date object
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentView, setCurrentView] = useState(viewMode);
  const [loading, _setLoading] = useState(false);

  // Helper function to ensure date is valid
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
  const processedSlots = React.useMemo(() => {
    return slots.map(slot => {
      try {
        const slotDate = slot.slotDate instanceof Date ? 
          slot.slotDate : 
          new Date(slot.slotDate);
        
        return {
          ...slot,
          slotDate,
          startTime: slot.startTime || '00:00',
          endTime: slot.endTime || '00:00',
          isBooked: Boolean(slot.isBooked)
        };
      } catch (error) {
        console.error('Error processing slot:', error, slot);
        return null;
      }
    }).filter(Boolean);
  }, [slots]);

  // Get slots for a specific date - improved date comparison
  const getDateSlots = (date) => {
    if (!date) return [];
    const targetDate = ensureValidDate(date);
    
    return processedSlots.filter(slot => {
      try {
        const slotDate = slot.slotDate instanceof Date ? 
          slot.slotDate : 
          new Date(slot.slotDate);
          
        return slotDate.toDateString() === targetDate.toDateString();
      } catch (error) {
        console.error('Error comparing dates:', error, slot);
        return false;
      }
    });
  };

  // Handle date click with validated date
  const handleDateClick = (date) => {
    const validDate = ensureValidDate(date);
    if (isDateDisabled(validDate)) return;
    
    const dateSlots = getDateSlots(validDate);
    if (onDateSelect) {
      onDateSelect(validDate, {
        dateSlots,
        hasBooked: dateSlots.some(slot => slot.isBooked),
        hasAvailable: dateSlots.some(slot => !slot.isBooked)
      });
    }
  };

  // Updated isDateDisabled function with proper date validation
  const isDateDisabled = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return true;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getTime() < today.getTime();
  };

  // Render month view
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const _lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
      const isPast = date < today;
      
      const dateSlots = getDateSlots(date);
      
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
              {dateSlots.filter(slot => !slot.isBooked).length > 0 && (
                <div className="slot-indicator available">
                  {dateSlots.filter(slot => !slot.isBooked).length}
                </div>
              )}
              {dateSlots.filter(slot => slot.isBooked).length > 0 && (
                <div className="slot-indicator booked">
                  {dateSlots.filter(slot => slot.isBooked).length}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="month-view">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-days">
          {days}
        </div>
      </div>
    );
  };

  // Render week view
  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const isToday = date.getTime() === today.getTime();
      const isPast = date < today;
      const dateSlots = getDateSlots(date);

      days.push(
        <div 
          key={date.toISOString()} // Use proper unique key
          className={`week-day ${isToday ? 'today' : ''} ${isPast ? 'past' : ''}`}
        >
          <div className="week-day-header">
            <div className="day-name">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <div className="day-number">{date.getDate()}</div>
          </div>
          <div className="week-day-slots" onClick={() => !isPast && handleDateClick(date)}>
            {dateSlots.map((slot, index) => (
              <div
                key={index}
                className={`week-slot ${slot.isBooked ? 'booked' : 'available'}`}
                title={`${slot.startTime} - ${slot.endTime} ${slot.isBooked ? '(Booked)' : '(Available)'}`}
              >
                {slot.startTime} - {slot.endTime}
                {slot.isBooked && userRole === 'patient' && (
                  <span className="slot-status"> (Booked)</span>
                )}
              </div>
            ))}
            {dateSlots.length === 0 && !isPast && userRole === 'doctor' && (
              <div className="no-slots" onClick={() => handleDateClick(date)}>
                Click to add slots
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="week-view">
        {days}
      </div>
    );
  };

  // Add navigation functions
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    switch(currentView) {
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + direction);
        break;
      default:
        newDate.setMonth(currentDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const changeMonth = (monthIndex) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
  };

  const changeYear = (year) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(year);
    setCurrentDate(newDate);
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let year = currentYear - 2; year <= currentYear + 5; year++) {
    yearOptions.push(year);
  }

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="availability-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-navigation">
          <div className="nav-buttons">
            <button className="nav-btn" onClick={() => navigateDate(-1)}>‹</button>
            <button className="today-btn" onClick={goToToday}>Today</button>
            <button className="nav-btn" onClick={() => navigateDate(1)}>›</button>
          </div>
          
          <div className="date-selectors">
            <select 
              value={currentDate.getMonth()} 
              onChange={(e) => changeMonth(parseInt(e.target.value))}
              className="month-selector"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            
            <select 
              value={currentDate.getFullYear()} 
              onChange={(e) => changeYear(parseInt(e.target.value))}
              className="year-selector"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="calendar-controls">
          <div className="view-mode-buttons">
            <button 
              className={`view-button ${currentView === 'month' ? 'active' : ''}`}
              onClick={() => setCurrentView('month')}
            >
              Month
            </button>
            <button 
              className={`view-button ${currentView === 'week' ? 'active' : ''}`}
              onClick={() => setCurrentView('week')}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {loading ? (
          <div className="calendar-loading">Loading...</div>
        ) : (
          <>
            {currentView === 'month' && renderMonthView()}
            {currentView === 'week' && renderWeekView()}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available Slots</span>
        </div>
        <div className="legend-item">
          <div className="legend-color booked"></div>
          <span>Booked Slots</span>
        </div>
        {userRole === 'doctor' && (
          <div className="legend-item">
            <div className="legend-color no-slots"></div>
            <span>No Slots (Click to add)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
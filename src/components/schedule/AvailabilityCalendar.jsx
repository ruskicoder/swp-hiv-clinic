import React, { useState } from 'react';
import './AvailabilityCalendar.css';

const AvailabilityCalendar = ({ onSlotSelect, existingSlots = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month, day);
      // Ensure time is set to noon to avoid timezone issues
      dayDate.setHours(12, 0, 0, 0);
      days.push(dayDate);
    }
    
    return days;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDateDisabled = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const getDateSlots = (date) => {
    // Format date consistently as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    return existingSlots.filter(slot => {
      // Handle both date string formats and ensure consistent comparison
      let slotDateString;
      if (slot.slotDate instanceof Date) {
        const slotYear = slot.slotDate.getFullYear();
        const slotMonth = String(slot.slotDate.getMonth() + 1).padStart(2, '0');
        const slotDay = String(slot.slotDate.getDate()).padStart(2, '0');
        slotDateString = `${slotYear}-${slotMonth}-${slotDay}`;
      } else if (typeof slot.slotDate === 'string') {
        // Extract just the date part if it's a datetime string
        slotDateString = slot.slotDate.split('T')[0];
      } else {
        return false;
      }
      
      return slotDateString === dateString;
    });
  };

  const handleDateClick = (date) => {
    if (isDateDisabled(date)) return;
    
    const dateSlots = getDateSlots(date);
    onSlotSelect(date, dateSlots);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setCurrentDate(today);
  };

  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="availability-calendar">
      <div className="calendar-header">
        <button className="nav-btn" onClick={goToPreviousMonth}>
          ‹
        </button>
        <h3 className="month-year">{formatMonthYear()}</h3>
        <button className="nav-btn" onClick={goToNextMonth}>
          ›
        </button>
      </div>
      
      <button className="today-btn" onClick={goToToday}>
        Today
      </button>

      <div className="calendar-grid">
        <div className="weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>
        
        <div className="days-grid">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="empty-day"></div>;
            }

            const dateSlots = getDateSlots(date);
            const hasAvailable = dateSlots.some(slot => !slot.isBooked);
            const hasBooked = dateSlots.some(slot => slot.isBooked);
            const isDisabled = isDateDisabled(date);

            return (
              <div
                key={index}
                className={`day-cell ${isDisabled ? 'disabled' : ''} ${
                  dateSlots.length > 0 ? 'has-slots' : ''
                } ${hasAvailable ? 'has-available' : ''} ${hasBooked ? 'has-booked' : ''}`}
                onClick={() => handleDateClick(date)}
                title={isDisabled ? 'Past date' : formatDate(date)}
              >
                <span className="day-number">{date.getDate()}</span>
                {dateSlots.length > 0 && (
                  <div className="slot-indicators">
                    {hasAvailable && <div className="indicator available"></div>}
                    {hasBooked && <div className="indicator booked"></div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-indicator available"></div>
          <span>Available Slots</span>
        </div>
        <div className="legend-item">
          <div className="legend-indicator booked"></div>
          <span>Booked Slots</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
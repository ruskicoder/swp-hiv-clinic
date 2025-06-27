import React, { useState } from 'react';
import './WeeklySchedule.css';

const WeeklySchedule = ({ 
  availableSlots = [], 
  onSlotSelect, 
  selectedSlot = null,
  viewMode = 'week'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(viewMode);

  // Get the start of the week (Monday) - fixed timezone handling
  const getWeekStart = (date) => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const day = d.getDay();
    const diff = d.getDate() - ((day + 6) % 7); // Monday as start of week
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(12, 0, 0, 0); // Ensure consistent time
    return monday;
  };

  // Generate week days
  const getWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      day.setHours(12, 0, 0, 0); // Ensure time is noon to avoid timezone issues
      days.push(day);
    }
    return days;
  };

  // Generate time slots (8 AM to 6 PM)
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  // Check if a slot is available - fixed date comparison
  const isSlotAvailable = (date, time) => {
    // Format date consistently as YYYY-MM-DD in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const slot = availableSlots.find(slot => {
      let slotDateStr;
      if (slot.slotDate instanceof Date) {
        const slotYear = slot.slotDate.getFullYear();
        const slotMonth = String(slot.slotDate.getMonth() + 1).padStart(2, '0');
        const slotDay = String(slot.slotDate.getDate()).padStart(2, '0');
        slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
      } else if (typeof slot.slotDate === 'string') {
        slotDateStr = slot.slotDate.split('T')[0]; // Extract date part
      } else {
        return false;
      }
      
      return slotDateStr === dateStr && slot.startTime === time + ':00';
    });
    return !slot || !slot.isBooked;
  };

  // Get slot data - fixed date comparison
  const getSlotData = (date, time) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return availableSlots.find(slot => {
      let slotDateStr;
      if (slot.slotDate instanceof Date) {
        const slotYear = slot.slotDate.getFullYear();
        const slotMonth = String(slot.slotDate.getMonth() + 1).padStart(2, '0');
        const slotDay = String(slot.slotDate.getDate()).padStart(2, '0');
        slotDateStr = `${slotYear}-${slotMonth}-${slotDay}`;
      } else if (typeof slot.slotDate === 'string') {
        slotDateStr = slot.slotDate.split('T')[0];
      } else {
        return false;
      }
      
      return slotDateStr === dateStr && slot.startTime === time + ':00';
    });
  };

  // Handle slot click
  const handleSlotClick = (date, time) => {
    const slotData = getSlotData(date, time);
    // Allow selection if slot is empty or not booked
    if ((!slotData || !slotData.isBooked) && onSlotSelect) {
      // Format date consistently
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      // If slotData exists, pass it; else pass info to create new slot
      onSlotSelect(slotData || { 
        slotDate: formattedDate, 
        startTime: time + ':00', 
        endTime: null 
      });
    }
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    newDate.setHours(12, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    newDate.setHours(12, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    newDate.setHours(12, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    newDate.setHours(12, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToPreviousYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() - 1);
    newDate.setHours(12, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + 1);
    newDate.setHours(12, 0, 0, 0);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    setCurrentDate(today);
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Format month/year for header
  const formatMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const weekDays = getWeekDays();
  const timeSlots = getTimeSlots();

  // Allow clicking on day header to select a date for availability
  const handleDayHeaderClick = (day) => {
    if (onSlotSelect) {
      onSlotSelect(day);
    }
  };

  return (
    <div className="weekly-schedule">
      <div className="schedule-header">
        <div className="schedule-navigation">
          <div className="nav-buttons">
            <button 
              className="nav-btn" 
              onClick={currentView === 'week' ? goToPreviousWeek : 
                      currentView === 'month' ? goToPreviousMonth : goToPreviousYear}
            >
              ‹
            </button>
            <button className="today-btn" onClick={goToToday}>
              Today
            </button>
            <button 
              className="nav-btn" 
              onClick={currentView === 'week' ? goToNextWeek : 
                      currentView === 'month' ? goToNextMonth : goToNextYear}
            >
              ›
            </button>
          </div>
          
          <div className="current-period">
            <h3>{formatMonthYear()}</h3>
          </div>
          
          <div className="view-selector">
            <button 
              className={`view-btn ${currentView === 'week' ? 'active' : ''}`}
              onClick={() => setCurrentView('week')}
            >
              Week
            </button>
            <button 
              className={`view-btn ${currentView === 'month' ? 'active' : ''}`}
              onClick={() => setCurrentView('month')}
            >
              Month
            </button>
            <button 
              className={`view-btn ${currentView === 'year' ? 'active' : ''}`}
              onClick={() => setCurrentView('year')}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {currentView === 'week' && (
        <div className="schedule-grid">
          {/* Time column */}
          <div className="time-column">
            <div className="time-header"></div>
            {timeSlots.map(time => (
              <div key={time} className="time-slot">
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => (
            <div key={day.toISOString()} className="day-column">
              <div
                className="day-header"
                style={{ cursor: onSlotSelect ? 'pointer' : 'default', background: '#f8f9fa' }}
                onClick={() => handleDayHeaderClick(day)}
                title={onSlotSelect ? 'Add availability for this day' : undefined}
              >
                <div className="day-name">{formatDate(day)}</div>
              </div>
              
              {timeSlots.map(time => {
                const slotData = getSlotData(day, time);
                const isAvailable = isSlotAvailable(day, time);
                const isSelected = selectedSlot && 
                  selectedSlot.slotDate === day.toISOString().split('T')[0] && 
                  selectedSlot.startTime === time + ':00';

                return (
                  <div
                    key={time}
                    className={`schedule-slot ${
                      slotData ? (slotData.isBooked ? 'unavailable' : 'available') : ''
                    } ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSlotClick(day, time)}
                  >
                    <div className="slot-content">
                      {slotData && (
                        <>
                          <div className="doctor-name">
                            {slotData.isBooked ? 'Booked' : 'Available'}
                          </div>
                          <div className="slot-time">{time}</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      <div className="schedule-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#e8f5e8' }}></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f8f9fa' }}></div>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#2d5a27' }}></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
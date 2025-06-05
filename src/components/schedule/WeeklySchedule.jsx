import React, { useState, useEffect } from 'react';
import './WeeklySchedule.css';

const WeeklySchedule = ({ 
  availableSlots = [], 
  onSlotSelect, 
  selectedSlot = null,
  viewMode = 'week' // 'week', 'month', 'year'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState(viewMode);

  // Get the start of the week (Monday)
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  };

  // Generate week days
  const getWeekDays = () => {
    const weekStart = getWeekStart(currentDate);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
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

  // Check if a slot is available
  const isSlotAvailable = (date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.some(slot => 
      slot.slotDate === dateStr && 
      slot.startTime === time + ':00' && 
      !slot.isBooked
    );
  };

  // Get slot data
  const getSlotData = (date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    return availableSlots.find(slot => 
      slot.slotDate === dateStr && 
      slot.startTime === time + ':00'
    );
  };

  // Handle slot click
  const handleSlotClick = (date, time) => {
    const slotData = getSlotData(date, time);
    if (slotData && !slotData.isBooked && onSlotSelect) {
      onSlotSelect(slotData);
    }
  };

  // Navigation functions
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const goToPreviousYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() - 1);
    setCurrentDate(newDate);
  };

  const goToNextYear = () => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(currentDate.getFullYear() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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

  return (
    <div className="weekly-schedule">
      {/* Header with navigation */}
      <div className="schedule-header">
        <div className="schedule-navigation">
          <div className="nav-buttons">
            <button 
              className="nav-btn" 
              onClick={currentView === 'week' ? goToPreviousWeek : 
                      currentView === 'month' ? goToPreviousMonth : goToPreviousYear}
            >
              &#8249;
            </button>
            <button className="today-btn" onClick={goToToday}>
              Today
            </button>
            <button 
              className="nav-btn" 
              onClick={currentView === 'week' ? goToNextWeek : 
                      currentView === 'month' ? goToNextMonth : goToNextYear}
            >
              &#8250;
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

      {/* Week view */}
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
              <div className="day-header">
                <div className="day-name">{formatDate(day)}</div>
              </div>
              
              {timeSlots.map(time => {
                const isAvailable = isSlotAvailable(day, time);
                const slotData = getSlotData(day, time);
                const isSelected = selectedSlot && 
                  selectedSlot.availabilitySlotID === slotData?.availabilitySlotID;
                
                return (
                  <div
                    key={`${day.toISOString()}-${time}`}
                    className={`schedule-slot ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => isAvailable && handleSlotClick(day, time)}
                  >
                    {isAvailable && slotData && (
                      <div className="slot-content">
                        <div className="doctor-name">
                          Dr. {slotData.doctorFirstName} {slotData.doctorLastName}
                        </div>
                        <div className="slot-time">
                          {time} - {slotData.endTime?.substring(0, 5)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="schedule-legend">
        <div className="legend-item">
          <div className="legend-color available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="legend-color unavailable"></div>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="legend-color selected"></div>
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;

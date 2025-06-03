import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');
  const [slotsError, setSlotsError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    setAppointmentsError('');
    setSlotsError('');
    try {
      console.log('Loading doctor dashboard data...');
      
      const [appointmentsRes, slotsRes] = await Promise.allSettled([
        apiClient.get('/appointments/doctor/my-appointments'),
        apiClient.get('/doctors/availability/my-slots')
      ]);
      
      if (appointmentsRes.status === 'fulfilled') {
        setAppointments(Array.isArray(appointmentsRes.value.data) ? appointmentsRes.value.data : []);
      } else {
        setAppointments([]);
        setAppointmentsError('Failed to load appointments: ' + (appointmentsRes.reason?.message || 'Unknown error'));
        console.error('Appointments error:', appointmentsRes.reason);
      }
      if (slotsRes.status === 'fulfilled') {
        setAvailabilitySlots(Array.isArray(slotsRes.value.data) ? slotsRes.value.data : []);
      } else {
        setAvailabilitySlots([]);
        setSlotsError('Failed to load availability slots: ' + (slotsRes.reason?.message || 'Unknown error'));
        console.error('Slots error:', slotsRes.reason);
      }
    } catch (error) {
      setError(`Failed to load dashboard data: ${error.message}`);
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this availability slot?')) {
      try {
        await apiClient.delete(`/doctors/availability/${slotId}`);
        loadDashboardData();
      } catch (error) {
        console.error('Delete slot error:', error);
        setError(`Failed to delete availability slot: ${error.message}`);
      }
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      {(appointmentsError || slotsError) && (
        <div className="error-message">
          {appointmentsError && <div>{appointmentsError}</div>}
          {slotsError && <div>{slotsError}</div>}
        </div>
      )}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p className="stat-number">{appointments.length}</p>
        </div>
        <div className="stat-card">
          <h3>Today's Appointments</h3>
          <p className="stat-number">
            {appointments.filter(apt => {
              const today = new Date().toDateString();
              const aptDate = new Date(apt.appointmentDateTime).toDateString();
              return today === aptDate && apt.status === 'Scheduled';
            }).length}
          </p>
      </div>
        <div className="stat-card">
          <h3>Available Slots</h3>
          <p className="stat-number">
            {availabilitySlots.filter(slot => !slot.isBooked).length}
          </p>
        </div>
        </div>
      <div className="today-appointments">
        <h3>Today's Appointments</h3>
        {appointments
          .filter(apt => {
            const today = new Date().toDateString();
            const aptDate = new Date(apt.appointmentDateTime).toDateString();
            return today === aptDate;
          })
          .length === 0 ? (
          <p>No appointments for today.</p>
        ) : (
          appointments
            .filter(apt => {
              const today = new Date().toDateString();
              const aptDate = new Date(apt.appointmentDateTime).toDateString();
              return today === aptDate;
            })
            .map(appointment => (
              <div key={appointment.appointmentId} className="appointment-card">
                <div className="appointment-info">
                  <h4>{safeRender(appointment.patientUser?.username, 'Unknown Patient')}</h4>
                  <p>{new Date(appointment.appointmentDateTime).toLocaleTimeString()}</p>
                  <span className={`status ${safeRender(appointment.status, 'unknown').toLowerCase()}`}>
                    {safeRender(appointment.status, 'Unknown')}
                  </span>
      </div>
              </div>
            ))
        )}
      </div>
    </div>
  );

  const renderAppointments = () => (
    <div className="appointments-section">
      <h3>All Appointments</h3>
      {appointmentsError && <div className="error-message">{appointmentsError}</div>}
      {appointments.length === 0 && !appointmentsError ? (
        <p>No appointments found.</p>
      ) : (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment.appointmentId} className="appointment-card">
              <div className="appointment-details">
                <h4>Patient: {safeRender(appointment.patientUser?.username, 'Unknown Patient')}</h4>
                <p><strong>Date:</strong> {safeDate(appointment.appointmentDateTime)}</p>
                <p><strong>Time:</strong> {new Date(appointment.appointmentDateTime).toLocaleTimeString()}</p>
                <p><strong>Duration:</strong> {safeRender(appointment.durationMinutes, '30')} minutes</p>
                <span className={`status ${safeRender(appointment.status, 'unknown').toLowerCase()}`}>
                  {safeRender(appointment.status, 'Unknown')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAvailability = () => (
    <div className="availability-section">
      <div className="section-header">
        <h3>My Availability</h3>
        <button 
          className="add-btn"
          onClick={() => setActiveTab('add-availability')}
        >
          Add Availability
        </button>
      </div>
      {slotsError && <div className="error-message">{slotsError}</div>}
      {availabilitySlots.length === 0 && !slotsError ? (
        <p>No availability slots found.</p>
      ) : (
        <div className="slots-list">
          {availabilitySlots.map(slot => (
            <div key={slot.availabilitySlotId} className="slot-card">
              <div className="slot-details">
                <h4>{safeDate(slot.slotDate)}</h4>
                <p><strong>Time:</strong> {safeRender(slot.startTime)} - {safeRender(slot.endTime)}</p>
                {slot.notes && <p><strong>Notes:</strong> {safeRender(slot.notes)}</p>}
                <span className={`status ${slot.isBooked ? 'booked' : 'available'}`}>
                  {slot.isBooked ? 'Booked' : 'Available'}
                </span>
              </div>
              {!slot.isBooked && (
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteSlot(slot.availabilitySlotId)}
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAddAvailability = () => (
    <div className="add-availability-section">
      <h3>Add New Availability</h3>
      <AddAvailabilityForm onSuccess={loadDashboardData} />
    </div>
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <h1>Welcome, Dr. {safeRender(user?.firstName || user?.username, 'Doctor')}!</h1>
        <p>Manage your appointments and availability</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'appointments' ? 'active' : ''}
          onClick={() => setActiveTab('appointments')}
        >
          Appointments
        </button>
        <button 
          className={activeTab === 'availability' ? 'active' : ''}
          onClick={() => setActiveTab('availability')}
        >
          Availability
        </button>
        <button 
          className={activeTab === 'add-availability' ? 'active' : ''}
          onClick={() => setActiveTab('add-availability')}
        >
          Add Availability
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'appointments' && renderAppointments()}
        {activeTab === 'availability' && renderAvailability()}
        {activeTab === 'add-availability' && renderAddAvailability()}
      </div>
    </div>
  );
};

// Add Availability Form Component
const AddAvailabilityForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    slotDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Adding availability with data:', formData);
      await apiClient.post('/doctors/availability', formData);
      alert('Availability added successfully!');
      setFormData({
        slotDate: '',
        startTime: '',
        endTime: '',
        notes: ''
      });
      onSuccess();
    } catch (error) {
      console.error('Add availability error:', error);
      setError(error.message || 'Failed to add availability');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="availability-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="slotDate">Date</label>
        <input
          type="date"
          id="slotDate"
          name="slotDate"
          value={formData.slotDate}
          onChange={handleChange}
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startTime">Start Time</label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time</label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes (Optional)</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any special notes for this time slot..."
          rows="3"
        />
      </div>

      <button type="submit" disabled={loading} className="submit-btn">
        {loading ? 'Adding...' : 'Add Availability'}
      </button>
    </form>
  );
};

export default DoctorDashboard;
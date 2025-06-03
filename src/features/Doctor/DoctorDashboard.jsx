import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import { SafeText } from '../../utils/SafeComponents';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);

  // Error states
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
      
      // Initialize with empty arrays
        setAppointments([]);
        setAvailabilitySlots([]);
      
      // Load appointments and availability slots concurrently
      const [appointmentsResult, slotsResult] = await Promise.allSettled([
        apiClient.get('/appointments/doctor/my-appointments'),
        apiClient.get('/doctors/availability/my-slots')
      ]);

      // Handle appointments
      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.data) {
        const appointmentsData = Array.isArray(appointmentsResult.value.data) ? appointmentsResult.value.data : [];
        setAppointments(appointmentsData);
      } else {
        setAppointmentsError('Failed to load appointments');
      }

      // Handle availability slots
      if (slotsResult.status === 'fulfilled' && slotsResult.value?.data) {
        const slotsData = Array.isArray(slotsResult.value.data) ? slotsResult.value.data : [];
        setAvailabilitySlots(slotsData);
      } else {
        setSlotsError('Failed to load availability slots');
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      await apiClient.delete(`/doctors/availability/${slotId}`);
      loadDashboardData();
    } catch (error) {
      console.error('Delete slot error:', error);
      setError('Failed to delete availability slot');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'My Appointments', icon: '📅' },
    { id: 'availability', label: 'My Availability', icon: '🕒' },
    { id: 'add-availability', label: 'Add Availability', icon: '➕' }
  ];

  const renderOverview = () => (
    <ErrorBoundary>
      <div className="overview-section">
        <div className="content-header">
          <h2>Doctor Dashboard</h2>
          <p>Welcome back, Dr. <SafeText>{safeRender(user?.username)}</SafeText>! Manage your appointments and availability.</p>
      </div>

        {(appointmentsError || slotsError) && (
          <div className="error-message">
            {appointmentsError && <div><SafeText>{appointmentsError}</SafeText></div>}
            {slotsError && <div><SafeText>{slotsError}</SafeText></div>}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <p className="stat-number">{appointments?.length || 0}</p>
        </div>
          <div className="stat-card">
            <h3>Today's Appointments</h3>
            <p className="stat-number">
              {appointments?.filter(apt => {
                try {
                  const today = new Date().toDateString();
                  return new Date(apt?.appointmentDateTime).toDateString() === today;
                } catch {
                  return false;
                }
              }).length || 0}
            </p>
        </div>
          <div className="stat-card">
            <h3>Available Slots</h3>
            <p className="stat-number">{availabilitySlots?.filter(slot => !slot?.isBooked).length || 0}</p>
      </div>
        </div>

        {error && (
          <div className="error-message">
            <SafeText>{error}</SafeText>
            <button onClick={loadDashboardData} className="retry-btn">
              Retry
      </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="appointments-section">
        <div className="content-header">
          <h2>My Appointments</h2>
          <p>View and manage your scheduled appointments</p>
        </div>

        {appointmentsError && (
          <div className="error-message">
            <SafeText>{appointmentsError}</SafeText>
          </div>
        )}

        {!appointments || appointments.length === 0 ? (
          <div className="no-data">
            <p>No appointments found.</p>
            <button className="refresh-btn" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.map((appointment, index) => (
              <ErrorBoundary key={appointment?.appointmentId || index}>
                <div className="appointment-card">
                  <div className="appointment-details">
                    <h4>
                      <SafeText>Patient: {safeRender(appointment?.patientUser?.username, 'Unknown Patient')}</SafeText>
                    </h4>
                    <p><strong>Date:</strong> <SafeText>{safeDate(appointment?.appointmentDateTime)}</SafeText></p>
                    <p><strong>Time:</strong> <SafeText>{safeDateTime(appointment?.appointmentDateTime)}</SafeText></p>
                    <p><strong>Duration:</strong> <SafeText>{safeRender(appointment?.durationMinutes, '30')} minutes</SafeText></p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${safeRender(appointment?.status, 'unknown').toLowerCase()}`}>
                        <SafeText>{safeRender(appointment?.status, 'Unknown')}</SafeText>
                      </span>
                    </p>
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAvailability = () => (
    <ErrorBoundary>
      <div className="availability-section">
        <div className="content-header">
          <h2>My Availability</h2>
          <p>Manage your available time slots</p>
        </div>

        {slotsError && (
          <div className="error-message">
            <SafeText>{slotsError}</SafeText>
          </div>
        )}

        {!availabilitySlots || availabilitySlots.length === 0 ? (
          <div className="no-data">
            <p>No availability slots found.</p>
            <button className="refresh-btn" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="slots-list">
            {availabilitySlots.map((slot, index) => (
              <ErrorBoundary key={slot?.availabilitySlotId || index}>
                <div className="slot-card">
                  <div className="slot-details">
                    <h4><SafeText>{safeDate(slot?.slotDate)}</SafeText></h4>
                    <p><strong>Time:</strong> <SafeText>{safeRender(slot?.startTime)} - {safeRender(slot?.endTime)}</SafeText></p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${slot?.isBooked ? 'booked' : 'available'}`}>
                        <SafeText>{slot?.isBooked ? 'Booked' : 'Available'}</SafeText>
                      </span>
                    </p>
                    {slot?.notes && <p><strong>Notes:</strong> <SafeText>{safeRender(slot?.notes)}</SafeText></p>}
                  </div>
                  <div className="slot-actions">
                    {!slot?.isBooked && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteSlot(slot?.availabilitySlotId)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const AddAvailabilityForm = () => {
    const [formData, setFormData] = useState({
      slotDate: '',
      startTime: '',
      endTime: '',
      notes: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true);
      setFormError('');

      try {
        const response = await apiClient.post('/doctors/availability', formData);
        if (response.data.success) {
          alert('Availability slot added successfully!');
          setFormData({
            slotDate: '',
            startTime: '',
            endTime: '',
            notes: ''
          });
          loadDashboardData();
          setActiveTab('availability');
        }
      } catch (error) {
        console.error('Add availability error:', error);
        setFormError(error.response?.data?.message || 'Failed to add availability slot');
      } finally {
        setFormLoading(false);
      }
};

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <ErrorBoundary>
        <div className="add-availability-section">
          <div className="content-header">
            <h2>Add Availability</h2>
            <p>Create new time slots for patient appointments</p>
          </div>

          <form onSubmit={handleSubmit} className="availability-form">
            {formError && (
              <div className="error-message">
                <SafeText>{formError}</SafeText>
              </div>
            )}

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
                placeholder="Add any notes about this availability slot..."
                rows="3"
              />
            </div>

            <button type="submit" className="submit-btn" disabled={formLoading}>
              {formLoading ? 'Adding...' : 'Add Availability Slot'}
            </button>
          </form>
        </div>
      </ErrorBoundary>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'appointments':
        return renderAppointments();
      case 'availability':
        return renderAvailability();
      case 'add-availability':
        return <AddAvailabilityForm />;
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="doctor-dashboard">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <DashboardHeader 
        title="Doctor Portal" 
        subtitle={`Welcome back, Dr. ${safeRender(user?.username)}!`}
      />
      
      <div className="dashboard-layout">
        {/* Vertical Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>Navigation</h1>
          </div>
          
          <nav className="dashboard-nav">
            {navigationItems.map(item => (
              <div key={item.id} className="nav-item">
                <button
                  className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              </div>
            ))}
            
            {/* Logout Button */}
            <div className="nav-item nav-logout">
              <button
                className="nav-button logout-button"
                onClick={handleLogout}
              >
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="dashboard-main">
          <div className="dashboard-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
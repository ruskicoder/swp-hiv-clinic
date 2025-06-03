import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime, safeTime } from '../../utils/renderUtils';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Error states
  const [appointmentsError, setAppointmentsError] = useState('');
  const [doctorsError, setDoctorsError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    setAppointmentsError('');
    setDoctorsError('');

    try {
      console.log('Loading customer dashboard data...');
      
      // Initialize with empty arrays to prevent undefined errors
      setAppointments([]);
      setDoctors([]);
      
      // Load appointments
      try {
        const appointmentsRes = await apiClient.get('/appointments/patient/my-appointments');
        console.log('Raw appointments response:', appointmentsRes);
        
        if (appointmentsRes && appointmentsRes.data) {
          const appointmentsData = Array.isArray(appointmentsRes.data) ? appointmentsRes.data : [];
          console.log('Processed appointments:', appointmentsData);
          setAppointments(appointmentsData);
        }
      } catch (err) {
        console.error('Failed to load appointments:', err);
        setAppointments([]);
        setAppointmentsError('Failed to load appointments: ' + (err.message || 'Unknown error'));
      }

      // Load doctors
      try {
        const doctorsRes = await apiClient.get('/doctors');
        console.log('Raw doctors response:', doctorsRes);
        
        if (doctorsRes && doctorsRes.data) {
          const doctorsData = Array.isArray(doctorsRes.data) ? doctorsRes.data : [];
          console.log('Processed doctors:', doctorsData);
          setDoctors(doctorsData);
        }
      } catch (err) {
        console.error('Failed to load doctors:', err);
        setDoctors([]);
        setDoctorsError('Failed to load doctors: ' + (err.message || 'Unknown error'));
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, null, {
        params: { reason }
      });
      if (response.data.success) {
        alert('Appointment cancelled successfully');
        loadDashboardData();
      }
    } catch (error) {
      console.error('Cancel appointment error:', error);
      setError('Failed to cancel appointment');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'My Appointments', icon: '📅' },
    { id: 'doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
    { id: 'book-appointment', label: 'Book Appointment', icon: '➕' }
  ];

  const renderOverview = () => (
      <ErrorBoundary>
      <div className="overview-section">
          <div className="content-header">
          <h2>Patient Dashboard</h2>
          <p>Welcome back, {safeRender(user?.username)}! Manage your healthcare appointments and find doctors.</p>
          </div>

        {(appointmentsError || doctorsError) && (
              <div className="error-message">
            {appointmentsError && <div>{appointmentsError}</div>}
            {doctorsError && <div>{doctorsError}</div>}
              </div>
            )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <p className="stat-number">{appointments?.length || 0}</p>
            </div>
          <div className="stat-card">
            <h3>Upcoming Appointments</h3>
            <p className="stat-number">
              {appointments?.filter(apt => {
                try {
                  return new Date(apt?.appointmentDateTime) > new Date() && apt?.status === 'Scheduled';
                } catch {
                  return false;
                }
              }).length || 0}
            </p>
            </div>
          <div className="stat-card">
            <h3>Available Doctors</h3>
            <p className="stat-number">{doctors?.length || 0}</p>
            </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
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
            {appointmentsError}
          </div>
        )}

        {!appointments || appointments.length === 0 && !appointmentsError ? (
          <div className="no-data">
            <p>No appointments found.</p>
            <button 
              className="refresh-btn"
              onClick={loadDashboardData}
            >
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
                      Dr. {safeRender(appointment?.doctorUser?.username, 'Unknown Doctor')}
                  </h4>
                    <p><strong>Date:</strong> {safeDate(appointment?.appointmentDateTime)}</p>
                    <p><strong>Time:</strong> {safeDateTime(appointment?.appointmentDateTime)}</p>
                    <p><strong>Duration:</strong> {safeRender(appointment?.durationMinutes, '30')} minutes</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${safeRender(appointment?.status, 'unknown').toLowerCase()}`}>
                        {safeRender(appointment?.status, 'Unknown')}
                      </span>
                    </p>
                  </div>
                  <div className="appointment-actions">
                    {appointment?.status === 'Scheduled' && new Date(appointment?.appointmentDateTime) > new Date() && (
                      <button 
                        className="cancel-btn"
                        onClick={() => {
                          const reason = prompt('Please provide a reason for cancellation:');
                          if (reason && appointment?.appointmentId) {
                            handleCancelAppointment(appointment.appointmentId, reason);
                          }
                        }}
              >
                        Cancel
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

  const renderDoctors = () => (
    <ErrorBoundary>
      <div className="doctors-section">
        <div className="content-header">
          <h2>Available Doctors</h2>
          <p>Find and connect with healthcare professionals</p>
        </div>

        {doctorsError && (
          <div className="error-message">
            {doctorsError}
          </div>
        )}

        {!doctors || doctors.length === 0 && !doctorsError ? (
          <div className="no-data">
            <p>No doctors available.</p>
            <button 
              className="refresh-btn"
              onClick={loadDashboardData}
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map((doctor, index) => (
              <ErrorBoundary key={doctor?.userId || index}>
                <div className="doctor-card">
                  <h4>
                    Dr. {safeRender(doctor?.username, 'Unknown Doctor')}
                  </h4>
                  <p>
                    <strong>Email:</strong> 
                    {safeRender(doctor?.email, 'N/A')}
                  </p>
                  <p>
                    <strong>Status:</strong> 
                    {doctor?.isActive ? 'Available' : 'Unavailable'}
                  </p>
                  <button 
                    className="book-btn"
                    onClick={() => setActiveTab('book-appointment')}
                    disabled={!doctor?.isActive}
                  >
                    Book Appointment
                  </button>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const BookAppointmentForm = () => {
    const [formData, setFormData] = useState({
      doctorUserId: '',
      availabilitySlotId: '',
      durationMinutes: 30
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    const loadDoctorAvailability = async (doctorId) => {
      if (!doctorId) {
        setAvailableSlots([]);
        return;
      }
      setSlotsLoading(true);
      try {
        const response = await apiClient.get(`/doctors/${doctorId}/available-slots`);
        if (response.data) {
          const slots = Array.isArray(response.data) ? response.data : [];
          // Filter slots to only show future dates
          const futureSlots = slots.filter(slot => {
            const slotDateTime = new Date(`${slot.slotDate}T${slot.startTime}`);
            return slotDateTime > new Date() && !slot.isBooked;
          });
          setAvailableSlots(futureSlots);
        }
      } catch (error) {
        console.error('Failed to load doctor availability:', error);
        setFormError('Failed to load doctor availability');
        setAvailableSlots([]);
      } finally {
        setSlotsLoading(false);
      }
};

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true);
      setFormError('');

      if (!formData.availabilitySlotId) {
        setFormError('Please select an available time slot');
        setFormLoading(false);
        return;
      }

      try {
        // Find the selected slot to get the appointment date/time
        const selectedSlot = availableSlots.find(slot => 
          slot.availabilitySlotId === parseInt(formData.availabilitySlotId)
        );

        if (!selectedSlot) {
          setFormError('Selected time slot is no longer available');
          setFormLoading(false);
          return;
        }

        const appointmentDateTime = `${selectedSlot.slotDate}T${selectedSlot.startTime}`;

        const bookingData = {
          doctorUserId: parseInt(formData.doctorUserId),
          appointmentDateTime: appointmentDateTime,
          durationMinutes: formData.durationMinutes,
          availabilitySlotId: parseInt(formData.availabilitySlotId)
    };

        const response = await apiClient.post('/appointments/book', bookingData);
        if (response.data.success) {
          alert('Appointment booked successfully!');
          setFormData({
            doctorUserId: '',
            availabilitySlotId: '',
            durationMinutes: 30
          });
          setAvailableSlots([]);
          loadDashboardData();
          setActiveTab('appointments');
        }
      } catch (error) {
        console.error('Book appointment error:', error);
        setFormError(error.response?.data?.message || 'Failed to book appointment');
      } finally {
        setFormLoading(false);
      }
  };

    const handleDoctorChange = (e) => {
      const doctorId = e.target.value;
      setFormData({
        ...formData,
        doctorUserId: doctorId,
        availabilitySlotId: '' // Reset slot selection when doctor changes
      });
      
      if (doctorId) {
        loadDoctorAvailability(doctorId);
      } else {
        setAvailableSlots([]);
      }
  };

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    const formatSlotDisplay = (slot) => {
      const date = new Date(slot.slotDate);
      const startTime = safeTime(slot.startTime);
      const endTime = safeTime(slot.endTime);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      return `${dayName}, ${dateStr} - ${startTime} to ${endTime}`;
};

    return (
      <ErrorBoundary>
        <div className="book-appointment-section">
          <div className="content-header">
            <h2>Book New Appointment</h2>
            <p>Schedule an appointment with your preferred doctor during their available times</p>
          </div>

          <form onSubmit={handleSubmit} className="book-appointment-form">
            {formError && (
              <div className="error-message">
                {formError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="doctorUserId">Select Doctor</label>
              <select
                id="doctorUserId"
                name="doctorUserId"
                value={formData.doctorUserId}
                onChange={handleDoctorChange}
                required
              >
                <option value="">Choose a doctor...</option>
                {doctors?.filter(doctor => doctor?.isActive).map((doctor, index) => (
                  <option key={doctor?.userId || index} value={doctor?.userId}>
                    Dr. {safeRender(doctor?.username, 'Unknown Doctor')}
                  </option>
                ))}
              </select>
            </div>

            {formData.doctorUserId && (
              <div className="form-group">
                <label htmlFor="availabilitySlotId">Available Time Slots</label>
                {slotsLoading ? (
                  <div className="loading-slots">Loading available times...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="no-slots">
                    No available time slots found for this doctor. Please try another doctor or check back later.
                  </div>
                ) : (
                  <select
                    id="availabilitySlotId"
                    name="availabilitySlotId"
                    value={formData.availabilitySlotId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select an available time...</option>
                    {availableSlots.map((slot, index) => (
                      <option key={slot?.availabilitySlotId || index} value={slot?.availabilitySlotId}>
                        {formatSlotDisplay(slot)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="durationMinutes">Duration (minutes)</label>
              <select
                id="durationMinutes"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <button type="submit" className="submit-btn" disabled={formLoading || !formData.availabilitySlotId}>
              {formLoading ? 'Booking...' : 'Book Appointment'}
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
      case 'doctors':
        return renderDoctors();
      case 'book-appointment':
        return <BookAppointmentForm />;
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="customer-dashboard">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <DashboardHeader 
        title="Patient Portal" 
        subtitle={`Welcome back, ${safeRender(user?.username)}!`}
      />
      
      <div className="dashboard-layout">
        {/* Logo in top left */}
        <div className="dashboard-logo">
          <Link to="/" className="nav-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            HIV Medical System
          </Link>
        </div>

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

export default CustomerDashboard;

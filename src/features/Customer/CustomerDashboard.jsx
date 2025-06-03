import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import { SafeText } from '../../utils/SafeComponents';
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
          <p>Welcome back, <SafeText>{safeRender(user?.username)}</SafeText>! Manage your healthcare appointments and find doctors.</p>
          </div>

        {(appointmentsError || doctorsError) && (
              <div className="error-message">
            {appointmentsError && <div><SafeText>{appointmentsError}</SafeText></div>}
            {doctorsError && <div><SafeText>{doctorsError}</SafeText></div>}
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
                      <SafeText>Dr. {safeRender(appointment?.doctorUser?.username, 'Unknown Doctor')}</SafeText>
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
            <SafeText>{doctorsError}</SafeText>
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
                    <SafeText>Dr. {safeRender(doctor?.username, 'Unknown Doctor')}</SafeText>
                  </h4>
                  <p>
                    <strong>Email:</strong> 
                    <SafeText>{safeRender(doctor?.email, 'N/A')}</SafeText>
                  </p>
                  <p>
                    <strong>Status:</strong> 
                    <SafeText>{doctor?.isActive ? 'Available' : 'Unavailable'}</SafeText>
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
      appointmentDateTime: '',
      durationMinutes: 30
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true);
      setFormError('');

      try {
        const response = await apiClient.post('/appointments/book', formData);
        if (response.data.success) {
          alert('Appointment booked successfully!');
          setFormData({
            doctorUserId: '',
            appointmentDateTime: '',
            durationMinutes: 30
          });
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

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <ErrorBoundary>
        <div className="book-appointment-section">
          <div className="content-header">
            <h2>Book New Appointment</h2>
            <p>Schedule an appointment with your preferred doctor</p>
          </div>

          <form onSubmit={handleSubmit} className="book-appointment-form">
            {formError && (
              <div className="error-message">
                <SafeText>{formError}</SafeText>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="doctorUserId">Select Doctor</label>
              <select
                id="doctorUserId"
                name="doctorUserId"
                value={formData.doctorUserId}
                onChange={handleChange}
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

            <div className="form-group">
              <label htmlFor="appointmentDateTime">Date & Time</label>
              <input
                type="datetime-local"
                id="appointmentDateTime"
                name="appointmentDateTime"
                value={formData.appointmentDateTime}
                onChange={handleChange}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>

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

            <button type="submit" className="submit-btn" disabled={formLoading}>
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

export default CustomerDashboard;

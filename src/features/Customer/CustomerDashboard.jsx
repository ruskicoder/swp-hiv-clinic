
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import UnifiedCalendar from '../../components/schedule/UnifiedCalendar';
import ErrorBoundary from '../../components/ErrorBoundary';
import { formatDateTimeForAPI, createBookingData, validateBookingData, safeFormatDate, safeFormatTime } from '../../utils/dateUtils';
import { safeRender, safeDate, safeDateTime, safeTime } from '../../utils/renderUtils';
import './CustomerDashboard.css';

const SIDEBAR_OPTIONS = [
  { 
    key: 'overview', 
    label: 'Dashboard Overview',
    icon: '📊'
  },
  { 
    key: 'appointments', 
    label: 'My Appointments',
    icon: '📅'
  },
  { 
    key: 'doctors', 
    label: 'Find Doctors',
    icon: '👨‍⚕️'
  },
  { 
    key: 'record', 
    label: 'Medical Record',
    icon: '📋'
  },
];

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientRecord, setPatientRecord] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [appointmentsRes, doctorsRes] = await Promise.all([
        apiClient.get('/appointments/patient/my-appointments'),
        apiClient.get('/doctors')
      ]);

      setAppointments(appointmentsRes.data || []);
      setDoctors(doctorsRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load patient record
  const loadPatientRecord = async () => {
    try {
      const response = await apiClient.get('/patient-records/my-record');
      setPatientRecord(response.data);
    } catch (err) {
      console.error('Error loading patient record:', err);
    }
  };

  // Load ARV treatments
  const loadARVTreatments = async () => {
    try {
      const response = await apiClient.get('/arv-treatments/my-treatments');
      setArvTreatments(response.data || []);
    } catch (err) {
      console.error('Error loading ARV treatments:', err);
    }
  };

  // Load doctor slots
  const loadDoctorSlots = async (doctorId) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/doctors/${doctorId}/available-slots`);
      setDoctorSlots(response.data || []);
    } catch (err) {
      console.error('Error loading doctor slots:', err);
      setError('Failed to load doctor availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking a doctor
  const handleBookDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setActiveTab('booking');
    await loadDoctorSlots(doctor.userId);
  };

  // Enhanced slot booking with better error handling
  const handleBookSlot = async (slotData) => {
    if (!selectedDoctor || !slotData) {
      setError('Missing doctor or slot information');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Booking slot with data:', slotData);

      // Create properly formatted booking data
      const bookingData = createBookingData(slotData, selectedDoctor.userId);

      console.log('Formatted booking data:', bookingData);

      // Validate booking data
      const validation = validateBookingData(bookingData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const response = await apiClient.post('/appointments/book', bookingData);

      if (response.data && response.data.success !== false) {
        alert('Appointment booked successfully!');
        setActiveTab('appointments');
        await loadDashboardData();
      } else {
        throw new Error(response.data?.message || 'Failed to book appointment');
      }
    } catch (err) {
      console.error('Error booking appointment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to book appointment';
      setError(errorMessage);
      alert(`Booking failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling booking
  const handleCancelBooking = async (appointmentId, reason = '') => {
    try {
      setLoading(true);
      const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, null, {
        params: { reason }
      });

      if (response.data && response.data.success !== false) {
        alert('Appointment cancelled successfully!');
        await loadDashboardData();
      } else {
        throw new Error(response.data?.message || 'Failed to cancel appointment');
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to cancel appointment';
      setError(errorMessage);
      alert(`Cancellation failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle saving patient record
  const handleSavePatientRecord = async (recordData) => {
    try {
      const response = await apiClient.put('/patient-records/my-record', recordData);
      if (response.data && response.data.success !== false) {
        alert('Patient record updated successfully!');
        await loadPatientRecord();
      } else {
        throw new Error(response.data?.message || 'Failed to update record');
      }
    } catch (err) {
      console.error('Error saving patient record:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to save patient record';
      alert(`Save failed: ${errorMessage}`);
    }
  };

  // Handle uploading image
  const handleUploadImage = async (base64Image) => {
    try {
      console.debug('Starting image upload with data:', {
        dataLength: base64Image?.length,
        dataStart: base64Image?.substring(0, 50) + '...'
      });

      const response = await apiClient.post('/patient-records/upload-image', {
        imageData: base64Image
      });

      console.debug('Image upload response:', {
        success: response.data?.success,
        message: response.data?.message
      });

      if (response.data?.success) {
        await loadPatientRecord();
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', {
        message: err.message,
        responseData: err.response?.data,
        status: err.response?.status
      });
      throw new Error(err.response?.data?.message || err.message || 'Failed to upload image');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
    if (activeTab === 'record') {
      loadPatientRecord();
      loadARVTreatments();
    }
  }, [activeTab]);

  // Render overview section
  const renderOverview = () => (
    <div>
      <div className="welcome-section">
        <div className="welcome-text">
          <h1>Welcome back, {safeRender(user?.username)}!</h1>
          <p>Manage your healthcare appointments and medical records in one place</p>
        </div>
        <div className="user-avatar">
          <div className="avatar-circle">
            {safeRender(user?.username?.charAt(0)?.toUpperCase())}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <div className="stat-number">{appointments?.length || 0}</div>
        </div>

        <div className="stat-card">
          <h3>Upcoming</h3>
          <div className="stat-number">
            {appointments?.filter(apt => 
              apt.status === 'Scheduled' && 
              new Date(apt.appointmentDateTime) > new Date()
            ).length || 0}
          </div>
        </div>

        <div className="stat-card">
          <h3>Available Doctors</h3>
          <div className="stat-number">{doctors?.length || 0}</div>
        </div>

        <div className="stat-card">
          <h3>ARV Treatments</h3>
          <div className="stat-number">{arvTreatments?.length || 0}</div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={loadDashboardData} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="recent-appointments">
        <h3>Recent Appointments</h3>
        {appointments?.slice(0, 3).map(appointment => (
          <div key={appointment.appointmentId} className="appointment-item">
            <div className="appointment-avatar">
              <span>👨‍⚕️</span>
            </div>
            <div className="appointment-info">
              <h4>Dr. {safeRender(appointment.doctorUser?.firstName)} {safeRender(appointment.doctorUser?.lastName)}</h4>
              <p>{safeDate(appointment.appointmentDateTime)} at {safeTime(appointment.appointmentDateTime)}</p>
              <span className="specialty">{safeRender(appointment.doctorUser?.specialty)}</span>
            </div>
            <div className="appointment-status">
              <span className={`status ${appointment.status?.toLowerCase()}`}>
                {safeRender(appointment.status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render appointments section
  const renderAppointments = () => (
    <div>
      <div className="section-header">
        <h2>My Appointments</h2>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={loadDashboardData} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="appointments-list">
        {appointments?.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">📅</div>
            <h3>No appointments found</h3>
            <p>You haven't booked any appointments yet</p>
            <button onClick={() => setActiveTab('doctors')} className="primary-btn">
              Book Your First Appointment
            </button>
          </div>
        ) : (
          appointments.map(appointment => (
            <div key={appointment.appointmentId} className="appointment-card">
              <div className="appointment-left">
                <div className="doctor-avatar">
                  👨‍⚕️
                </div>
                <div className="appointment-details">
                  <h4>Dr. {safeRender(appointment.doctorUser?.firstName)} {safeRender(appointment.doctorUser?.lastName)}</h4>
                  <div className="appointment-meta">
                    <span className="date-time">
                      📅 {safeDate(appointment.appointmentDateTime)} at {safeTime(appointment.appointmentDateTime)}
                    </span>
                    <span className="duration">⏱️ {appointment.durationMinutes || 30} minutes</span>
                    <span className="specialty">🏥 {safeRender(appointment.doctorUser?.specialty)}</span>
                  </div>
                  {appointment.appointmentNotes && (
                    <div className="appointment-notes">
                      <strong>Notes:</strong> {safeRender(appointment.appointmentNotes)}
                    </div>
                  )}
                </div>
              </div>
              <div className="appointment-right">
                <span className={`status ${appointment.status?.toLowerCase()}`}>
                  {safeRender(appointment.status)}
                </span>
                {appointment.status === 'Scheduled' && new Date(appointment.appointmentDateTime) > new Date() && (
                  <button
                    onClick={() => {
                      const reason = prompt('Please provide a reason for cancellation (optional):');
                      if (reason !== null) {
                        handleCancelBooking(appointment.appointmentId, reason);
                      }
                    }}
                    className="cancel-btn"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render doctors section
  const renderDoctors = () => (
    <div>
      <div className="section-header">
        <h2>Available Doctors</h2>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={loadDashboardData} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="doctors-grid">
        {doctors?.length === 0 ? (
          <div className="no-data">
            <div className="no-data-icon">👨‍⚕️</div>
            <h3>No doctors available</h3>
            <p>Please check back later or contact support</p>
            <button onClick={loadDashboardData} className="primary-btn">
              Refresh
            </button>
          </div>
        ) : (
          doctors.map(doctor => (
            <div key={doctor.userId} className="doctor-card">
              <div className="doctor-header">
                <div className="doctor-avatar">👨‍⚕️</div>
                <div className="doctor-info">
                  <h4>Dr. {safeRender(doctor.firstName)} {safeRender(doctor.lastName)}</h4>
                  <span className="specialty">{safeRender(doctor.specialty)}</span>
                </div>
              </div>
              <div className="doctor-details">
                <p><span className="label">Email:</span> {safeRender(doctor.email)}</p>
              </div>
              <button
                onClick={() => handleBookDoctor(doctor)}
                className="primary-btn"
                disabled={loading}
              >
                Book Appointment
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Render booking section
  const renderBookAppointment = () => (
    <div>
      <div className="section-header">
        <h2>Book Appointment</h2>
        {selectedDoctor && (
          <p>Booking with Dr. {safeRender(selectedDoctor.firstName)} {safeRender(selectedDoctor.lastName)}</p>
        )}
      </div>

      {error && (
        <div className="error-message">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {selectedDoctor && (
        <UnifiedCalendar
          doctorSlots={doctorSlots}
          onBookSlot={handleBookSlot}
          loading={loading}
        />
      )}
    </div>
  );

  // Render patient record section
  const renderPatientRecord = () => (
    <div>
      <div className="section-header">
        <h2>My Medical Record</h2>
      </div>

      <PatientRecordSection
        patientRecord={patientRecord}
        onSave={handleSavePatientRecord}
        onUploadImage={handleUploadImage}
      />

      {arvTreatments?.length > 0 && (
        <div className="arv-treatments">
          <h3>ARV Treatment History</h3>
          <div className="treatments-list">
            {arvTreatments.map(treatment => (
              <div key={treatment.treatmentId} className="treatment-card">
                <div className="treatment-header">
                  <h4>{safeRender(treatment.regimen)}</h4>
                  <span className="adherence">{safeRender(treatment.adherence)}</span>
                </div>
                <div className="treatment-details">
                  <p><strong>Start Date:</strong> {safeDate(treatment.startDate)}</p>
                  {treatment.endDate && (
                    <p><strong>End Date:</strong> {safeDate(treatment.endDate)}</p>
                  )}
                  {treatment.notes && (
                    <p><strong>Notes:</strong> {safeRender(treatment.notes)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading && !appointments.length && !doctors.length) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'appointments':
        return renderAppointments();
      case 'doctors':
        return renderDoctors();
      case 'booking':
        return renderBookAppointment();
      case 'record':
        return renderPatientRecord();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="customer-dashboard">
      <DashboardHeader title="Patient Dashboard" />
      
      <div className="dashboard-container">
        <div className="dashboard-layout">
          <aside className="customer-sidebar">
            <div className="sidebar-title">Navigation Menu</div>
            <nav className="sidebar-nav">
              {SIDEBAR_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  className={`sidebar-option ${activeTab === opt.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(opt.key)}
                >
                  <span className="sidebar-icon">{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
              ))}
            </nav>
          </aside>

          <main className="dashboard-main">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;

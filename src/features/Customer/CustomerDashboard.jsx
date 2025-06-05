import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import WeeklySchedule from '../../components/schedule/WeeklySchedule';
import PatientRecordSection from '../../components/PatientRecordSection';
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
  const [patientRecord, setPatientRecord] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);
  const [allSlots, setAllSlots] = useState([]);

  // Error states
  const [appointmentsError, setAppointmentsError] = useState('');
  const [doctorsError, setDoctorsError] = useState('');

  useEffect(() => {
    loadDashboardData();
    // Load patient record and ARV treatments
    loadPatientRecord();
    loadARVTreatments();
    loadAllSlots();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    setAppointmentsError('');
    setDoctorsError('');

    try {
      console.log('Loading customer dashboard data...');
      
      // Initialize with empty arrays
      setAppointments([]);
      setDoctors([]);
      
      // Load appointments and doctors concurrently
      const [appointmentsResult, doctorsResult] = await Promise.allSettled([
        apiClient.get('/appointments/patient/my-appointments'),
        apiClient.get('/admin/doctors')
      ]);

      // Handle appointments
      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.data) {
        const appointmentsData = Array.isArray(appointmentsResult.value.data) ? appointmentsResult.value.data : [];
        setAppointments(appointmentsData);
      } else {
        setAppointmentsError('Failed to load appointments');
      }

      // Handle doctors
      if (doctorsResult.status === 'fulfilled' && doctorsResult.value?.data) {
        const doctorsData = Array.isArray(doctorsResult.value.data) ? doctorsResult.value.data : [];
        setDoctors(doctorsData);
      } else {
        setDoctorsError('Failed to load doctors');
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientRecord = async () => {
    try {
      const res = await apiClient.get('/patient-records/my-record');
      setPatientRecord(res.data);
    } catch (e) {
      setPatientRecord(null);
    }
  };

  const loadARVTreatments = async () => {
    try {
      const res = await apiClient.get('/arv-treatments/my-treatments');
      setArvTreatments(res.data || []);
    } catch (e) {
      setArvTreatments([]);
    }
  };

  const loadAllSlots = async () => {
    try {
      const res = await apiClient.get('/doctors/availability/all-slots');
      setAllSlots(res.data || []);
    } catch (e) {
      setAllSlots([]);
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

  const handleSavePatientRecord = async (data) => {
    try {
      await apiClient.put('/patient-records/my-record', data);
      loadPatientRecord();
    } catch (e) {
      throw new Error('Failed to save patient record');
    }
  };

  const handleUploadImage = async (base64Image) => {
    try {
      await apiClient.post('/patient-records/upload-image', { image: base64Image });
      loadPatientRecord();
    } catch (e) {
      console.error('Image upload error:', e);
      alert('Failed to upload image');
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'My Appointments', icon: '📅' },
    { id: 'doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
    { id: 'book-appointment', label: 'Book Appointment', icon: '📝' },
    { id: 'record', label: 'My Record', icon: '📋' }
  ];

  const renderOverview = () => (
    <ErrorBoundary>
      <div className="overview-section">
        <div className="content-header">
          <h2>Patient Dashboard</h2>
          <p>Welcome back, {user?.firstName || user?.username || 'Patient'}</p>
        </div>

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
                  const now = new Date();
                  return new Date(apt?.appointmentDateTime) > now && apt?.status === 'Scheduled';
                } catch {
                  return false;
                }
              }).length || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Available Doctors</h3>
            <p className="stat-number">{doctors?.filter(doc => doc?.isActive).length || 0}</p>
          </div>
        </div>

        {(appointmentsError || doctorsError) && (
          <div className="error-message">
            {appointmentsError && <div>{appointmentsError}</div>}
            {doctorsError && <div>{doctorsError}</div>}
          </div>
        )}

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
                    <h4>Dr. {safeRender(appointment?.doctorName)}</h4>
                    <p><strong>Date:</strong> {safeDate(appointment?.appointmentDateTime)}</p>
                    <p><strong>Time:</strong> {safeTime(appointment?.appointmentDateTime)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${appointment?.status?.toLowerCase()}`}>
                        {safeRender(appointment?.status)}
                      </span>
                    </p>
                    {appointment?.notes && <p><strong>Notes:</strong> {safeRender(appointment?.notes)}</p>}
                  </div>
                  <div className="appointment-actions">
                    {appointment?.status === 'Scheduled' && (
                      <button 
                        className="cancel-btn"
                        onClick={() => {
                          const reason = prompt('Please provide a reason for cancellation:');
                          if (reason) {
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
          <h2>Find Doctors</h2>
          <p>Browse available doctors and book appointments</p>
        </div>

        {doctorsError && (
          <div className="error-message">
            {doctorsError}
          </div>
        )}

        {!doctors || doctors.length === 0 ? (
          <div className="no-data">
            <p>No doctors found.</p>
            <button className="refresh-btn" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="doctors-grid">
            {doctors.map((doctor, index) => (
              <ErrorBoundary key={doctor?.userId || index}>
                <div className="doctor-card">
                  <h4>Dr. {safeRender(doctor?.firstName)} {safeRender(doctor?.lastName)}</h4>
                  <p><strong>Email:</strong> {safeRender(doctor?.email)}</p>
                  <p><strong>Specialty:</strong> {safeRender(doctor?.specialty || 'General Practice')}</p>
                  <p><strong>Status:</strong> 
                    <span className={`status ${doctor?.isActive ? 'active' : 'inactive'}`}>
                      {doctor?.isActive ? 'Available' : 'Unavailable'}
                    </span>
                  </p>
                  <div className="doctor-actions">
                    <button 
                      className="book-btn"
                      onClick={() => setActiveTab('book-appointment')}
                      disabled={!doctor?.isActive}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const BookAppointmentForm = () => {
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [bookingError, setBookingError] = useState('');

    const handleSlotSelect = (slot) => {
      setSelectedSlot(slot);
    };

    const handleBookAppointment = async () => {
      if (!selectedSlot) {
        setBookingError('Please select a time slot');
        return;
      }

      setBookingLoading(true);
      setBookingError('');

      try {
        const bookingData = {
          doctorUserId: selectedSlot.doctorUserID,
          availabilitySlotId: selectedSlot.availabilitySlotID,
          appointmentDateTime: `${selectedSlot.slotDate}T${selectedSlot.startTime}`
        };

        await apiClient.post('/appointments/book', bookingData);
        
        alert('Appointment booked successfully!');
        setSelectedSlot(null);
        loadDashboardData();
        loadAllSlots();
        setActiveTab('appointments');
      } catch (error) {
        console.error('Booking error:', error);
        setBookingError('Failed to book appointment. Please try again.');
      } finally {
        setBookingLoading(false);
      }
    };

    return (
      <ErrorBoundary>
        <div className="book-appointment-section">
          <div className="content-header">
            <h2>Book Appointment</h2>
            <p>Select an available time slot to book your appointment</p>
          </div>

          {bookingError && (
            <div className="error-message">
              {bookingError}
            </div>
          )}

          <div className="booking-content">
            <WeeklySchedule
              availableSlots={allSlots}
              onSlotSelect={handleSlotSelect}
              selectedSlot={selectedSlot}
            />

            {selectedSlot && (
              <div className="booking-confirmation">
                <h3>Selected Appointment</h3>
                <div className="selected-slot-details">
                  <p><strong>Doctor:</strong> Dr. {selectedSlot.doctorFirstName} {selectedSlot.doctorLastName}</p>
                  <p><strong>Date:</strong> {safeDate(selectedSlot.slotDate)}</p>
                  <p><strong>Time:</strong> {selectedSlot.startTime} - {selectedSlot.endTime}</p>
                </div>
                <div className="booking-actions">
                  <button 
                    className="book-btn"
                    onClick={handleBookAppointment}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setSelectedSlot(null)}
                  >
                    Cancel Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  };

  const renderPatientRecord = () => (
    <ErrorBoundary>
      <PatientRecordSection
        record={patientRecord}
        onSave={handleSavePatientRecord}
        onImageUpload={handleUploadImage}
      />
      <div className="arv-treatments-section">
        <h3>ARV Treatment History</h3>
        {arvTreatments.length === 0 ? (
          <p>No ARV treatments recorded yet.</p>
        ) : (
          <div className="treatments-list">
            {arvTreatments.map((arv, idx) => (
              <div key={arv.arvTreatmentId || idx} className="treatment-card">
                <h4>{arv.regimen}</h4>
                <p><strong>Start Date:</strong> {safeDate(arv.startDate)}</p>
                <p><strong>End Date:</strong> {arv.endDate ? safeDate(arv.endDate) : 'Ongoing'}</p>
                <p><strong>Doctor:</strong> {arv.doctorName || 'Not specified'}</p>
                <p><strong>Adherence:</strong> {arv.adherence || 'Not specified'}</p>
                {arv.sideEffects && (
                  <p><strong>Side Effects:</strong> {arv.sideEffects}</p>
                )}
                {arv.notes && (
                  <p><strong>Notes:</strong> {arv.notes}</p>
                )}
                <p><strong>Status:</strong> 
                  <span className={`status ${arv.isActive ? 'active' : 'inactive'}`}>
                    {arv.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

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
      case 'record':
        return renderPatientRecord();
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
        title="Patient Dashboard" 
        subtitle={`Welcome, ${user?.firstName || user?.username || 'Patient'}`}
      />
      
      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>Patient Portal</h1>
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

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
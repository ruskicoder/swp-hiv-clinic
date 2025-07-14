import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import UnifiedCalendar from '../../components/schedule/UnifiedCalendar';
import ErrorBoundary from '../../components/ErrorBoundary';
import { createBookingData, validateBookingData } from '../../utils/dateUtils';
import { safeRender, safeDate, safeTime } from '../../utils/renderUtils';
import './CustomerDashboard.css';

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
    <ErrorBoundary>
      <div className="overview-content">
        <div className="content-header">
          <h2>Dashboard Overview</h2>
          <p>Welcome back, {safeRender(user?.username)}!</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <p className="stat-number">{appointments?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Upcoming Appointments</h3>
            <p className="stat-number">
              {appointments?.filter(apt => 
                apt.status === 'Scheduled' && 
                new Date(apt.appointmentDateTime) > new Date()
              ).length || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Available Doctors</h3>
            <p className="stat-number">{doctors?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>ARV Treatments</h3>
            <p className="stat-number">{arvTreatments?.length || 0}</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadDashboardData} className="refresh-btn">
              Retry
            </button>
          </div>
        )}

        <div className="recent-appointments">
          <h3>Recent Appointments</h3>
          {appointments?.slice(0, 3).map(appointment => (
            <div key={appointment.appointmentId} className="appointment-card">
              <div className="appointment-header">
                <h4>Dr. {safeRender(appointment.doctorUser?.firstName)} {safeRender(appointment.doctorUser?.lastName)}</h4>
                <span className={`status ${appointment.status?.toLowerCase()}`}>
                  {safeRender(appointment.status)}
                </span>
              </div>
              <div className="appointment-details">
                <p><strong>Date:</strong> {safeDate(appointment.appointmentDateTime)}</p>
                <p><strong>Time:</strong> {safeTime(appointment.appointmentDateTime)}</p>
                <p><strong>Specialty:</strong> {safeRender(appointment.doctorUser?.specialty)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );

  // Render appointments section
  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="appointments-content">
        <div className="content-header">
          <h2>My Appointments</h2>
          <p>View and manage your appointments</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadDashboardData} className="refresh-btn">
              Retry
            </button>
          </div>
        )}

        <div className="appointments-list">
          {appointments?.length === 0 ? (
            <div className="no-data">
              <p>No appointments found.</p>
              <button onClick={() => setActiveTab('doctors')} className="book-btn">
                Book Your First Appointment
              </button>
            </div>
          ) : (
            appointments.map(appointment => (
              <div key={appointment.appointmentId} className="appointment-card">
                <div className="appointment-header">
                  <h4>Dr. {safeRender(appointment.doctorUser?.firstName)} {safeRender(appointment.doctorUser?.lastName)}</h4>
                  <span className={`status ${appointment.status?.toLowerCase()}`}>
                    {safeRender(appointment.status)}
                  </span>
                </div>
                <div className="appointment-details">
                  <p><strong>Date:</strong> {safeDate(appointment.appointmentDateTime)}</p>
                  <p><strong>Time:</strong> {safeTime(appointment.appointmentDateTime)}</p>
                  <p><strong>Duration:</strong> {appointment.durationMinutes || 30} minutes</p>
                  <p><strong>Specialty:</strong> {safeRender(appointment.doctorUser?.specialty)}</p>
                  {appointment.appointmentNotes && (
                    <p><strong>Notes:</strong> {safeRender(appointment.appointmentNotes)}</p>
                  )}
                </div>
                <div className="appointment-actions">
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
                      Cancel Appointment
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  // Render doctors section
  const renderDoctors = () => (
    <ErrorBoundary>
      <div className="doctors-content">
        <div className="content-header">
          <h2>Available Doctors</h2>
          <p>Choose a doctor to book an appointment</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
            <button onClick={loadDashboardData} className="refresh-btn">
              Retry
            </button>
          </div>
        )}

        <div className="doctors-grid">
          {doctors?.length === 0 ? (
            <div className="no-data">
              <p>No doctors available at the moment.</p>
              <button onClick={loadDashboardData} className="refresh-btn">
                Refresh
              </button>
            </div>
          ) : (
            doctors.map(doctor => (
              <div key={doctor.userId} className="doctor-card">
                <h4>Dr. {safeRender(doctor.firstName)} {safeRender(doctor.lastName)}</h4>
                <p><strong>Specialty:</strong> {safeRender(doctor.specialty)}</p>
                <p><strong>Email:</strong> {safeRender(doctor.email)}</p>
                <button 
                  onClick={() => handleBookDoctor(doctor)}
                  className="book-btn"
                  disabled={loading}
                >
                  Book Appointment
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  // Render booking section
  const renderBookAppointment = () => (
    <ErrorBoundary>
      <div className="book-appointment-content">
        <div className="content-header">
          <h2>Book Appointment</h2>
          {selectedDoctor && (
            <p>Booking with Dr. {safeRender(selectedDoctor.firstName)} {safeRender(selectedDoctor.lastName)}</p>
          )}
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {selectedDoctor && (
          <UnifiedCalendar
            slots={doctorSlots}
            userRole="patient"
            currentUserId={user?.userId}
            doctorInfo={selectedDoctor}
            onBookSlot={handleBookSlot}
            onCancelBooking={handleCancelBooking}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  // Render patient record section
  const renderPatientRecord = () => (
    <ErrorBoundary>
      <div className="record-content">
        <div className="content-header" style={{width: '100%'}}>
          <h2>My Medical Record</h2>
          <p>View and update your medical information</p>
        </div>
        <div className="record-main">
          <PatientRecordSection
            record={patientRecord}
            onSave={handleSavePatientRecord}
            onImageUpload={handleUploadImage}
            isEditable={true}
          />

          {arvTreatments?.length > 0 && (
            <div className="arv-treatments-section">
              <h3>ARV Treatment History</h3>
              <div className="treatments-list">
                {arvTreatments.map(treatment => (
                  <div key={treatment.arvTreatmentId} className="treatment-card">
                    <h4>{safeRender(treatment.regimen)}</h4>
                    <p><strong>Start Date:</strong> {safeDate(treatment.startDate)}</p>
                    {treatment.endDate && (
                      <p><strong>End Date:</strong> {safeDate(treatment.endDate)}</p>
                    )}
                    <p><strong>Adherence:</strong> {safeRender(treatment.adherence)}</p>
                    {treatment.notes && (
                      <p><strong>Notes:</strong> {safeRender(treatment.notes)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading && !appointments.length && !doctors.length) {
      return (
        <div className="loading">
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
      <DashboardHeader 
        user={user} 
        onLogout={handleLogout}
        title="Patient Dashboard"
      />
      
      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>Patient Portal</h1>
            <p>Manage your healthcare</p>
          </div>
          
          <nav className="dashboard-nav">
            <div className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <span className="nav-icon">📊</span>
                Overview
              </button>
            </div>
            <div className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'appointments' ? 'active' : ''}`}
                onClick={() => setActiveTab('appointments')}
              >
                <span className="nav-icon">📅</span>
                My Appointments
              </button>
            </div>
            <div className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'doctors' ? 'active' : ''}`}
                onClick={() => setActiveTab('doctors')}
              >
                <span className="nav-icon">👨‍⚕️</span>
                Find Doctors
              </button>
            </div>
            <div className="nav-item">
              <button 
                className={`nav-button ${activeTab === 'record' ? 'active' : ''}`}
                onClick={() => setActiveTab('record')}
              >
                <span className="nav-icon">📋</span>
                Medical Record
              </button>
            </div>
          </nav>
        </div>

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
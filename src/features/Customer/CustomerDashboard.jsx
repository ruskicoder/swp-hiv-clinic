import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import UnifiedCalendar from '../../components/schedule/UnifiedCalendar';
import ErrorBoundary from '../../components/ErrorBoundary';
import { safeRender, safeDate, safeDateTime, safeTime } from '../../utils/renderUtils';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientRecord, setPatientRecord] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);

  // Helper function to format date for API
  const formatDateTimeForAPI = (date, time) => {
    try {
      // Ensure we have valid date and time
      if (!date || !time) {
        throw new Error('Date and time are required');
      }

      let dateStr;
      if (date instanceof Date) {
        // Format date as YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else if (typeof date === 'string') {
        // Assume it's already in YYYY-MM-DD format or convert it
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
      } else {
        throw new Error('Invalid date format');
      }

      // Ensure time is in HH:mm:ss format
      let timeStr = time;
      if (time.length === 5) { // HH:mm format
        timeStr = time + ':00';
      }

      // Combine date and time in ISO format
      const dateTimeStr = `${dateStr}T${timeStr}`;
      
      console.log('Formatted datetime for API:', dateTimeStr);
      return dateTimeStr;
    } catch (error) {
      console.error('Error formatting date/time:', error);
      throw new Error('Failed to format date/time for API');
    }
  };

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, doctorsRes] = await Promise.allSettled([
        apiClient.get('/appointments/patient/my-appointments'),
        apiClient.get('/doctors')
      ]);

      if (appointmentsRes.status === 'fulfilled') {
        setAppointments(appointmentsRes.value.data || []);
      } else {
        console.error('Failed to load appointments:', appointmentsRes.reason);
      }

      if (doctorsRes.status === 'fulfilled') {
        setDoctors(doctorsRes.value.data || []);
      } else {
        console.error('Failed to load doctors:', doctorsRes.reason);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load patient record
  const loadPatientRecord = async () => {
    try {
      const response = await apiClient.get('/patient-records/my-record');
      setPatientRecord(response.data);
    } catch (error) {
      console.error('Error loading patient record:', error);
    }
  };

  // Load ARV treatments
  const loadARVTreatments = async () => {
    try {
      const response = await apiClient.get('/arv-treatments/my-treatments');
      setArvTreatments(response.data || []);
    } catch (error) {
      console.error('Error loading ARV treatments:', error);
    }
  };

  // Load doctor slots for booking
  const loadDoctorSlots = async (doctorId) => {
    try {
      const response = await apiClient.get(`/doctors/${doctorId}/available-slots`);
      setDoctorSlots(response.data || []);
    } catch (error) {
      console.error('Error loading doctor slots:', error);
      setDoctorSlots([]);
    }
  };

  // Handle doctor selection for booking
  const handleBookDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    loadDoctorSlots(doctor.userId);
    setActiveTab('book-appointment');
  };

  // Handle appointment booking
  const handleBookSlot = async (slot) => {
    try {
      if (!selectedDoctor || !slot) {
        throw new Error('Missing required booking information');
      }

      console.log('Booking slot:', slot);
      console.log('Selected doctor:', selectedDoctor);

      // Format the appointment date/time properly
      const appointmentDateTime = formatDateTimeForAPI(slot.slotDate, slot.startTime);

      const bookingData = {
        doctorUserId: selectedDoctor.userId,
        availabilitySlotId: slot.availabilitySlotId,
        appointmentDateTime: appointmentDateTime,
        durationMinutes: slot.durationMinutes || 30
      };

      console.log('Sending booking data:', bookingData);

      const response = await apiClient.post('/appointments/book', bookingData);

      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to book appointment');
      }

      alert('Appointment booked successfully!');
      await loadDashboardData();
      await loadDoctorSlots(selectedDoctor.userId);
      setActiveTab('appointments');
      return { success: true };

    } catch (error) {
      console.error('Error booking appointment:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to book appointment');
    }
  };

  // Handle appointment cancellation
  const handleCancelBooking = async (appointmentId, reason) => {
    try {
      const response = await apiClient.put(`/appointments/${appointmentId}/cancel`, null, {
        params: { reason }
      });

      if (response.data.success) {
        alert('Appointment cancelled successfully!');
        await loadDashboardData();
        if (selectedDoctor) {
          await loadDoctorSlots(selectedDoctor.userId);
        }
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw new Error('Failed to cancel appointment. Please try again.');
    }
  };

  // Handle patient record save
  const handleSavePatientRecord = async (recordData) => {
    try {
      const response = await apiClient.put('/patient-records/my-record', recordData);
      if (response.data.success) {
        alert('Patient record updated successfully');
        await loadPatientRecord();
      }
    } catch (error) {
      console.error('Error saving patient record:', error);
      alert('Failed to save patient record');
    }
  };

  // Handle image upload
  const handleUploadImage = async (imageData) => {
    try {
      const response = await apiClient.post('/patient-records/upload-image', {
        image: imageData
      });
      if (response.data.success) {
        alert('Image uploaded successfully');
        await loadPatientRecord();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
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
    loadPatientRecord();
    loadARVTreatments();
  }, []);

  // Navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'My Appointments', icon: '📅' },
    { id: 'doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
    { id: 'book-appointment', label: 'Book Appointment', icon: '📝' },
    { id: 'record', label: 'My Record', icon: '📋' }
  ];

  // Render overview
  const renderOverview = () => {
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.appointmentDateTime) > new Date() && apt.status === 'Scheduled'
    );

    return (
      <div className="overview-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{appointments.length}</h3>
            <p>Total Appointments</p>
          </div>
          <div className="stat-card">
            <h3>{upcomingAppointments.length}</h3>
            <p>Upcoming Appointments</p>
          </div>
          <div className="stat-card">
            <h3>{arvTreatments.length}</h3>
            <p>ARV Treatments</p>
          </div>
        </div>

        <div className="recent-appointments">
          <h3>Upcoming Appointments</h3>
          {upcomingAppointments.length > 0 ? (
            <div className="appointments-list">
              {upcomingAppointments.slice(0, 3).map(appointment => (
                <div key={appointment.appointmentId} className="appointment-item">
                  <div className="appointment-info">
                    <p><strong>Doctor:</strong> Dr. {appointment.doctorUser?.firstName} {appointment.doctorUser?.lastName}</p>
                    <p><strong>Date:</strong> {safeDateTime(appointment.appointmentDateTime)}</p>
                    <p><strong>Status:</strong> {appointment.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No upcoming appointments. <button className="link-btn" onClick={() => setActiveTab('doctors')}>Book an appointment</button></p>
          )}
        </div>
      </div>
    );
  };

  // Render appointments
  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="appointments-content">
        <h3>My Appointments</h3>
        {appointments.length > 0 ? (
          <div className="appointments-list">
            {appointments.map((appointment, index) => (
              <ErrorBoundary key={appointment?.appointmentId || index}>
                <div className="appointment-card">
                  <div className="appointment-details">
                    <h4>
                      Dr. {safeRender(appointment?.doctorUser?.firstName)} {safeRender(appointment?.doctorUser?.lastName)}
                    </h4>
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
                            handleCancelBooking(appointment.appointmentId, reason);
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
        ) : (
          <div className="no-data">
            <p>No appointments found.</p>
            <button className="btn-primary" onClick={() => setActiveTab('doctors')}>
              Book Your First Appointment
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  // Render doctors
  const renderDoctors = () => (
    <ErrorBoundary>
      <div className="doctors-content">
        <h3>Available Doctors</h3>
        {doctors.length > 0 ? (
          <div className="doctors-grid">
            {doctors.map(doctor => (
              <div key={doctor.userId} className="doctor-card">
                <div className="doctor-info">
                  <h4>Dr. {safeRender(doctor.firstName)} {safeRender(doctor.lastName)}</h4>
                  <p><strong>Specialty:</strong> {safeRender(doctor.specialty) || 'General Practice'}</p>
                  <p><strong>Email:</strong> {safeRender(doctor.email)}</p>
                </div>
                <div className="doctor-actions">
                  <button 
                    className="book-btn"
                    onClick={() => handleBookDoctor(doctor)}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>No doctors available at the moment.</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  // Render booking interface
  const renderBookAppointment = () => (
    <ErrorBoundary>
      <div className="book-appointment-content">
        <div className="content-header">
          <h3>Book Appointment</h3>
          {selectedDoctor ? (
            <p>Booking with Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</p>
          ) : (
            <p>Please select a doctor first</p>
          )}
        </div>

        {selectedDoctor ? (
          <UnifiedCalendar
            slots={doctorSlots}
            userRole="patient"
            currentUserId={user?.userId}
            doctorInfo={selectedDoctor}
            onBookSlot={handleBookSlot}
            onCancelBooking={handleCancelBooking}
          />
        ) : (
          <div className="no-doctor-selected">
            <p>No doctor selected for booking.</p>
            <button 
              className="btn-primary"
              onClick={() => setActiveTab('doctors')}
            >
              Select a Doctor
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  // Render patient record
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

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'appointments':
        return renderAppointments();
      case 'doctors':
        return renderDoctors();
      case 'book-appointment':
        return renderBookAppointment();
      case 'record':
        return renderPatientRecord();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="customer-dashboard">
      <DashboardHeader 
        user={user} 
        onLogout={handleLogout}
        title="Patient Dashboard"
      />

      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <nav className="dashboard-nav">
            {navigationItems.map(item => (
              <button
                key={item.id}
                className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="dashboard-main">
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={() => setError('')}>×</button>
            </div>
          )}

          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
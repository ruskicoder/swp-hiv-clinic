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

// Define navigationItems at the top-level to fix ReferenceError
const navigationItems = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'appointments', label: 'My Appointments', icon: '📅' },
  { id: 'doctors', label: 'Find Doctors', icon: '👨‍⚕️' },
  { id: 'book-appointment', label: 'Book Appointment', icon: '📝' },
  { id: 'record', label: 'My Record', icon: '📋' }
];

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
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

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
        apiClient.get('/doctors') // changed from '/admin/doctors'
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
    setError('');
    try {
      const res = await apiClient.get('/patient-records/my-record');
      setPatientRecord(res.data);
    } catch (e) {
      setPatientRecord(null);
    }
  };

  const loadARVTreatments = async () => {
    setError('');
    try {
      const res = await apiClient.get('/arv-treatments/my-treatments');
      setArvTreatments(res.data || []);
    } catch (e) {
      setArvTreatments([]);
    }
  };

  const loadAllSlots = async () => {
    setError('');
    try {
      const res = await apiClient.get('/doctors/availability/all-slots');
      setAllSlots(res.data || []);
    } catch (e) {
      setAllSlots([]);
    }
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    setError('');
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
      await loadPatientRecord();
    } catch (e) {
      setError('Failed to save patient record');
      throw new Error('Failed to save patient record');
    }
  };

  const handleUploadImage = async (base64Image) => {
    setError('');
    try {
      await apiClient.post('/patient-records/upload-image', { image: base64Image });
      await loadPatientRecord();
    } catch (e) {
      setError('Failed to upload image');
      alert('Failed to upload image');
      throw new Error('Failed to upload image');
    }
  };

  // Fetch slots for selected doctor
  const fetchDoctorSlots = async (doctorId) => {
    try {
      const res = await apiClient.get(`/doctors/${doctorId}/available-slots`);
      setDoctorSlots(res.data || []);
    } catch {
      setDoctorSlots([]);
    }
  };

  // When doctor is selected for booking, fetch slots
  const handleBookDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setActiveTab('book-appointment');
    setDoctorSlots([]);
    setSelectedDate(null);
    setSelectedSlot(null);
    await fetchDoctorSlots(doctor.userId);
  };

  // Add a simple modal component
  const ConfirmBookingModal = ({ open, doctor, slot, onConfirm, onCancel }) => {
    if (!open || !doctor || !slot) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Confirm Appointment Booking</h3>
          <div className="modal-details">
            <p><strong>Doctor:</strong> Dr. {safeRender(doctor.firstName)} {safeRender(doctor.lastName)}</p>
            <p><strong>Date:</strong> {safeDate(slot.slotDate)}</p>
            <p><strong>Time:</strong> {slot.startTime} - {slot.endTime}</p>
          </div>
          <div className="modal-actions">
            <button className="book-btn" onClick={onConfirm}>Confirm Booking</button>
            <button className="cancel-btn" onClick={onCancel}>Cancel</button>
          </div>
        </div>
        <style>{`
          .modal-overlay {
            position: fixed; z-index: 1000; left: 0; top: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;
          }
          .modal-content {
            background: #fff; border-radius: 12px; padding: 2rem; min-width: 320px; max-width: 90vw;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
          }
          .modal-details p { margin: 0.5rem 0; }
          .modal-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
          .book-btn, .cancel-btn {
            padding: 0.5rem 1.5rem; border-radius: 6px; border: none; font-size: 1rem; cursor: pointer;
          }
          .book-btn { background: #059669; color: #fff; }
          .book-btn:hover { background: #047857; }
          .cancel-btn { background: #e5e7eb; color: #374151; }
          .cancel-btn:hover { background: #d1d5db; }
        `}</style>
      </div>
    );
  };

  // Book Appointment Tab: Calendar + Modal + Slot selection
  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;
    try {
      await apiClient.post('/appointments/book', {
        doctorUserId: selectedDoctor.userId,
        availabilitySlotId: selectedSlot.availabilitySlotId,
        appointmentDateTime: `${selectedSlot.slotDate}T${selectedSlot.startTime}`
      });
      alert('Appointment booked successfully!');
      setSelectedSlot(null);
      setShowBookingModal(false);
      setActiveTab('appointments');
      loadDashboardData();
      loadAllSlots();
    } catch (error) {
      alert('Failed to book appointment. Please try again.');
    }
  };

  const BookAppointmentForm = () => (
    <ErrorBoundary>
      <div className="book-appointment-section">
        <div className="content-header">
          <h2>Book Appointment</h2>
          <p>
            {selectedDoctor
              ? `Select an available slot for Dr. ${safeRender(selectedDoctor.firstName)} ${safeRender(selectedDoctor.lastName)}`
              : 'Please select a doctor first.'}
          </p>
        </div>
        {selectedDoctor && (
          <>
            <div className="available-slots-list">
              {doctorSlots && doctorSlots.length > 0 ? (
                <div className="slots-grid">
                  {doctorSlots.map((slot) => (
                    <div
                      key={slot.availabilitySlotId}
                      className={`slot-card${selectedSlot && selectedSlot.availabilitySlotId === slot.availabilitySlotId ? ' selected' : ''}`}
                      onClick={() => {
                        if (!slot.isBooked) {
                          setSelectedSlot(slot);
                          setShowBookingModal(true);
                        }
                      }}
                      style={{
                        cursor: slot.isBooked ? 'not-allowed' : 'pointer',
                        opacity: slot.isBooked ? 0.5 : 1,
                        border: selectedSlot && selectedSlot.availabilitySlotId === slot.availabilitySlotId ? '2px solid #059669' : undefined
                      }}
                    >
                      <div>
                        <strong>Date:</strong> {safeDate(slot.slotDate)}<br />
                        <strong>Time:</strong> {slot.startTime} - {slot.endTime}
                      </div>
                      <div>
                        <span className={`booking-status ${slot.isBooked ? 'booked' : 'available'}`}>
                          {slot.isBooked ? 'Booked' : 'Available'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No available slots for this doctor.</p>
                </div>
              )}
            </div>
            {/* Modal for booking confirmation */}
            <ConfirmBookingModal
              open={showBookingModal}
              doctor={selectedDoctor}
              slot={selectedSlot}
              onConfirm={handleBookAppointment}
              onCancel={() => {
                setShowBookingModal(false);
                setSelectedSlot(null);
              }}
            />
          </>
        )}
        {!selectedDoctor && (
          <div className="no-data">
            <p>Please select a doctor from the "Find Doctors" tab to book an appointment.</p>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

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

  // Add the missing renderOverview function
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

  // Add the missing renderDoctors function
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
                      onClick={() => handleBookDoctor(doctor)}
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

  // Add the missing renderAppointments function
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
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import AvailabilityCalendar from '../../components/schedule/AvailabilityCalendar';
import SlotManagementModal from '../../components/schedule/SlotManagementModal';
import TimeSlotModal from '../../components/schedule/TimeSlotModal';
import { safeRender, safeDate, safeDateTime, safeTime } from '../../utils/renderUtils';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Main state
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data state
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);
  
  // Modal state
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateSlots, setSelectedDateSlots] = useState([]);
  
  // Form state
  const [arvFormData, setArvFormData] = useState({
    regimen: '',
    startDate: '',
    endDate: '',
    adherence: '',
    sideEffects: '',
    notes: ''
  });

  const [appointmentUpdateData, setAppointmentUpdateData] = useState({
    status: '',
    notes: '',
    scheduleRecheck: false,
    recheckDateTime: '',
    durationMinutes: 30
  });

  // Navigation items for the sidebar
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'availability', label: 'Availability', icon: '🕒' }
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        apiClient.get('/appointments/doctor/my-appointments'),
        apiClient.get('/doctors/availability/my-slots')
      ]);

      if (results[0].status === 'fulfilled') {
        setAppointments(results[0].value.data || []);
      } else {
        console.error('Failed to load appointments:', results[0].reason);
      }

      if (results[1].status === 'fulfilled') {
        setAvailabilitySlots(results[1].value.data || []);
      } else {
        console.error('Failed to load availability slots:', results[1].reason);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      // Use correct endpoint and method, and handle backend error messages
      const response = await apiClient.delete(`/doctors/availability/${slotId}`);
      if (response.data && response.data.success === false) {
        setError(response.data.message || 'Failed to delete availability slot');
      } else {
        await loadDashboardData();
        setShowSlotModal(false);
        setSelectedDate(null);
        setSelectedDateSlots([]);
      }
    } catch (error) {
      // Show backend error message if available
      setError(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        'Failed to delete availability slot'
      );
      console.error('Error deleting slot:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadPatientRecord = async (appointment) => {
    try {
      setSelectedAppointment(appointment);
      setActiveTab('patient-record');
      
      // Load patient record for the appointment
      const recordResponse = await apiClient.get(`/appointments/${appointment.appointmentId}/patient-record`);
      setPatientRecord(recordResponse.data);
      
      // Load ARV treatments for the patient
      const arvResponse = await apiClient.get(`/arv-treatments/patient/${appointment.patientUser.userId}`);
      setArvTreatments(arvResponse.data || []);
      
      // Initialize appointment update form
      setAppointmentUpdateData({
        status: appointment.status || 'Scheduled',
        notes: appointment.appointmentNotes || '',
        scheduleRecheck: false,
        recheckDateTime: '',
        durationMinutes: appointment.durationMinutes || 30
      });
      
    } catch (error) {
      console.error('Error loading patient record:', error);
      if (error.response?.status === 403) {
        setError('Cannot access patient record after appointment is completed');
      } else {
        setError('Failed to load patient record');
      }
    }
  };

  const handleUpdateAppointmentStatus = async () => {
    try {
      const updateData = {
        status: appointmentUpdateData.status,
        notes: appointmentUpdateData.notes,
        scheduleRecheck: appointmentUpdateData.scheduleRecheck,
        recheckDateTime: appointmentUpdateData.recheckDateTime,
        durationMinutes: appointmentUpdateData.durationMinutes
      };

      await apiClient.put(`/appointments/${selectedAppointment.appointmentId}/status`, updateData);
      
      // Reload appointments and go back to appointments view
      await loadDashboardData();
      setActiveTab('appointments');
      setSelectedAppointment(null);
      setPatientRecord(null);
      
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment status');
    }
  };

  const handleAddARVTreatment = async () => {
    try {
      const treatmentData = {
        ...arvFormData,
        patientUserId: selectedAppointment.patientUser.userId,
        appointmentId: selectedAppointment.appointmentId
      };

      await apiClient.post('/arv-treatments/add', treatmentData);
      
      // Reload ARV treatments
      const arvResponse = await apiClient.get(`/arv-treatments/patient/${selectedAppointment.patientUser.userId}`);
      setArvTreatments(arvResponse.data || []);
      
      // Reset form
      setArvFormData({
        regimen: '',
        startDate: '',
        endDate: '',
        adherence: '',
        sideEffects: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error adding ARV treatment:', error);
      setError('Failed to add ARV treatment');
    }
  };

  const handleCalendarSlotSelect = (date, existingSlots) => {
    setSelectedDate(date);
    setSelectedDateSlots(existingSlots);
    
    if (existingSlots.length > 0) {
      // Show slot management modal if there are existing slots
      setShowSlotModal(true);
    } else {
      // Show time slot creation modal if no existing slots
      setShowTimeModal(true);
    }
  };

  const handleTimeSlotSubmit = async (slotData) => {
    try {
      // Ensure slotDate is in YYYY-MM-DD format (ISO string)
      let slotDate = slotData.slotDate;
      if (slotDate instanceof Date) {
        slotDate = slotDate.toISOString().split('T')[0];
      }
      // Prepare payload for backend
      const payload = {
        slotDate,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        notes: slotData.notes
      };
      // Use correct endpoint and method
      await apiClient.post('/doctors/availability', payload);
      await loadDashboardData();
      setShowTimeModal(false);
      setShowSlotModal(false);
      setSelectedDate(null);
      setSelectedDateSlots([]);
    } catch (error) {
      console.error('Error adding availability slot:', error);
      setError(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        'Failed to add availability slot'
      );
    }
  };

  const handleARVChange = (e) => {
    const { name, value } = e.target;
    setArvFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppointmentUpdateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppointmentUpdateData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const renderOverview = () => (
    <ErrorBoundary>
      <div className="overview-section">
        <div className="content-header">
          <h2>Dashboard Overview</h2>
          <p>Welcome back, Dr. {safeRender(user?.firstName || user?.username)}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Total Appointments</h3>
              <div className="stat-number">{appointments.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>Upcoming Appointments</h3>
              <div className="stat-number">
                {appointments.filter(apt => 
                  apt.status === 'Scheduled' && 
                  new Date(apt.appointmentDateTime) > new Date()
                ).length}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🕒</div>
            <div className="stat-content">
              <h3>Available Slots</h3>
              <div className="stat-number">
                {availabilitySlots.filter(slot => !slot.isBooked).length}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Completed Today</h3>
              <div className="stat-number">
                {appointments.filter(apt => 
                  apt.status === 'Completed' && 
                  new Date(apt.appointmentDateTime).toDateString() === new Date().toDateString()
                ).length}
              </div>
            </div>
          </div>
        </div>

        <div className="recent-appointments">
          <h3>Recent Appointments</h3>
          <div className="appointments-list">
            {appointments.slice(0, 5).map(appointment => (
              <div key={appointment.appointmentId} className="appointment-card">
                <div className="appointment-info">
                  <h4>Patient: {safeRender(appointment.patientUser?.username)}</h4>
                  <p>Date: {safeDateTime(appointment.appointmentDateTime)}</p>
                  <p>Status: <span className={`status ${appointment.status?.toLowerCase()}`}>
                    {safeRender(appointment.status)}
                  </span></p>
                </div>
                <button 
                  className="btn-secondary"
                  onClick={() => loadPatientRecord(appointment)}
                  disabled={appointment.status === 'Completed'}
                >
                  {appointment.status === 'Completed' ? 'Completed' : 'View Patient'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="appointments-section">
        <div className="content-header">
          <h2>My Appointments</h2>
          <p>Manage your scheduled appointments</p>
        </div>
        
        <div className="appointments-grid">
          {appointments.map(appointment => (
            <div key={appointment.appointmentId} className="appointment-card">
              <div className="appointment-header">
                <h4>Patient: {safeRender(appointment.patientUser?.username)}</h4>
                <span className={`status ${appointment.status?.toLowerCase()}`}>
                  {safeRender(appointment.status)}
                </span>
              </div>
              <div className="appointment-details">
                <p><strong>Date:</strong> {safeDate(appointment.appointmentDateTime)}</p>
                <p><strong>Time:</strong> {safeTime(appointment.appointmentDateTime)}</p>
                <p><strong>Duration:</strong> {appointment.durationMinutes || 30} minutes</p>
                {appointment.appointmentNotes && (
                  <p><strong>Notes:</strong> {safeRender(appointment.appointmentNotes)}</p>
                )}
              </div>
              <div className="appointment-actions">
                <button 
                  className="btn-primary"
                  onClick={() => loadPatientRecord(appointment)}
                  disabled={appointment.status === 'Completed'}
                >
                  {appointment.status === 'Completed' ? 'Completed' : 'Manage Patient'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );

  const renderPatientRecord = () => (
    <ErrorBoundary>
      <div className="patient-record-section">
        {selectedAppointment && (
          <>
            <div className="appointment-context">
              <h3>Managing Patient: {safeRender(selectedAppointment.patientUser?.username)}</h3>
              <div className="appointment-info">
                <p><strong>Appointment:</strong> {safeDateTime(selectedAppointment.appointmentDateTime)}</p>
                <p><strong>Current Status:</strong> 
                  <span className={`status ${selectedAppointment.status?.toLowerCase()}`}>
                    {safeRender(selectedAppointment.status)}
                  </span>
                </p>
              </div>
            </div>

            <div className="patient-management-content">
              <div className="patient-record-container">
                {patientRecord && (
                  <PatientRecordSection 
                    patientRecord={patientRecord}
                    isEditable={false}
                  />
                )}
              </div>

              <div className="arv-treatments-section">
                <h4>ARV Treatments</h4>
                <div className="treatments-list">
                  {arvTreatments.map(treatment => (
                    <div key={treatment.arvTreatmentId} className="treatment-card">
                      <h5>{safeRender(treatment.regimen)}</h5>
                      <p><strong>Start Date:</strong> {safeDate(treatment.startDate)}</p>
                      {treatment.endDate && (
                        <p><strong>End Date:</strong> {safeDate(treatment.endDate)}</p>
                      )}
                      <p><strong>Adherence:</strong> {safeRender(treatment.adherence)}</p>
                      {treatment.sideEffects && (
                        <p><strong>Side Effects:</strong> {safeRender(treatment.sideEffects)}</p>
                      )}
                      {treatment.notes && (
                        <p><strong>Notes:</strong> {safeRender(treatment.notes)}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="add-treatment-form">
                  <h5>Add New ARV Treatment</h5>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Regimen:</label>
                      <input
                        type="text"
                        name="regimen"
                        value={arvFormData.regimen}
                        onChange={handleARVChange}
                        placeholder="Enter ARV regimen"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Date:</label>
                      <input
                        type="date"
                        name="startDate"
                        value={arvFormData.startDate}
                        onChange={handleARVChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>End Date:</label>
                      <input
                        type="date"
                        name="endDate"
                        value={arvFormData.endDate}
                        onChange={handleARVChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Adherence:</label>
                      <select
                        name="adherence"
                        value={arvFormData.adherence}
                        onChange={handleARVChange}
                      >
                        <option value="">Select adherence level</option>
                        <option value="Excellent">Excellent (95-100%)</option>
                        <option value="Good">Good (85-94%)</option>
                        <option value="Fair">Fair (75-84%)</option>
                        <option value="Poor">Poor (Under 75%)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Side Effects:</label>
                    <textarea
                      name="sideEffects"
                      value={arvFormData.sideEffects}
                      onChange={handleARVChange}
                      rows="3"
                      placeholder="Enter any side effects..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Notes:</label>
                    <textarea
                      name="notes"
                      value={arvFormData.notes}
                      onChange={handleARVChange}
                      rows="3"
                      placeholder="Enter additional notes..."
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={handleAddARVTreatment}
                  >
                    Add Treatment
                  </button>
                </div>
              </div>

              <div className="appointment-management-section">
                <h4>Appointment Management</h4>
                <div className="appointment-update-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Status:</label>
                      <select
                        name="status"
                        value={appointmentUpdateData.status}
                        onChange={handleAppointmentUpdateChange}
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="No Show">No Show</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes):</label>
                      <input
                        type="number"
                        name="durationMinutes"
                        value={appointmentUpdateData.durationMinutes}
                        onChange={handleAppointmentUpdateChange}
                        min="15"
                        max="180"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Appointment Notes:</label>
                    <textarea
                      name="notes"
                      value={appointmentUpdateData.notes}
                      onChange={handleAppointmentUpdateChange}
                      rows="4"
                      placeholder="Enter appointment notes..."
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="scheduleRecheck"
                        checked={appointmentUpdateData.scheduleRecheck}
                        onChange={handleAppointmentUpdateChange}
                      />
                      Schedule Re-check Appointment
                    </label>
                  </div>
                  {appointmentUpdateData.scheduleRecheck && (
                    <div className="form-group">
                      <label>Re-check Date & Time:</label>
                      <input
                        type="datetime-local"
                        name="recheckDateTime"
                        value={appointmentUpdateData.recheckDateTime}
                        onChange={handleAppointmentUpdateChange}
                      />
                    </div>
                  )}
                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn-primary"
                      onClick={handleUpdateAppointmentStatus}
                    >
                      Update Appointment
                    </button>
                    <button 
                      type="button" 
                      className="btn-secondary"
                      onClick={() => {
                        setActiveTab('appointments');
                        setSelectedAppointment(null);
                        setPatientRecord(null);
                      }}
                    >
                      Back to Appointments
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAvailability = () => (
    <ErrorBoundary>
      <div className="availability-section">
        <div className="content-header">
          <h2>Manage Availability</h2>
          <p>Click on a date to add new slots or manage existing ones</p>
        </div>

        <AvailabilityCalendar
          onSlotSelect={handleCalendarSlotSelect}
          existingSlots={availabilitySlots}
        />

        <div className="existing-slots">
          <h3>Current Availability Slots</h3>
          <div className="slots-grid">
            {availabilitySlots.map(slot => (
              <div key={slot.availabilitySlotId} className="slot-card">
                <div className="slot-info">
                  <h4>{safeDate(slot.slotDate)}</h4>
                  <p className="slot-time">{safeTime(slot.startTime)} - {safeTime(slot.endTime)}</p>
                  <p className={`booking-status ${slot.isBooked ? 'booked' : 'available'}`}>
                    {slot.isBooked ? 'Booked' : 'Available'}
                  </p>
                  {slot.notes && <p className="slot-notes">{safeRender(slot.notes)}</p>}
                </div>
                <div className="slot-actions">
                  <button 
                    className="btn-danger"
                    onClick={() => handleDeleteSlot(slot.availabilitySlotId)}
                    disabled={slot.isBooked}
                  >
                    {slot.isBooked ? 'Booked' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'appointments':
        return renderAppointments();
      case 'patient-record':
        return renderPatientRecord();
      case 'availability':
        return renderAvailability();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="doctor-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <DashboardHeader 
        user={user} 
        onLogout={handleLogout}
        title="Doctor Dashboard"
      />
      
      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>Doctor Panel</h1>
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
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError('')} className="close-error">×</button>
            </div>
          )}
          {renderContent()}
        </div>
      </div>

      <TimeSlotModal
        isOpen={showTimeModal}
        onClose={() => {
          setShowTimeModal(false);
          setSelectedDate(null);
        }}
        onSubmit={handleTimeSlotSubmit}
        selectedDate={selectedDate}
      />

      <SlotManagementModal
        isOpen={showSlotModal}
        onClose={() => {
          setShowSlotModal(false);
          setSelectedDate(null);
          setSelectedDateSlots([]);
        }}
        selectedDate={selectedDate}
        existingSlots={selectedDateSlots}
        onAddSlot={handleTimeSlotSubmit}
        onDeleteSlot={handleDeleteSlot}
      />
    </div>
  );
};

export default DoctorDashboard;

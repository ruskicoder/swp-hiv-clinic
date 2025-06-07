import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import AvailabilityCalendar from '../../components/schedule/AvailabilityCalendar';
import SlotActionModal from '../../components/schedule/SlotActionModal';
import TimeSlotModal from '../../components/schedule/TimeSlotModal';
import ARVTreatmentModal from '../../components/arv/ARVTreatmentModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { safeDate, safeDateTime, safeTime } from '../../utils/renderUtils';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);

  // Modal states
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showARVModal, setShowARVModal] = useState(false);

  // Form states
  const [arvFormData, setArvFormData] = useState({
    regimen: '',
    startDate: '',
    endDate: '',
    adherence: '',
    sideEffects: '',
    notes: ''
  });

  const [appointmentUpdateData, setAppointmentUpdateData] = useState({
    status: 'Scheduled',
    notes: '',
    scheduleRecheck: false,
    recheckDateTime: '',
    durationMinutes: 30
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateSlots, setSelectedDateSlots] = useState([]);

  // Load dashboard data on mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [appointmentsRes, slotsRes] = await Promise.all([
        apiClient.get('/appointments/doctor/my-appointments'),
        apiClient.get('/doctors/availability/my-slots')
      ]);
      
      setAppointments(appointmentsRes.data || []);
      setAvailabilitySlots(slotsRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientRecord = async (appointment) => {
    setSelectedAppointment(appointment);
    setActiveTab('patient-record');
    setError('');
    
    try {
      console.log('Loading patient record for appointment:', appointment.appointmentId);
      
      // Load patient record via appointment endpoint
      const recordResponse = await apiClient.get(`/appointments/${appointment.appointmentId}/patient-record`);
      
      console.log('Patient record response:', recordResponse.data);
      
      if (!recordResponse.data) {
        throw new Error('No patient record data received');
      }

      // Check if the response indicates an error
      if (recordResponse.data.success === false) {
        throw new Error(recordResponse.data.message || 'Failed to load patient record');
      }

      // Set the patient record directly - the backend should return a properly formatted response
      setPatientRecord(recordResponse.data);
      
      // Load ARV treatments if we have patient information
      const patientId = recordResponse.data.patientId || recordResponse.data.patientUserId || recordResponse.data.patientUserID;
      if (patientId) {
        try {
          const arvResponse = await apiClient.get(`/arv-treatments/patient/${patientId}`);
          setArvTreatments(arvResponse.data || []);
        } catch (arvError) {
          console.warn('Failed to load ARV treatments:', arvError);
          setArvTreatments([]);
        }
      }
      
    } catch (error) {
      console.error('Error loading patient record:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load patient record';
      setError(errorMessage);
      setPatientRecord(null);
      setArvTreatments([]);
    }
    
    // Initialize appointment update form regardless of record load success
    setAppointmentUpdateData({
      status: appointment.status || 'Scheduled',
      notes: appointment.appointmentNotes || '',
      scheduleRecheck: false,
      recheckDateTime: '',
      durationMinutes: appointment.durationMinutes || 30
    });
  };

  const handleSavePatientRecord = async (recordData) => {
    if (!selectedAppointment) {
      throw new Error('No appointment selected');
    }

    try {
      const patientId = patientRecord?.patientId || patientRecord?.patientUserId || patientRecord?.patientUserID;
      if (!patientId) {
        throw new Error('Patient ID not found');
      }

      await apiClient.put(`/patient-records/${patientId}`, recordData);
      
      // Reload the patient record to get updated data
      await loadPatientRecord(selectedAppointment);
    } catch (error) {
      console.error('Error saving patient record:', error);
      throw new Error(error.response?.data?.message || 'Failed to save patient record');
    }
  };

  const handleUploadImage = async (base64Image) => {
    if (!selectedAppointment) {
      throw new Error('No appointment selected');
    }

    try {
      const patientId = patientRecord?.patientId || patientRecord?.patientUserId || patientRecord?.patientUserID;
      if (!patientId) {
        throw new Error('Patient ID not found');
      }

      await apiClient.post('/patient-records/upload-image', { 
        image: base64Image,
        patientId: patientId 
      });
      
      // Reload the patient record to get updated data
      await loadPatientRecord(selectedAppointment);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
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
      setError(
        error?.response?.data?.message ||
        error?.response?.data?.msg ||
        error?.message ||
        'Failed to delete availability slot'
      );
      console.error('Error deleting slot:', error);
    }
  };

  const handleDeleteARV = async (treatmentId) => {
    try {
      await apiClient.delete(`/arv-treatments/${treatmentId}`);
      // Reload ARV treatments
      if (selectedAppointment) {
        const patientId = patientRecord?.patientId || patientRecord?.patientUserId || patientRecord?.patientUserID;
        if (patientId) {
          const arvResponse = await apiClient.get(`/arv-treatments/patient/${patientId}`);
          setArvTreatments(arvResponse.data || []);
        }
      }
    } catch (error) {
      console.error('Error deleting ARV treatment:', error);
      setError('Failed to delete ARV treatment');
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      await apiClient.put(`/appointments/${selectedAppointment.appointmentId}/status`, appointmentUpdateData);
      await loadDashboardData();
      setActiveTab('appointments');
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment');
    }
  };

  const handleAddARV = async () => {
    if (!selectedAppointment) return;

    try {
      const patientId = patientRecord?.patientId || patientRecord?.patientUserId || patientRecord?.patientUserID;
      if (!patientId) {
        throw new Error('Patient ID not found');
      }

      const arvData = {
        ...arvFormData,
        patientUserId: patientId,
        appointmentId: selectedAppointment.appointmentId
      };

      await apiClient.post('/arv-treatments', arvData);
      
      // Reload ARV treatments
      const arvResponse = await apiClient.get(`/arv-treatments/patient/${patientId}`);
      setArvTreatments(arvResponse.data || []);
      
      setShowARVModal(false);
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

  const handleEditARV = async (treatmentId, updatedData) => {
    try {
      await apiClient.put(`/arv-treatments/${treatmentId}`, updatedData);
      
      // Reload ARV treatments
      if (selectedAppointment) {
        const patientId = patientRecord?.patientId || patientRecord?.patientUserId || patientRecord?.patientUserID;
        if (patientId) {
          const arvResponse = await apiClient.get(`/arv-treatments/patient/${patientId}`);
          setArvTreatments(arvResponse.data || []);
        }
      }
    } catch (error) {
      console.error('Error editing ARV treatment:', error);
      setError('Failed to edit ARV treatment');
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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCalendarSlotSelect = (date, existingSlots) => {
    // Ensure we have a valid date object
    const selectedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(selectedDate.getTime())) {
      console.error('Invalid date provided');
      return;
    }

    // Get slots for the selected date
    const dateStr = selectedDate.toISOString().split('T')[0];
    const dateSlots = availabilitySlots.filter(slot => {
      const slotDate = new Date(slot.slotDate);
      return slotDate.toISOString().split('T')[0] === dateStr;
    });

    setSelectedDate(selectedDate);
    setSelectedDateSlots(dateSlots);
    setShowSlotModal(true);
  };

  const handleTimeSlotSubmit = async (slotData) => {
    try {
      if (!slotData.slotDate) {
        throw new Error('Invalid date');
      }

      // Format data for API
      const payload = {
        slotDate: slotData.slotDate,
        startTime: slotData.startTime,
        endTime: slotData.endTime,
        notes: slotData.notes || ''
      };

      const response = await apiClient.post('/doctors/availability', payload);
      
      if (!response.data || response.data.success === false) {
        throw new Error(response.data?.message || 'Failed to create slot');
      }

      await loadDashboardData(); // Reload all data
      setShowTimeModal(false);
      setShowSlotModal(false);
      setSelectedDate(null);
      setSelectedDateSlots([]);
      
    } catch (error) {
      console.error('Error adding availability slot:', error);
      setError(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add availability slot. Please try again.'
      );
      throw error; // Re-throw to be handled by TimeSlotModal
    }
  };

  const renderOverview = () => {
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.appointmentDateTime) > new Date() && apt.status === 'Scheduled'
    );
    const availableSlots = availabilitySlots.filter(slot => !slot.isBooked);
    const recentAppointments = appointments.slice(0, 5);

    return (
      <div className="overview-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <p className="stat-number">{appointments.length}</p>
          </div>
          <div className="stat-card">
            <h3>Upcoming Appointments</h3>
            <p className="stat-number">{upcomingAppointments.length}</p>
          </div>
          <div className="stat-card">
            <h3>Available Slots</h3>
            <p className="stat-number">{availableSlots.length}</p>
          </div>
        </div>

        <div className="recent-appointments">
          <h3>Recent Appointments</h3>
          {recentAppointments.length > 0 ? (
            <div className="appointments-list">
              {recentAppointments.map(appointment => (
                <div key={appointment.appointmentId} className="appointment-item">
                  <div className="appointment-info">
                    <p><strong>Patient:</strong> {appointment.patientUser?.username}</p>
                    <p><strong>Date:</strong> {safeDateTime(appointment.appointmentDateTime)}</p>
                    <p><strong>Status:</strong> {appointment.status}</p>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => loadPatientRecord(appointment)}
                  >
                    View Record
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>No appointments found.</p>
          )}
        </div>
      </div>
    );
  };

  const renderAppointments = () => (
    <div className="appointments-content">
      <h3>My Appointments</h3>
      {appointments.length > 0 ? (
        <div className="appointments-list">
          {appointments.map(appointment => (
            <div key={appointment.appointmentId} className="appointment-item">
              <div className="appointment-info">
                <p><strong>Patient:</strong> {appointment.patientUser?.username}</p>
                <p><strong>Date:</strong> {safeDateTime(appointment.appointmentDateTime)}</p>
                <p><strong>Duration:</strong> {appointment.durationMinutes} minutes</p>
                <p><strong>Status:</strong> {appointment.status}</p>
                {appointment.appointmentNotes && (
                  <p><strong>Notes:</strong> {appointment.appointmentNotes}</p>
                )}
              </div>
              <div className="appointment-actions">
                <button 
                  className="btn-primary"
                  onClick={() => loadPatientRecord(appointment)}
                >
                  View Patient Record
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No appointments found.</p>
      )}
    </div>
  );

  const renderPatientRecord = () => (
    <div className="patient-record-content">
      {selectedAppointment && (
        <div className="appointment-details">
          <h3>Appointment Details</h3>
          <p><strong>Patient:</strong> {selectedAppointment.patientUser?.username}</p>
          <p><strong>Date:</strong> {safeDateTime(selectedAppointment.appointmentDateTime)}</p>
          <p><strong>Status:</strong> {selectedAppointment.status}</p>
        </div>
      )}

      <ErrorBoundary>
        <PatientRecordSection
          record={patientRecord}
          onSave={handleSavePatientRecord}
          onImageUpload={handleUploadImage}
          loading={loading}
          isEditable={true}
        />
      </ErrorBoundary>

      {/* ARV Treatments Section */}
      <div className="arv-treatments-section">
        <div className="section-header">
          <h3>ARV Treatments</h3>
          <button 
            className="btn-primary"
            onClick={() => setShowARVModal(true)}
          >
            Add Treatment
          </button>
        </div>
        
        {arvTreatments.length > 0 ? (
          <div className="treatments-list">
            {arvTreatments.map(treatment => (
              <div key={treatment.arvTreatmentId} className="treatment-item">
                <div className="treatment-info">
                  <p><strong>Regimen:</strong> {treatment.regimen}</p>
                  <p><strong>Start Date:</strong> {safeDate(treatment.startDate)}</p>
                  {treatment.endDate && (
                    <p><strong>End Date:</strong> {safeDate(treatment.endDate)}</p>
                  )}
                  <p><strong>Adherence:</strong> {treatment.adherence || 'Not specified'}</p>
                  {treatment.sideEffects && (
                    <p><strong>Side Effects:</strong> {treatment.sideEffects}</p>
                  )}
                  {treatment.notes && (
                    <p><strong>Notes:</strong> {treatment.notes}</p>
                  )}
                </div>
                <div className="treatment-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => handleDeleteARV(treatment.arvTreatmentId)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No ARV treatments recorded.</p>
        )}
      </div>

      {/* Appointment Update Section */}
      <div className="appointment-update-section">
        <h3>Update Appointment</h3>
        <div className="update-form">
          <div className="form-group">
            <label>Status:</label>
            <select 
              name="status" 
              value={appointmentUpdateData.status}
              onChange={handleAppointmentUpdateChange}
            >
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Notes:</label>
            <textarea 
              name="notes"
              value={appointmentUpdateData.notes}
              onChange={handleAppointmentUpdateChange}
              placeholder="Add appointment notes..."
            />
          </div>
          
          <div className="form-group">
            <label>Duration (minutes):</label>
            <input 
              type="number"
              name="durationMinutes"
              value={appointmentUpdateData.durationMinutes}
              onChange={handleAppointmentUpdateChange}
              min="15"
              max="120"
            />
          </div>
          
          <button 
            className="btn-primary"
            onClick={handleUpdateAppointment}
          >
            Update Appointment
          </button>
        </div>
      </div>
    </div>
  );

  const renderAvailability = () => (
    <div className="availability-content">
      <div className="availability-header">
        <h3>Manage Availability</h3>
      </div>
      
      <ErrorBoundary>
        <AvailabilityCalendar
          slots={availabilitySlots.map(slot => ({
            ...slot,
            slotDate: new Date(slot.slotDate),
            isBooked: Boolean(slot.isBooked)
          }))}
          onDateSelect={handleCalendarSlotSelect}
          userRole="doctor"
          currentUserId={user?.userId}
        />
      </ErrorBoundary>
    </div>
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
        return (
          <div className="availability-content">
            <div className="availability-header">
              <h3>Manage Availability</h3>
            </div>
            
            <ErrorBoundary>
              <AvailabilityCalendar
                slots={availabilitySlots}
                onDateSelect={handleCalendarSlotSelect}
                userRole="doctor"
              />
            </ErrorBoundary>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="doctor-dashboard">
        <DashboardHeader
          title="Doctor Dashboard" 
          subtitle="Manage appointments and patient records"
        />
        <div className="loading-message">
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <DashboardHeader
        title="Doctor Dashboard"
        subtitle="Manage appointments and patient records"
      />
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      <div className="dashboard-layout">
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>Navigation</h1>
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
                Appointments
              </button>
            </div>
            {selectedAppointment && (
              <div className="nav-item">
                <button
                  className={`nav-button ${activeTab === 'patient-record' ? 'active' : ''}`}
                  onClick={() => setActiveTab('patient-record')}
                >
                  <span className="nav-icon">📋</span>
                  Patient Record
                </button>
              </div>
            )}
            <div className="nav-item">
              <button
                className={`nav-button ${activeTab === 'availability' ? 'active' : ''}`}
                onClick={() => setActiveTab('availability')}
              >
                <span className="nav-icon">🕒</span>
                Availability
              </button>
            </div>
          </nav>
        </div>
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
      
      {/* Modals */}
      {showSlotModal && (
        <SlotActionModal
          isOpen={showSlotModal}
          onClose={() => setShowSlotModal(false)}
          selectedDate={selectedDate}
          existingSlots={selectedDateSlots}
          onAddSlot={() => handleAddNewSlot()} // Changed to open time modal
          onDeleteSlot={handleDeleteSlot}
          userRole="doctor"
        />
      )}

      {showTimeModal && (
        <TimeSlotModal
          isOpen={showTimeModal}
          onClose={() => {
            setShowTimeModal(false);
            setShowSlotModal(true); // Return to slot management after adding
          }}
          onSubmit={async (slotData) => {
            await handleTimeSlotSubmit(slotData);
            setShowTimeModal(false);
            setShowSlotModal(true); // Return to slot management after adding
          }}
          selectedDate={selectedDate}
          existingSlots={selectedDateSlots}
        />
      )}

      {showARVModal && (
        <ARVTreatmentModal
          isOpen={showARVModal}
          onClose={() => setShowARVModal(false)}
          onSubmit={handleAddARV}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
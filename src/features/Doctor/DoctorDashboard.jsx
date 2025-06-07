import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import UnifiedCalendar from '../../components/schedule/UnifiedCalendar';
import ARVTreatmentModal from '../../components/arv/ARVTreatmentModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { safeRender, safeDate, safeDateTime, safeTime } from '../../utils/renderUtils';
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
  const [showARVModal, setShowARVModal] = useState(false);
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

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, slotsRes] = await Promise.allSettled([
        apiClient.get('/appointments/doctor/my-appointments'),
        apiClient.get('/doctors/availability/my-slots')
      ]);

      if (appointmentsRes.status === 'fulfilled') {
        setAppointments(appointmentsRes.value.data || []);
      } else {
        console.error('Failed to load appointments:', appointmentsRes.reason);
      }

      if (slotsRes.status === 'fulfilled') {
        setAvailabilitySlots(slotsRes.value.data || []);
      } else {
        console.error('Failed to load availability slots:', slotsRes.reason);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Load patient record for appointment
  const loadPatientRecord = async (appointment) => {
    try {
      setSelectedAppointment(appointment);
      setAppointmentUpdateData({
        status: appointment.status || 'Scheduled',
        notes: appointment.appointmentNotes || '',
        scheduleRecheck: false,
        recheckDateTime: '',
        durationMinutes: appointment.durationMinutes || 30
      });

      const recordRes = await apiClient.get(`/appointments/${appointment.appointmentId}/patient-record`);
      setPatientRecord(recordRes.data);

      const arvRes = await apiClient.get(`/arv-treatments/patient/${appointment.patientUser.userId}`);
      setArvTreatments(arvRes.data || []);

      setActiveTab('patient-record');
    } catch (error) {
      console.error('Error loading patient record:', error);
      alert('Failed to load patient record');
    }
  };

  // Handle slot addition
  const handleAddSlot = async (slotData) => {
    try {
      const response = await apiClient.post('/doctors/availability', slotData);
      if (response.data.success) {
        await loadDashboardData(); // Refresh data
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to create slot');
      }
    } catch (error) {
      console.error('Error adding slot:', error);
      throw error;
    }
  };

  // Handle slot deletion
  const handleDeleteSlot = async (slotId) => {
    try {
      const response = await apiClient.delete(`/doctors/availability/${slotId}`);
      if (response.data.success) {
        await loadDashboardData(); // Refresh data
      } else {
        throw new Error(response.data.message || 'Failed to delete slot');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      throw error;
    }
  };

  // Handle patient record save
  const handleSavePatientRecord = async (recordData) => {
    try {
      if (!selectedAppointment) return;
      
      const response = await apiClient.put(
        `/patient-records/${selectedAppointment.patientUser.userId}`,
        recordData
      );
      
      if (response.data.success) {
        alert('Patient record updated successfully');
        await loadPatientRecord(selectedAppointment);
      }
    } catch (error) {
      console.error('Error saving patient record:', error);
      alert('Failed to save patient record');
    }
  };

  // Handle image upload
  const handleUploadImage = async (imageData) => {
    try {
      if (!selectedAppointment) return;
      
      const response = await apiClient.post('/patient-records/upload-image', {
        patientId: selectedAppointment.patientUser.userId,
        image: imageData
      });
      
      if (response.data.success) {
        alert('Image uploaded successfully');
        await loadPatientRecord(selectedAppointment);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  // Handle ARV treatment addition
  const handleAddARV = async (arvData) => {
    try {
      if (!selectedAppointment) return;
      
      const treatmentData = {
        ...arvData,
        patientUserId: selectedAppointment.patientUser.userId,
        appointmentId: selectedAppointment.appointmentId
      };
      
      const response = await apiClient.post('/arv-treatments', treatmentData);
      if (response.data.success) {
        alert('ARV treatment added successfully');
        setShowARVModal(false);
        await loadPatientRecord(selectedAppointment);
      }
    } catch (error) {
      console.error('Error adding ARV treatment:', error);
      alert('Failed to add ARV treatment');
    }
  };

  // Handle ARV deletion
  const handleDeleteARV = async (treatmentId) => {
    try {
      if (window.confirm('Are you sure you want to delete this ARV treatment?')) {
        const response = await apiClient.delete(`/arv-treatments/${treatmentId}`);
        if (response.data.success) {
          alert('ARV treatment deleted successfully');
          await loadPatientRecord(selectedAppointment);
        }
      }
    } catch (error) {
      console.error('Error deleting ARV treatment:', error);
      alert('Failed to delete ARV treatment');
    }
  };

  // Handle appointment update
  const handleUpdateAppointment = async () => {
    try {
      if (!selectedAppointment) return;
      
      const response = await apiClient.put(
        `/appointments/${selectedAppointment.appointmentId}/status`,
        appointmentUpdateData
      );
      
      if (response.data.success) {
        alert('Appointment updated successfully');
        await loadDashboardData();
        await loadPatientRecord(selectedAppointment);
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };

  // Handle form changes
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

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'patient-record', label: 'Patient Record', icon: '📋' },
    { id: 'availability', label: 'Availability', icon: '🕒' }
  ];

  // Render overview
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
            <h3>{appointments.length}</h3>
            <p>Total Appointments</p>
          </div>
          <div className="stat-card">
            <h3>{upcomingAppointments.length}</h3>
            <p>Upcoming Appointments</p>
          </div>
          <div className="stat-card">
            <h3>{availableSlots.length}</h3>
            <p>Available Slots</p>
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
                  <div className="appointment-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => loadPatientRecord(appointment)}
                    >
                      View Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No recent appointments found.</p>
          )}
        </div>
      </div>
    );
  };

  // Render appointments
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

  // Render patient record
  const renderPatientRecord = () => (
    <ErrorBoundary>
      <div className="patient-record-content">
        {selectedAppointment ? (
          <>
            <div className="appointment-header">
              <h3>Patient Record - {selectedAppointment.patientUser?.username}</h3>
              <p>Appointment: {safeDateTime(selectedAppointment.appointmentDateTime)}</p>
            </div>

            <PatientRecordSection
              record={patientRecord}
              onSave={handleSavePatientRecord}
              onImageUpload={handleUploadImage}
            />

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
          </>
        ) : (
          <div className="no-selection">
            <p>Please select an appointment from the appointments tab to view patient records.</p>
            <button 
              className="btn-primary"
              onClick={() => setActiveTab('appointments')}
            >
              Go to Appointments
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  // Render availability
  const renderAvailability = () => (
    <div className="availability-content">
      <h3>Manage Your Availability</h3>
      <UnifiedCalendar
        slots={availabilitySlots}
        userRole="doctor"
        currentUserId={user?.userId}
        onAddSlot={handleAddSlot}
        onDeleteSlot={handleDeleteSlot}
      />
    </div>
  );

  // Render content based on active tab
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
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

      {/* ARV Treatment Modal */}
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
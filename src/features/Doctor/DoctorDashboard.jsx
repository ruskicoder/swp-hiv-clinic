import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import UnifiedCalendar from '../../components/schedule/UnifiedCalendar';
import ARVTreatmentModal from '../../components/arv/ARVTreatmentModal';
import NotificationManagerTab from '../../components/notifications/NotificationManagerTab';
import ErrorBoundary from '../../components/ErrorBoundary';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './DoctorDashboard.css';

/**
 * Doctor Dashboard component for managing appointments, availability, and patient records
 */
const DoctorDashboard = () => {
  const { user } = useAuth();

  // Format doctor's name
  const doctorName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`
    : user?.username || 'Doctor';

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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [arvTemplates, setArvTemplates] = useState([]);
  const [arvFormData, setArvFormData] = useState({
    regimen: '',
    startDate: '',
    endDate: '',
    adherence: '',
    sideEffects: '',
    notes: '',
    setAsTemplate: false
  });
  const [appointmentUpdateData, setAppointmentUpdateData] = useState({
    status: 'Scheduled',
    notes: '',
    scheduleRecheck: false,
    recheckDateTime: '',
    durationMinutes: 30
  });

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [appointmentsRes, slotsRes] = await Promise.allSettled([
        apiClient.get('/appointments/doctor/my-appointments'),
        apiClient.get('/doctors/availability/my-slots')
      ]);

      // Handle appointments response
      if (appointmentsRes.status === 'fulfilled') {
        const appointmentsData = appointmentsRes.value?.data;
        if (Array.isArray(appointmentsData)) {
          setAppointments(appointmentsData);
        } else {
          console.warn('Appointments data is not an array:', appointmentsData);
          setAppointments([]);
        }
      } else {
        console.error('Failed to load appointments:', appointmentsRes.reason);
        setAppointments([]);
      }

      // Handle availability slots response
      if (slotsRes.status === 'fulfilled') {
        const slotsData = slotsRes.value?.data;
        if (Array.isArray(slotsData)) {
          setAvailabilitySlots(slotsData);
        } else {
          console.warn('Availability slots data is not an array:', slotsData);
          setAvailabilitySlots([]);
        }
      } else {
        console.error('Failed to load availability slots:', slotsRes.reason);
        setAvailabilitySlots([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
      setAppointments([]);
      setAvailabilitySlots([]);
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

      if (appointment.status === 'Completed') {
        setPatientRecord(null);
        setArvTreatments([]);
        return;
      }

      const recordRes = await apiClient.get(`/appointments/${appointment.appointmentId}/patient-record`);
      if (!recordRes.data.success) {
        console.warn('Failed to load patient record:', recordRes.data.message);
        setPatientRecord(null);
        setArvTreatments([]);
        return;
      }

      setPatientRecord(recordRes.data);

      const arvRes = await apiClient.get(`/arv-treatments/patient/${appointment.patientUser.userId}`);
      setArvTreatments(Array.isArray(arvRes.data) ? arvRes.data : []);

      setActiveTab('patient-record');
    } catch (error) {
      console.error('Error loading patient record:', error);
      alert('Failed to load patient record');
    }
  };

  // Load ARV templates
  const loadTemplates = async () => {
    try {
      const res = await apiClient.get('/arv-treatments/templates');
      setArvTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setArvTemplates([]);
    }
  };

  // Handle slot addition
  const handleAddSlot = async (slotData) => {
    try {
      const response = await apiClient.post('/doctors/availability', {
        slotDate: slotData.slotDate,
        startTime: slotData.startTime,
        durationMinutes: parseInt(slotData.durationMinutes),
        notes: slotData.notes || ''
      });
      
      if (response.data.success) {
        // Reload the entire availability data to ensure consistency
        await loadDashboardData();
        return { success: true };
      }
      
      throw new Error(response.data.message || 'Failed to add slot');
    } catch (error) {
      console.error('Failed to add slot:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to add slot'
      };
    }
  };

  // Handle slot deletion
  const handleDeleteSlot = async (slotId) => {
    try {
      console.log('Deleting slot:', slotId);
      const response = await apiClient.delete(`/doctors/availability/${slotId}`);
      
      if (response.data.success) {
        alert('Availability slot deleted successfully!');
        loadDashboardData(); // Reload to get updated slots
      } else {
        alert(response.data.message || 'Failed to delete slot');
      }
    } catch (error) {
      console.error('Error deleting slot:', error);
      alert('Failed to delete availability slot');
    }
  };

  // Handle patient record save
  const handleSavePatientRecord = async (recordData) => {
    try {
      if (!selectedAppointment) return;
      
      const response = await apiClient.put(`/patient-records/patient/${selectedAppointment.patientUser.userId}`, recordData);
      
      if (response.data.success) {
        alert('Patient record updated successfully!');
        loadPatientRecord(selectedAppointment); // Reload record
      } else {
        alert(response.data.message || 'Failed to update record');
      }
    } catch (error) {
      console.error('Error saving patient record:', error);
      alert('Failed to save patient record');
    }
  };

  // Handle image upload 
  const handleUploadImage = async (base64Image) => {
    try {
      if (!selectedAppointment) {
        throw new Error('No appointment selected');
      }
      
      console.debug('Uploading image for patient:', {
        patientId: selectedAppointment.patientUser.userId,
        dataLength: base64Image?.length
      });
      
      const response = await apiClient.post('/patient-records/upload-image', {
        imageData: base64Image
      });
      
      if (response.data?.success) {
        await loadPatientRecord(selectedAppointment);
        return true;
      } else {
        throw new Error(response.data?.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle ARV form changes
  const handleARVChange = (e) => {
    const { name, value, type, checked } = e.target;
    setArvFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle template selection
  const handleSelectTemplate = (template) => {
    setArvFormData({
      regimen: template.regimen,
      startDate: new Date().toISOString().slice(0, 10), // default to today
      endDate: '',
      adherence: template.adherence || '',
      sideEffects: template.sideEffects || '',
      notes: '', // notes should be empty for new ARV
      setAsTemplate: false
    });
    setShowTemplateModal(false);
    setShowARVModal(true);
  };

  // Handle adding ARV treatment
  const handleAddARV = async (arvData) => {
    try {
      if (!selectedAppointment) return;
      
      const response = await apiClient.post('/arv-treatments/add', {
        ...arvData,
        patientUserId: selectedAppointment.patientUser.userId,
        appointmentId: selectedAppointment.appointmentId
      });
      
      if (response.data.success) {
        alert('ARV treatment added successfully!');
        setShowARVModal(false);
        setArvFormData({
          regimen: '',
          startDate: '',
          endDate: '',
          adherence: '',
          sideEffects: '',
          notes: ''
        });
        loadPatientRecord(selectedAppointment); // Reload to get updated treatments
      } else {
        alert(response.data.message || 'Failed to add ARV treatment');
      }
    } catch (error) {
      console.error('Error adding ARV treatment:', error);
      alert('Failed to add ARV treatment');
    }
  };

  // Handle deleting ARV treatment
  const handleDeleteARV = async (treatmentId) => {
    try {
      const response = await apiClient.delete(`/arv-treatments/${treatmentId}`);
      
      if (response.data.success) {
        alert('ARV treatment deleted successfully!');
        loadPatientRecord(selectedAppointment); // Reload to get updated treatments
      } else {
        alert(response.data.message || 'Failed to delete ARV treatment');
      }
    } catch (error) {
      console.error('Error deleting ARV treatment:', error);
      alert('Failed to delete ARV treatment');
    }
  };

  // Handle appointment update changes
  const handleAppointmentUpdateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAppointmentUpdateData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle appointment update
  const handleUpdateAppointment = async () => {
    try {
      if (!selectedAppointment) return;
      
      const response = await apiClient.put(`/appointments/${selectedAppointment.appointmentId}/status`, appointmentUpdateData);
      
      if (response.data.success) {
        alert('Appointment updated successfully!');
        loadDashboardData(); // Reload appointments
        loadPatientRecord(selectedAppointment); // Reload current record
      } else {
        alert(response.data.message || 'Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment');
    }
  };


  // Navigation items
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'patient-record', label: 'Patient Records', icon: '📋' },
    { id: 'availability', label: 'My Availability', icon: '🕒' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  // Debug: Log navigation items
  console.log('Navigation items array:', navigationItems);
  console.log('Navigation items length:', navigationItems.length);

  // Render overview
  const renderOverview = () => {
    // Ensure availabilitySlots is an array before using filter
    const safeAvailabilitySlots = Array.isArray(availabilitySlots) ? availabilitySlots : [];
    const safeAppointments = Array.isArray(appointments) ? appointments : [];

    return (
      <ErrorBoundary>
        <div className="overview-content">
          <div className="content-header">
            <h2>Dashboard Overview</h2>
            <p>Welcome, Dr. {doctorName}</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Appointments</h3>
              <p className="stat-number">{safeAppointments.length}</p>
            </div>
            <div className="stat-card">
              <h3>Available Slots</h3>
              <p className="stat-number">{safeAvailabilitySlots.filter(slot => !slot.isBooked).length}</p>
            </div>
            <div className="stat-card">
              <h3>Booked Slots</h3>
              <p className="stat-number">{safeAvailabilitySlots.filter(slot => slot.isBooked).length}</p>
            </div>
            <div className="stat-card">
              <h3>Today's Appointments</h3>
              <p className="stat-number">
                {safeAppointments.filter(apt => {
                  try {
                    const today = new Date().toDateString();
                    const aptDate = new Date(apt.appointmentDateTime).toDateString();
                    return today === aptDate;
                  } catch (error) {
                    return false;
                  }
                }).length}
              </p>
            </div>
          </div>

          <div className="recent-appointments">
            <h3>Recent Appointments</h3>
            {safeAppointments.length > 0 ? (
              <div className="appointments-list">
                {safeAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.appointmentId} className="appointment-card">
                    <div className="appointment-header">
                      <h4>Patient: {safeRender(appointment.patientUser?.username)}</h4>
                      <span className={`status ${appointment.status?.toLowerCase()}`}>
                        {safeRender(appointment.status)}
                      </span>
                    </div>
                    <div className="appointment-details">
                      <p><strong>Date:</strong> {safeDateTime(appointment.appointmentDateTime)}</p>
                      <p><strong>Duration:</strong> {appointment.durationMinutes || 30} minutes</p>
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
              <div className="no-data">
                <p>No appointments found.</p>
              </div>
            )}
          </div>
        </div>
      </ErrorBoundary>
    );
  };

  // Render appointments section
  const renderAppointments = () => {
    const safeAppointments = Array.isArray(appointments) ? appointments : [];

    return (
      <ErrorBoundary>
        <div className="appointments-content">
          <div className="content-header">
            <h2>My Appointments</h2>
            <p>Manage your scheduled appointments</p>
          </div>

          {safeAppointments.length > 0 ? (
            <div className="appointments-list">
              {safeAppointments.map(appointment => (
                <div key={appointment.appointmentId} className="appointment-card">
                  <div className="appointment-header">
                    <h4>Patient: {safeRender(appointment.patientUser?.username)}</h4>
                    <span className={`status ${appointment.status?.toLowerCase()}`}>
                      {safeRender(appointment.status)}
                    </span>
                  </div>
                  <div className="appointment-details">
                    <p><strong>Date & Time:</strong> {safeDateTime(appointment.appointmentDateTime)}</p>
                    <p><strong>Duration:</strong> {appointment.durationMinutes || 30} minutes</p>
                    <p><strong>Patient Email:</strong> {safeRender(appointment.patientUser?.email)}</p>
                    {appointment.appointmentNotes && (
                      <p><strong>Notes:</strong> {safeRender(appointment.appointmentNotes)}</p>
                    )}
                  </div>
                  <div className="appointment-actions">
                    {appointment.status !== 'Completed' && (
                      <button 
                        className="btn-primary"
                        onClick={() => loadPatientRecord(appointment)}
                      >
                        View Patient Record
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">
              <p>No appointments scheduled.</p>
            </div>
          )}
        </div>
      </ErrorBoundary>
    );
  };

  // Render patient record
  const renderPatientRecord = () => (
    <ErrorBoundary>
      <div className="patient-record-content">
        {selectedAppointment ? (
          <>
            <div className="appointment-header">
              <h3>Patient Record - {patientRecord?.isPrivate ? 'Anonymous' : selectedAppointment.patientUser?.username}</h3>
              <p>Appointment: {safeDateTime(selectedAppointment.appointmentDateTime)}</p>
            </div>

            {patientRecord?.isPrivate && (
              <div className="privacy-alert">
                <i className="fas fa-lock"></i>
                <p>This patient has enabled private mode. Some information will be hidden for privacy reasons.</p>
              </div>
            )}

            <PatientRecordSection
              record={patientRecord}
              onSave={handleSavePatientRecord}
              onImageUpload={handleUploadImage}
              hideImage={patientRecord?.isPrivate}
            />

            {/* ARV Treatments Section */}
            <div className="arv-treatments-section">
              <div className="section-header">
                <h3>ARV Treatments</h3>
                <button 
                  className="btn-secondary"
                  onClick={() => { loadTemplates(); setShowTemplateModal(true); }}
                  style={{ marginRight: 8 }}
                >
                  Select from templates
                </button>
                <button 
                  className="btn-primary"
                  onClick={() => setShowARVModal(true)}
                >
                  Create custom ARV
                </button>
              </div>

              {Array.isArray(arvTreatments) && arvTreatments.length > 0 ? (
                <div className="treatments-list">
                  {arvTreatments.map(treatment => (
                    <div key={treatment.arvTreatmentId} className="treatment-card">
                      <div className="treatment-header">
                        <h4>{safeRender(treatment.regimen)}</h4>
                        <span className={`status ${treatment.isActive ? 'active' : 'inactive'}`}>
                          {treatment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="treatment-details">
                        <p><strong>Start Date:</strong> {safeDate(treatment.startDate)}</p>
                        {treatment.endDate && (
                          <p><strong>End Date:</strong> {safeDate(treatment.endDate)}</p>
                        )}
                        {treatment.adherence && (
                          <p><strong>Adherence:</strong> {safeRender(treatment.adherence)}</p>
                        )}
                        {treatment.sideEffects && (
                          <p><strong>Side Effects:</strong> {safeRender(treatment.sideEffects)}</p>
                        )}
                        {treatment.notes && (
                          <p><strong>Notes:</strong> {safeRender(treatment.notes)}</p>
                        )}
                      </div>
                      <div className="treatment-actions">
                        <button 
                          className="btn-danger"
                          onClick={() => handleDeleteARV(treatment.arvTreatmentId)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>No ARV treatments recorded.</p>
                </div>
              )}
            </div>

            {/* Appointment Update Section */}
            <div className="appointment-update-section">
              <h3>Update Appointment</h3>
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
                    max="120"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Notes:</label>
                <textarea
                  name="notes"
                  value={appointmentUpdateData.notes}
                  onChange={handleAppointmentUpdateChange}
                  rows="3"
                  placeholder="Add appointment notes..."
                />
              </div>
              <button 
                className="btn-primary"
                onClick={handleUpdateAppointment}
              >
                Update Appointment
              </button>
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
  const renderAvailability = () => {
    const safeAvailabilitySlots = Array.isArray(availabilitySlots) ? availabilitySlots : [];

    return (
      <div className="availability-content">
        <h3>Manage Your Availability</h3>
        <ErrorBoundary>
          <UnifiedCalendar
            slots={safeAvailabilitySlots}
            userRole="doctor"
            currentUserId={user?.userId || user?.id}
            doctorInfo={{
              userId: user?.userId || user?.id,
              firstName: user?.firstName || 'Doctor',
              lastName: user?.lastName || user?.username || ''
            }}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
            onBookSlot={null}
            onCancelBooking={null}
          />
        </ErrorBoundary>
      </div>
    );
  };

  // Render notifications tab
  const renderNotifications = () => (
    <ErrorBoundary>
      <NotificationManagerTab isActive={activeTab === 'notifications'} />
    </ErrorBoundary>
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
      case 'notifications':
        return renderNotifications();
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
        title="Doctor Dashboard"
        subtitle={`Welcome, Dr. ${doctorName}`}
      />

      <div className="dashboard-layout">
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

        <div className="dashboard-main">
          <div className="dashboard-content">
            {error && (
              <div className="error-banner">
                <span>{error}</span>
                <button 
                  className="close-error"
                  onClick={() => setError('')}
                >
                  ×
                </button>
              </div>
            )}

            {renderContent()}
          </div>
        </div>
      </div>

      {/* ARV Template Modal */}
      {showTemplateModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              width: '700px',
              maxWidth: '95vw',
              minHeight: '350px',
              maxHeight: '80vh',
              overflow: 'visible',
              padding: '2rem'
            }}
          >
            <div className="modal-header" style={{ marginBottom: '1rem' }}>
              <h3>Select ARV Template</h3>
              <button className="close-btn" onClick={() => setShowTemplateModal(false)}>×</button>
            </div>
            <div
              style={{
                maxHeight: '55vh',
                overflowY: 'auto',
                minHeight: '180px'
              }}
            >
              {arvTemplates.length === 0 ? (
                <div>No templates available.</div>
              ) : (
                <table className="patient-detail-table" style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th>Regimen</th>
                      <th>Adherence</th>
                      <th>Side Effects</th>
                      <th>Notes</th>
                      <th>Type</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arvTemplates.map(tpl => (
                      <tr key={tpl.arvTreatmentId}>
                        <td>{tpl.regimen}</td>
                        <td>{tpl.adherence}</td>
                        <td>{tpl.sideEffects}</td>
                        <td>{tpl.notes}</td>
                        <td>
                          {tpl.notes === 'default template'
                            ? 'Default'
                            : tpl.notes === 'template'
                            ? 'Template'
                            : 'Custom'}
                        </td>
                        <td>
                          <button
                            className="btn-primary"
                            onClick={() => handleSelectTemplate(tpl)}
                          >
                            Use
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ARV Treatment Modal */}
      {showARVModal && (
        <ARVTreatmentModal
          isOpen={showARVModal}
          onClose={() => setShowARVModal(false)}
          onSubmit={handleAddARV}
          formData={arvFormData}
          onChange={handleARVChange}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;
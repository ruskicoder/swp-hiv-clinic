import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);
  
  // Error states
  const [appointmentsError, setAppointmentsError] = useState('');
  const [slotsError, setSlotsError] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    slotDate: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // ARV Treatment form state
  const [arvFormData, setArvFormData] = useState({
    regimen: '',
    startDate: '',
    endDate: '',
    adherence: '',
    sideEffects: '',
    notes: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    setAppointmentsError('');
    setSlotsError('');

    try {
      console.log('Loading doctor dashboard data...');
      
      // Initialize with empty arrays
      setAppointments([]);
      setAvailabilitySlots([]);
      
      // Load appointments and availability slots concurrently
      const [appointmentsResult, slotsResult] = await Promise.allSettled([
        apiClient.get('/appointments/doctor/my-appointments'),
        apiClient.get('/doctors/availability/my-slots')
      ]);

      // Handle appointments
      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.data) {
        const appointmentsData = Array.isArray(appointmentsResult.value.data) ? appointmentsResult.value.data : [];
        setAppointments(appointmentsData);
      } else {
        setAppointmentsError('Failed to load appointments');
      }

      // Handle availability slots
      if (slotsResult.status === 'fulfilled' && slotsResult.value?.data) {
        const slotsData = Array.isArray(slotsResult.value.data) ? slotsResult.value.data : [];
        setAvailabilitySlots(slotsData);
      } else {
        setSlotsError('Failed to load availability slots');
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this availability slot?')) {
      return;
    }

    try {
      await apiClient.delete(`/doctors/availability/${slotId}`);
      loadDashboardData();
    } catch (error) {
      console.error('Delete slot error:', error);
      setError('Failed to delete availability slot');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Load patient record for selected appointment
  const loadPatientRecord = async (patientId) => {
    try {
      const response = await apiClient.get(`/patient-records/${patientId}`);
      setPatientRecord(response.data);
      
      // Load ARV treatments for this patient
      const arvResponse = await apiClient.get(`/arv-treatments/patient/${patientId}`);
      setArvTreatments(arvResponse.data || []);
    } catch (error) {
      console.error('Error loading patient record:', error);
      setPatientRecord(null);
      setArvTreatments([]);
    }
  };

  // Handle appointment status update
  const handleUpdateAppointmentStatus = async (appointmentId, newStatus, notes = '') => {
    try {
      await apiClient.put(`/appointments/${appointmentId}/status`, {
        status: newStatus,
        notes: notes
      });
      
      // Reload appointments
      loadDashboardData();
      
      // If completing appointment, show ARV treatment form
      if (newStatus === 'Completed') {
        setActiveTab('add-treatment');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Failed to update appointment status');
    }
  };

  // Handle ARV treatment submission
  const handleAddARVTreatment = async (e) => {
    e.preventDefault();
    
    if (!selectedAppointment) {
      setFormError('No appointment selected');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const treatmentData = {
        ...arvFormData,
        patientUserId: selectedAppointment.patientUserId,
        appointmentId: selectedAppointment.appointmentId
      };

      await apiClient.post('/arv-treatments/add', treatmentData);
      
      // Reset form
      setArvFormData({
        regimen: '',
        startDate: '',
        endDate: '',
        adherence: '',
        sideEffects: '',
        notes: ''
      });
      
      // Reload patient record
      if (selectedAppointment.patientUserId) {
        loadPatientRecord(selectedAppointment.patientUserId);
      }
      
      alert('ARV treatment added successfully');
      setActiveTab('appointments');
    } catch (error) {
      console.error('Error adding ARV treatment:', error);
      setFormError('Failed to add ARV treatment');
    } finally {
      setFormLoading(false);
    }
  };

  // Form handlers for availability
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleARVChange = (e) => {
    setArvFormData({
      ...arvFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      await apiClient.post('/doctors/availability/add', formData);
      setFormData({
        slotDate: '',
        startTime: '',
        endTime: '',
        notes: ''
      });
      loadDashboardData();
      alert('Availability slot added successfully');
    } catch (error) {
      console.error('Add availability error:', error);
      setFormError('Failed to add availability slot');
    } finally {
      setFormLoading(false);
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'My Appointments', icon: '📅' },
    { id: 'availability', label: 'My Availability', icon: '🕒' },
    { id: 'add-availability', label: 'Add Availability', icon: '➕' },
    { id: 'add-treatment', label: 'Add ARV Treatment', icon: '💊' }
  ];

  const renderOverview = () => (
    <ErrorBoundary>
      <div className="overview-section">
        <div className="content-header">
          <h2>Doctor Dashboard</h2>
          <p>Welcome back, Dr. {user?.firstName || ''} {user?.lastName || ''}</p>
        </div>

        {(appointmentsError || slotsError) && (
          <div className="error-message">
            {appointmentsError && <div>{appointmentsError}</div>}
            {slotsError && <div>{slotsError}</div>}
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <p className="stat-number">{appointments?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Today's Appointments</h3>
            <p className="stat-number">
              {appointments?.filter(apt => {
                try {
                  const today = new Date().toDateString();
                  return new Date(apt?.appointmentDateTime).toDateString() === today;
                } catch {
                  return false;
                }
              }).length || 0}
            </p>
          </div>
          <div className="stat-card">
            <h3>Available Slots</h3>
            <p className="stat-number">{availabilitySlots?.filter(slot => !slot?.isBooked).length || 0}</p>
          </div>
        </div>

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
          <p>Manage your scheduled appointments</p>
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
                    <h4>Patient: {safeRender(appointment?.patientName)}</h4>
                    <p><strong>Date:</strong> {safeDate(appointment?.appointmentDateTime)}</p>
                    <p><strong>Time:</strong> {safeDateTime(appointment?.appointmentDateTime)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${appointment?.status?.toLowerCase()}`}>
                        {safeRender(appointment?.status)}
                      </span>
                    </p>
                    {appointment?.notes && <p><strong>Notes:</strong> {safeRender(appointment?.notes)}</p>}
                  </div>
                  <div className="appointment-actions">
                    {appointment?.status === 'Scheduled' && (
                      <>
                        <button 
                          className="btn-primary"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            loadPatientRecord(appointment.patientUserId);
                            setActiveTab('patient-record');
                          }}
                        >
                          View Patient Record
                        </button>
                        <button 
                          className="btn-success"
                          onClick={() => handleUpdateAppointmentStatus(appointment.appointmentId, 'Completed')}
                        >
                          Mark Complete
                        </button>
                        <button 
                          className="btn-warning"
                          onClick={() => {
                            const reason = prompt('Reason for cancellation:');
                            if (reason) {
                              handleUpdateAppointmentStatus(appointment.appointmentId, 'CancelledByDoctor', reason);
                            }
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {appointment?.status === 'Completed' && (
                      <button 
                        className="btn-primary"
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          loadPatientRecord(appointment.patientUserId);
                          setActiveTab('patient-record');
                        }}
                      >
                        View Patient Record
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

  const renderPatientRecord = () => (
    <ErrorBoundary>
      <div className="patient-record-section">
        <div className="content-header">
          <h2>Patient Medical Record</h2>
          {selectedAppointment && (
            <p>Patient: {safeRender(selectedAppointment.patientName)}</p>
          )}
        </div>

        {patientRecord ? (
          <div className="patient-record-content">
            <div className="record-section">
              <h3>Medical Information</h3>
              <div className="record-grid">
                <div className="record-item">
                  <label>Medical History:</label>
                  <p>{patientRecord.medicalHistory || 'No medical history recorded'}</p>
                </div>
                <div className="record-item">
                  <label>Allergies:</label>
                  <p>{patientRecord.allergies || 'No allergies recorded'}</p>
                </div>
                <div className="record-item">
                  <label>Current Medications:</label>
                  <p>{patientRecord.currentMedications || 'No current medications'}</p>
                </div>
                <div className="record-item">
                  <label>Blood Type:</label>
                  <p>{patientRecord.bloodType || 'Not specified'}</p>
                </div>
                <div className="record-item">
                  <label>Emergency Contact:</label>
                  <p>{patientRecord.emergencyContact || 'Not specified'}</p>
                </div>
                <div className="record-item">
                  <label>Emergency Phone:</label>
                  <p>{patientRecord.emergencyPhone || 'Not specified'}</p>
                </div>
                <div className="record-item">
                  <label>Notes:</label>
                  <p>{patientRecord.notes || 'No additional notes'}</p>
                </div>
              </div>
            </div>

            <div className="arv-treatments-section">
              <h3>ARV Treatment History</h3>
              {arvTreatments.length === 0 ? (
                <p>No ARV treatments recorded</p>
              ) : (
                <div className="treatments-list">
                  {arvTreatments.map((treatment, index) => (
                    <div key={treatment.arvTreatmentId || index} className="treatment-card">
                      <h4>{treatment.regimen}</h4>
                      <p><strong>Start Date:</strong> {safeDate(treatment.startDate)}</p>
                      <p><strong>End Date:</strong> {treatment.endDate ? safeDate(treatment.endDate) : 'Ongoing'}</p>
                      <p><strong>Adherence:</strong> {treatment.adherence || 'Not specified'}</p>
                      {treatment.sideEffects && (
                        <p><strong>Side Effects:</strong> {treatment.sideEffects}</p>
                      )}
                      {treatment.notes && (
                        <p><strong>Notes:</strong> {treatment.notes}</p>
                      )}
                      <p><strong>Status:</strong> 
                        <span className={`status ${treatment.isActive ? 'active' : 'inactive'}`}>
                          {treatment.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="record-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  setSelectedAppointment(selectedAppointment);
                  setActiveTab('add-treatment');
                }}
              >
                Add ARV Treatment
              </button>
              <button 
                className="btn-secondary"
                onClick={() => setActiveTab('appointments')}
              >
                Back to Appointments
              </button>
            </div>
          </div>
        ) : (
          <div className="no-data">
            <p>No patient record found or failed to load.</p>
            <button 
              className="refresh-btn" 
              onClick={() => selectedAppointment && loadPatientRecord(selectedAppointment.patientUserId)}
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAddTreatment = () => (
    <ErrorBoundary>
      <div className="add-treatment-section">
        <div className="content-header">
          <h2>Add ARV Treatment</h2>
          {selectedAppointment && (
            <p>Patient: {safeRender(selectedAppointment.patientName)}</p>
          )}
        </div>

        {!selectedAppointment ? (
          <div className="no-data">
            <p>Please select an appointment first to add ARV treatment.</p>
            <button 
              className="btn-primary"
              onClick={() => setActiveTab('appointments')}
            >
              Go to Appointments
            </button>
          </div>
        ) : (
          <form onSubmit={handleAddARVTreatment} className="treatment-form">
            {formError && (
              <div className="error-message">
                {formError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="regimen">ARV Regimen *</label>
              <input
                type="text"
                id="regimen"
                name="regimen"
                value={arvFormData.regimen}
                onChange={handleARVChange}
                placeholder="e.g., TDF/3TC/EFV"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDate">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={arvFormData.startDate}
                  onChange={handleARVChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date (Optional)</label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={arvFormData.endDate}
                  onChange={handleARVChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adherence">Adherence</label>
              <select
                id="adherence"
                name="adherence"
                value={arvFormData.adherence}
                onChange={handleARVChange}
              >
                <option value="">Select adherence level</option>
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="sideEffects">Side Effects</label>
              <textarea
                id="sideEffects"
                name="sideEffects"
                value={arvFormData.sideEffects}
                onChange={handleARVChange}
                placeholder="Document any side effects experienced..."
                rows="3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Treatment Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={arvFormData.notes}
                onChange={handleARVChange}
                placeholder="Additional notes about the treatment..."
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={formLoading}>
                {formLoading ? 'Adding Treatment...' : 'Add ARV Treatment'}
              </button>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => setActiveTab('appointments')}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAvailability = () => (
    <ErrorBoundary>
      <div className="availability-section">
        <div className="content-header">
          <h2>My Availability</h2>
          <p>Manage your available time slots</p>
        </div>

        {slotsError && (
          <div className="error-message">
            {slotsError}
          </div>
        )}

        {!availabilitySlots || availabilitySlots.length === 0 ? (
          <div className="no-data">
            <p>No availability slots found.</p>
            <button className="refresh-btn" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="slots-list">
            {availabilitySlots.map((slot, index) => (
              <ErrorBoundary key={slot?.availabilitySlotId || index}>
                <div className="slot-card">
                  <div className="slot-details">
                    <h4>{safeDate(slot?.slotDate)}</h4>
                    <p><strong>Time:</strong> {safeRender(slot?.startTime)} - {safeRender(slot?.endTime)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${slot?.isBooked ? 'booked' : 'available'}`}>
                        {slot?.isBooked ? 'Booked' : 'Available'}
                      </span>
                    </p>
                    {slot?.notes && <p><strong>Notes:</strong> {safeRender(slot?.notes)}</p>}
                  </div>
                  <div className="slot-actions">
                    {!slot?.isBooked && (
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteSlot(slot?.availabilitySlotId)}
                      >
                        Delete
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

  const AddAvailabilityForm = () => (
    <ErrorBoundary>
      <div className="add-availability-section">
        <div className="content-header">
          <h2>Add Availability Slot</h2>
          <p>Create new time slots for patient appointments</p>
        </div>

        <form onSubmit={handleSubmit} className="availability-form">
          {formError && (
            <div className="error-message">
              {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="slotDate">Date</label>
            <input
              type="date"
              id="slotDate"
              name="slotDate"
              value={formData.slotDate}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any notes about this availability slot..."
              rows="3"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={formLoading}>
            {formLoading ? 'Adding...' : 'Add Availability Slot'}
          </button>
        </form>
      </div>
    </ErrorBoundary>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'appointments':
        return renderAppointments();
      case 'availability':
        return renderAvailability();
      case 'add-availability':
        return <AddAvailabilityForm />;
      case 'patient-record':
        return renderPatientRecord();
      case 'add-treatment':
        return renderAddTreatment();
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="doctor-dashboard">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="doctor-dashboard">
      <DashboardHeader 
        title="Doctor Dashboard" 
        subtitle={`Welcome, Dr. ${user?.firstName || user?.username || 'Doctor'}`}
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
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
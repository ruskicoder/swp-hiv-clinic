import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './AdminDashboard.css';

// --- SOLUTION: Define CreateDoctorForm as a standalone component ---
// It receives all the data and functions it needs from its parent via props.
const CreateDoctorForm = ({
  preservedFormData,
  setPreservedFormData,
  specialties,
  specialtiesLoading,
  specialtiesError,
  loadDashboardData,
  setActiveTab
}) => {
  console.log('🔍 DEBUG: CreateDoctorForm component rendering');
  
  const [formData, setFormData] = useState(() => ({
    username: preservedFormData.username || '',
    email: preservedFormData.email || '',
    password: preservedFormData.password || '',
    firstName: preservedFormData.firstName || '',
    lastName: preservedFormData.lastName || '',
    phoneNumber: preservedFormData.phoneNumber || '',
    specialtyId: preservedFormData.specialtyId || '',
    bio: preservedFormData.bio || ''
  }));
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 DEBUG: Form submission started with data:', formData);
    
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      // Validation
      if (!formData.username || !formData.email || !formData.password ||
          !formData.firstName || !formData.lastName || !formData.specialtyId) {
        setFormError('Please fill in all required fields, including specialty.');
        setFormLoading(false);
        return;
      }

      // Prepare form data for x-www-form-urlencoded
      const formDataToSend = new URLSearchParams();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('firstName', formData.firstName);
      formDataToSend.append('lastName', formData.lastName);
      formDataToSend.append('phoneNumber', formData.phoneNumber || '');
      formDataToSend.append('specialtyId', formData.specialtyId || '');
      formDataToSend.append('bio', formData.bio || '');

      const response = await apiClient.post('/admin/doctors', formDataToSend, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data && (response.data.success || response.data.isSuccess)) {
        setFormSuccess('Doctor created successfully!');
        
        // Reset form
        const resetData = { username: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', specialtyId: '', bio: '' };
        setFormData(resetData);
        setPreservedFormData(resetData);
        
        // Use props to trigger parent actions
        loadDashboardData();
        setTimeout(() => {
          setActiveTab('doctors');
        }, 1500);
      } else {
        const errorMsg = response.data?.message || response.data?.msg || 'Failed to create doctor';
        setFormError(errorMsg);
      }
    } catch (error) {
      const errorMsg = error?.response?.data?.message || error?.response?.data?.msg || error?.response?.data?.error || error?.message || 'An unexpected error occurred.';
      setFormError(errorMsg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value
    };
    setFormData(updatedData);
    // Use prop to update parent state
    setPreservedFormData(updatedData);
  };

  return (
    <ErrorBoundary>
      <div className="create-doctor-section">
        <div className="content-header">
          <h2>Create Doctor Account</h2>
          <p>Add a new doctor to the system</p>
        </div>

        {specialtiesLoading && (
          <div className="loading-message">
            <p>Loading form data...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-doctor-form">
          {formError && <div className="error-message">{formError}</div>}
          {formSuccess && <div className="success-message">{formSuccess}</div>}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="specialtyId">Specialty</label>
            <select id="specialtyId" name="specialtyId" value={formData.specialtyId} onChange={handleChange} disabled={specialtiesLoading} required>
              <option value="">{specialtiesLoading ? 'Loading...' : 'Select a specialty...'}</option>
              {!specialtiesLoading && specialties.map((specialty, index) => (
                <option key={specialty?.specialtyId || index} value={specialty?.specialtyId}>
                  {safeRender(specialty?.specialtyName)}
                </option>
              ))}
            </select>
            {specialtiesError && <div className="field-error">{specialtiesError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="bio">Biography</label>
            <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Enter doctor's biography..." rows="4" />
          </div>

          <button type="submit" className="submit-btn" disabled={formLoading || specialtiesLoading}>
            {formLoading ? 'Creating...' : 'Create Doctor'}
          </button>
        </form>
      </div>
    </ErrorBoundary>
  );
};


const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  // Loading states
  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);

  // Error states
  const [usersError, setUsersError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');
  const [specialtiesError, setSpecialtiesError] = useState('');

  // Tab transition state
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Form state preservation
  const [preservedFormData, setPreservedFormData] = useState({});

  const loadDashboardData = useCallback(async () => {
    // Only set main loading on initial load, not for re-fetches
    // setLoading(true); 
    setError('');
    setUsersError('');
    setAppointmentsError('');
    setSpecialtiesLoading(true);
    setSpecialtiesError('');

    try {
      console.log('Loading admin dashboard data...');
      
      const [usersResult, patientsResult, doctorsResult, appointmentsResult, specialtiesResult] = await Promise.allSettled([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/patients'),
        apiClient.get('/admin/doctors'),
        apiClient.get('/admin/appointments'),
        apiClient.get('/admin/specialties')
      ]);

      if (usersResult.status === 'fulfilled' && usersResult.value?.data) {
        setUsers(Array.isArray(usersResult.value.data) ? usersResult.value.data : []);
      } else { setUsersError('Failed to load users'); }

      if (patientsResult.status === 'fulfilled' && patientsResult.value?.data) {
        setPatients(Array.isArray(patientsResult.value.data) ? patientsResult.value.data : []);
      }

      if (doctorsResult.status === 'fulfilled' && doctorsResult.value?.data) {
        setDoctors(Array.isArray(doctorsResult.value.data) ? doctorsResult.value.data : []);
      }

      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.data) {
        setAppointments(Array.isArray(appointmentsResult.value.data) ? appointmentsResult.value.data : []);
      } else { setAppointmentsError('Failed to load appointments'); }

      if (specialtiesResult.status === 'fulfilled' && specialtiesResult.value?.data) {
        setSpecialties(Array.isArray(specialtiesResult.value.data) ? specialtiesResult.value.data : []);
      } else { setSpecialtiesError('Failed to load specialties'); }

    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setSpecialtiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const _handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await apiClient.put(`/admin/users/${userId}/toggle-status`);
      loadDashboardData();
    } catch (error) {
      console.error('Toggle user status error:', error);
      setError('Failed to toggle user status');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      await apiClient.put(`/admin/users/${userId}/reset-password`, null, { params: { newPassword } });
      alert('Password reset successfully');
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Failed to reset password');
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Manage Users', icon: '👥' },
    { id: 'doctors', label: 'Manage Doctors', icon: '👨‍⚕️' },
    { id: 'appointments', label: 'All Appointments', icon: '📅' },
    { id: 'create-doctor', label: 'Create Doctor', icon: '➕' }
  ];

  const renderOverview = () => (
    <ErrorBoundary>
      <div className="overview-section">
        <div className="content-header"><h2>Admin Dashboard</h2></div>
        <div className="stats-grid">
          <div className="stat-card"><h3>Total Users</h3><p className="stat-number">{users?.length || 0}</p></div>
          <div className="stat-card"><h3>Total Patients</h3><p className="stat-number">{patients?.length || 0}</p></div>
          <div className="stat-card"><h3>Total Doctors</h3><p className="stat-number">{doctors?.length || 0}</p></div>
          <div className="stat-card"><h3>Total Appointments</h3><p className="stat-number">{appointments?.length || 0}</p></div>
        </div>
        {error && <div className="error-message">{error}<button onClick={loadDashboardData} className="retry-btn">Retry</button></div>}
      </div>
    </ErrorBoundary>
  );

  const renderUsers = () => (
    <ErrorBoundary>
      <div className="users-section">
        <div className="content-header"><h2>Manage Users</h2><p>View and manage all system users</p></div>
        {usersError && <div className="error-message">{usersError}</div>}
        {!users || users.length === 0 ? (
          <div className="no-data"><p>No users found.</p><button className="refresh-btn" onClick={loadDashboardData}>Refresh</button></div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((userItem, index) => (
                  <tr key={userItem?.userId || index}>
                    <td>{safeRender(userItem?.username)}</td>
                    <td>{safeRender(userItem?.email)}</td>
                    <td>{safeRender(userItem?.role?.roleName || userItem?.role)}</td>
                    <td><span className={`status-badge ${userItem?.isActive ? 'active' : 'inactive'}`}>{userItem?.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>{safeDate(userItem?.createdAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-toggle" onClick={() => handleToggleUserStatus(userItem?.userId)}>{userItem?.isActive ? 'Deactivate' : 'Activate'}</button>
                        <button className="btn-reset" onClick={() => handleResetPassword(userItem?.userId)}>Reset Password</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderDoctors = () => (
    <ErrorBoundary>
      <div className="doctors-section">
        <div className="content-header"><h2>Manage Doctors</h2><p>View and manage doctor accounts</p></div>
        {!doctors || doctors.length === 0 ? (
          <div className="no-data"><p>No doctors found.</p><button className="refresh-btn" onClick={loadDashboardData}>Refresh</button></div>
        ) : (
          <div className="doctors-grid">
            {doctors.map((doctor, index) => (
              <ErrorBoundary key={doctor?.userId || index}>
                <div className="doctor-card">
                  <h4>Dr. {safeRender(doctor?.username)}</h4>
                  <p><strong>Email:</strong> {safeRender(doctor?.email)}</p>
                  <p><strong>Status:</strong><span className={`status-badge ${doctor?.isActive ? 'active' : 'inactive'}`}>{doctor?.isActive ? 'Active' : 'Inactive'}</span></p>
                  <p><strong>Created:</strong> {safeDate(doctor?.createdAt)}</p>
                  <div className="doctor-actions">
                    <button className="btn-toggle" onClick={() => handleToggleUserStatus(doctor?.userId)}>{doctor?.isActive ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </div>
              </ErrorBoundary>
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="appointments-section">
        <div className="content-header"><h2>All Appointments</h2><p>View all system appointments</p></div>
        {appointmentsError && <div className="error-message">{appointmentsError}</div>}
        {!appointments || appointments.length === 0 ? (
          <div className="no-data"><p>No appointments found.</p><button className="refresh-btn" onClick={loadDashboardData}>Refresh</button></div>
        ) : (
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead><tr><th>Patient</th><th>Doctor</th><th>Date & Time</th><th>Duration</th><th>Status</th><th>Notes</th></tr></thead>
              <tbody>
                {appointments.map((appointment, index) => (
                  <tr key={appointment?.appointmentId || index}>
                    <td>{safeRender(appointment?.patientUser?.username, 'Unknown Patient')}</td>
                    <td>Dr. {safeRender(appointment?.doctorUser?.username, 'Unknown Doctor')}</td>
                    <td>{safeDateTime(appointment?.appointmentDateTime)}</td>
                    <td>{safeRender(appointment?.durationMinutes, '30')} min</td>
                    <td><span className={`status ${safeRender(appointment?.status, 'unknown').toLowerCase()}`}>{safeRender(appointment?.status, 'Unknown')}</span></td>
                    <td>{safeRender(appointment?.appointmentNotes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="admin-dashboard">
      <DashboardHeader title="Admin Dashboard" subtitle="System overview and management" />
      <div className="dashboard-layout">
        <aside className="manager-sidebar">
          {navigationItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-option${activeTab === item.id ? ' active' : ''}`}
              onClick={() => {
                setIsTabChanging(true);
                setActiveTab(item.id);
                setTimeout(() => setIsTabChanging(false), 300);
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </aside>
        <main className="dashboard-main">
          {isTabChanging ? (
            <div className="tab-transition-loading"><p>Loading...</p></div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'doctors' && renderDoctors()}
              {activeTab === 'appointments' && renderAppointments()}
              {activeTab === 'create-doctor' && (
                // --- SOLUTION: Render the standalone component and pass props ---
                <CreateDoctorForm 
                  preservedFormData={preservedFormData}
                  setPreservedFormData={setPreservedFormData}
                  specialties={specialties}
                  specialtiesLoading={specialtiesLoading}
                  specialtiesError={specialtiesError}
                  loadDashboardData={loadDashboardData}
                  setActiveTab={setActiveTab}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
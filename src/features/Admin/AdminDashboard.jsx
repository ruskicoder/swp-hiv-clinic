import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './AdminDashboard.css';

// --- CreateDoctorForm (Standalone Component) ---
const CreateDoctorForm = ({
  preservedFormData,
  setPreservedFormData,
  specialties,
  specialtiesLoading,
  specialtiesError,
  loadDashboardData,
  setActiveTab
}) => {
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
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');

    try {
      if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName || !formData.specialtyId) {
        setFormError('Please fill in all required fields, including specialty.');
        setFormLoading(false);
        return;
      }

      const formDataToSend = new URLSearchParams();
      Object.keys(formData).forEach(key => formDataToSend.append(key, formData[key] || ''));

      const response = await apiClient.post('/admin/doctors', formDataToSend, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.data && (response.data.success || response.data.isSuccess)) {
        setFormSuccess('Doctor created successfully!');
        const resetData = { username: '', email: '', password: '', firstName: '', lastName: '', phoneNumber: '', specialtyId: '', bio: '' };
        setFormData(resetData);
        setPreservedFormData(resetData);
        loadDashboardData();
        setTimeout(() => setActiveTab('doctors'), 1500);
      } else {
        setFormError(response.data?.message || 'Failed to create doctor');
      }
    } catch (error) {
      setFormError(error?.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    setPreservedFormData(updatedData);
  };

  return (
    <ErrorBoundary>
      <div className="create-doctor-section">
        <div className="content-header">
          <h2>Create Doctor Account</h2>
          <p>Add a new doctor to the system</p>
        </div>
        {specialtiesLoading && <div className="loading-message"><p>Loading form data...</p></div>}
        <form onSubmit={handleSubmit} className="create-doctor-form">
          {formError && <div className="error-message">{formError}</div>}
          {formSuccess && <div className="success-message">{formSuccess}</div>}
          <div className="form-row">
            <div className="form-group"><label htmlFor="username">Username</label><input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required /></div>
            <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required /></div>
          </div>
          <div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required /></div>
          <div className="form-row">
            <div className="form-group"><label htmlFor="firstName">First Name</label><input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required /></div>
            <div className="form-group"><label htmlFor="lastName">Last Name</label><input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required /></div>
          </div>
          <div className="form-group"><label htmlFor="phoneNumber">Phone Number</label><input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} /></div>
          <div className="form-group">
            <label htmlFor="specialtyId">Specialty</label>
            <select id="specialtyId" name="specialtyId" value={formData.specialtyId} onChange={handleChange} disabled={specialtiesLoading} required>
              <option value="">{specialtiesLoading ? 'Loading...' : 'Select a specialty...'}</option>
              {!specialtiesLoading && specialties.map((specialty, index) => (
                <option key={specialty?.specialtyId || index} value={specialty?.specialtyId}>{safeRender(specialty?.specialtyName)}</option>
              ))}
            </select>
            {specialtiesError && <div className="field-error">{specialtiesError}</div>}
          </div>
          <div className="form-group"><label htmlFor="bio">Biography</label><textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} placeholder="Enter doctor's biography..." rows="4" /></div>
          <button type="submit" className="submit-btn" disabled={formLoading || specialtiesLoading}>{formLoading ? 'Creating...' : 'Create Doctor'}</button>
        </form>
      </div>
    </ErrorBoundary>
  );
};

// --- CreateManagerForm ---
const CreateManagerForm = ({
  preservedFormData,
  setPreservedFormData,
  loadDashboardData,
  setActiveTab
}) => {
  const [formData, setFormData] = useState(() => ({
    username: preservedFormData.username || '',
    email: preservedFormData.email || '',
    password: preservedFormData.password || '',
    firstName: preservedFormData.firstName || '',
    lastName: preservedFormData.lastName || '',
  }));
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      if (!formData.username || !formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        setFormError('Please fill in all required fields.');
        setFormLoading(false);
        return;
      }
      const response = await apiClient.post('/admin/managers', formData);
      if (response.data && (response.data.success || response.data.isSuccess)) {
        setFormSuccess('Manager created successfully!');
        const resetData = { username: '', email: '', password: '', firstName: '', lastName: '' };
        setFormData(resetData);
        setPreservedFormData(resetData);
        loadDashboardData();
        setTimeout(() => setActiveTab('managers'), 1500);
      } else {
        setFormError(response.data?.message || 'Failed to create manager');
      }
    } catch (error) {
      setFormError(error?.response?.data?.message || 'An unexpected error occurred.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };
    setFormData(updatedData);
    setPreservedFormData(updatedData);
  };

  return (
    <ErrorBoundary>
      <div className="create-manager-section">
        <div className="content-header">
          <h2>Create Manager Account</h2>
          <p>Add a new manager to the system</p>
        </div>
        <form onSubmit={handleSubmit} className="create-manager-form">
          {formError && <div className="error-message">{formError}</div>}
          {formSuccess && <div className="success-message">{formSuccess}</div>}
          <div className="form-row">
            <div className="form-group"><label htmlFor="username">Username</label><input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required /></div>
            <div className="form-group"><label htmlFor="email">Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required /></div>
          </div>
          <div className="form-group"><label htmlFor="password">Password</label><input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required /></div>
          <div className="form-row">
            <div className="form-group"><label htmlFor="firstName">First Name</label><input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required /></div>
            <div className="form-group"><label htmlFor="lastName">Last Name</label><input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required /></div>
          </div>
          <button type="submit" className="submit-btn" disabled={formLoading}>{formLoading ? 'Creating...' : 'Create Manager'}</button>
        </form>
      </div>
    </ErrorBoundary>
  );
};

// ----- Component chính: AdminDashboard -----
const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [managers, setManagers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  const [specialtiesLoading, setSpecialtiesLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');
  const [specialtiesError, setSpecialtiesError] = useState('');
  const [managersError, setManagersError] = useState('');

  const [isTabChanging, setIsTabChanging] = useState(false);
  const [preservedFormData, setPreservedFormData] = useState({});

  const loadDashboardData = useCallback(async () => {
    setError(''); setUsersError(''); setAppointmentsError(''); setSpecialtiesError(''); setManagersError('');
    setSpecialtiesLoading(true);
    try {
      const results = await Promise.allSettled([
        apiClient.get('/admin/users'), apiClient.get('/admin/patients'),
        apiClient.get('/admin/doctors'), apiClient.get('/admin/managers'),
        apiClient.get('/admin/appointments'), apiClient.get('/admin/specialties')
      ]);
      const [usersResult, patientsResult, doctorsResult, managersResult, appointmentsResult, specialtiesResult] = results;
      
      setUsers(usersResult.status === 'fulfilled' ? usersResult.value.data : []);
      if (usersResult.status === 'rejected') setUsersError('Failed to load users');

      setPatients(patientsResult.status === 'fulfilled' ? patientsResult.value.data : []);

      setDoctors(doctorsResult.status === 'fulfilled' ? doctorsResult.value.data : []);

      setManagers(managersResult.status === 'fulfilled' ? managersResult.value.data : []);
      if (managersResult.status === 'rejected') setManagersError('Failed to load managers');

      setAppointments(appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.data : []);
      if (appointmentsResult.status === 'rejected') setAppointmentsError('Failed to load appointments');
      
      setSpecialties(specialtiesResult.status === 'fulfilled' ? specialtiesResult.value.data : []);
      if (specialtiesResult.status === 'rejected') setSpecialtiesError('Failed to load specialties');
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setSpecialtiesLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const handleToggleUserStatus = async (userId) => {
    try { await apiClient.put(`/admin/users/${userId}/toggle-status`); loadDashboardData(); }
    catch (err) { setError('Failed to toggle user status'); }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;
    try { await apiClient.put(`/admin/users/${userId}/reset-password`, null, { params: { newPassword } }); alert('Password reset successfully'); }
    catch (err) { setError('Failed to reset password'); }
  };
  
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' }, { id: 'users', label: 'Manage Users', icon: '👥' },
    { id: 'doctors', label: 'Manage Doctors', icon: '👨‍⚕️' }, { id: 'managers', label: 'Manage Managers', icon: '🧑‍💼' },
    { id: 'appointments', label: 'All Appointments', icon: '📅' }, { id: 'create-doctor', label: 'Create Doctor', icon: '➕' },
    { id: 'create-manager', label: 'Create Manager', icon: '➕' }
  ];

  const renderOverview = () => (
    <ErrorBoundary>
      <div className="overview-section">
        <div className="content-header"><h2>Admin Dashboard</h2></div>
        <div className="stats-grid">
          <div className="stat-card"><h3>Total Users</h3><p className="stat-number">{users?.length || 0}</p></div>
          <div className="stat-card"><h3>Total Patients</h3><p className="stat-number">{patients?.length || 0}</p></div>
          <div className="stat-card"><h3>Total Doctors</h3><p className="stat-number">{doctors?.length || 0}</p></div>
          <div className="stat-card"><h3>Total Managers</h3><p className="stat-number">{managers?.length || 0}</p></div>
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
        {!users || users.length === 0 ? <div className="no-data"><p>No users found.</p></div> : (
          <div className="users-table-container">
            <table className="users-table">
              <thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>{users.map((user, i) => <tr key={user?.userId || i}><td>{safeRender(user?.username)}</td><td>{safeRender(user?.email)}</td><td>{safeRender(user?.role?.roleName)}</td><td><span className={`status-badge ${user?.isActive ? 'active' : 'inactive'}`}>{user?.isActive ? 'Active' : 'Inactive'}</span></td><td>{safeDate(user?.createdAt)}</td><td><div className="action-buttons"><button className="btn-toggle" onClick={() => handleToggleUserStatus(user?.userId)}>{user?.isActive ? 'Deactivate' : 'Activate'}</button><button className="btn-reset" onClick={() => handleResetPassword(user?.userId)}>Reset Password</button></div></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
  
  const renderManagers = () => (
    <ErrorBoundary>
      <div className="managers-section">
        <div className="content-header"><h2>Manage Managers</h2><p>View and manage manager accounts</p></div>
        {managersError && <div className="error-message">{managersError}</div>}
        {!managers || managers.length === 0 ? <div className="no-data"><p>No managers found.</p></div> : (
          <div className="users-table-container">
            <table className="users-table">
              <thead><tr><th>Username</th><th>Email</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>{managers.map((manager, i) => <tr key={manager?.userId || i}><td>{safeRender(manager?.username)}</td><td>{safeRender(manager?.email)}</td><td><span className={`status-badge ${manager?.isActive ? 'active' : 'inactive'}`}>{manager?.isActive ? 'Active' : 'Inactive'}</span></td><td>{safeDate(manager?.createdAt)}</td><td><div className="action-buttons"><button className="btn-toggle" onClick={() => handleToggleUserStatus(manager?.userId)}>{manager?.isActive ? 'Deactivate' : 'Activate'}</button><button className="btn-reset" onClick={() => handleResetPassword(manager?.userId)}>Reset Password</button></div></td></tr>)}</tbody>
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
        {!doctors || doctors.length === 0 ? <div className="no-data"><p>No doctors found.</p></div> : (
          <div className="doctors-grid">{doctors.map((doctor, i) => <ErrorBoundary key={doctor?.userId || i}><div className="doctor-card"><h4>Dr. {safeRender(doctor?.username)}</h4><p><strong>Email:</strong> {safeRender(doctor?.email)}</p><p><strong>Status:</strong><span className={`status-badge ${doctor?.isActive ? 'active' : 'inactive'}`}>{doctor?.isActive ? 'Active' : 'Inactive'}</span></p><p><strong>Created:</strong> {safeDate(doctor?.createdAt)}</p><div className="doctor-actions"><button className="btn-toggle" onClick={() => handleToggleUserStatus(doctor?.userId)}>{doctor?.isActive ? 'Deactivate' : 'Activate'}</button></div></div></ErrorBoundary>)}</div>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="appointments-section">
        <div className="content-header"><h2>All Appointments</h2><p>View all system appointments</p></div>
        {appointmentsError && <div className="error-message">{appointmentsError}</div>}
        {!appointments || appointments.length === 0 ? <div className="no-data"><p>No appointments found.</p></div> : (
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead><tr><th>Patient</th><th>Doctor</th><th>Date & Time</th><th>Status</th></tr></thead>
              <tbody>{appointments.map((appt, i) => <tr key={appt?.appointmentId || i}><td>{safeRender(appt?.patientUser?.username)}</td><td>Dr. {safeRender(appt?.doctorUser?.username)}</td><td>{safeDateTime(appt?.appointmentDateTime)}</td><td><span className={`status ${safeRender(appt?.status).toLowerCase()}`}>{safeRender(appt?.status)}</span></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  if (loading) { return <div className="loading">Loading dashboard data...</div>; }

  return (
    <div className="admin-dashboard">
      <DashboardHeader title="Admin Dashboard" subtitle="System overview and management" />
      <div className="dashboard-layout">
        <aside className="manager-sidebar">
          {navigationItems.map(item => (
            <button key={item.id} className={`sidebar-option${activeTab === item.id ? ' active' : ''}`}
              onClick={() => {
                setIsTabChanging(true);
                const isSwitchingBetweenForms = (activeTab === 'create-doctor' && item.id === 'create-manager') || (activeTab === 'create-manager' && item.id === 'create-doctor');
                if (isSwitchingBetweenForms) {
                  setPreservedFormData({});
                }
                setActiveTab(item.id);
                setTimeout(() => setIsTabChanging(false), 300);
              }}>
              {item.icon} {item.label}
            </button>
          ))}
        </aside>
        <main className="dashboard-main">
          {isTabChanging ? <div className="tab-transition-loading"><p>Loading...</p></div> : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'doctors' && renderDoctors()}
              {activeTab === 'managers' && renderManagers()}
              {activeTab === 'appointments' && renderAppointments()}
              {activeTab === 'create-doctor' && <CreateDoctorForm {...{ preservedFormData, setPreservedFormData, specialties, specialtiesLoading, specialtiesError, loadDashboardData, setActiveTab }} />}
              {activeTab === 'create-manager' && <CreateManagerForm {...{ preservedFormData, setPreservedFormData, loadDashboardData, setActiveTab }} />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
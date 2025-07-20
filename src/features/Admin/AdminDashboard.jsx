import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './AdminDashboard.css';

// ----- COMPONENT MỚI: FORM TẠO USER THỐNG NHẤT -----
const CreateUserForm = ({ loadDashboardData, setActiveTab }) => {
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', 
    firstName: '', lastName: '', phoneNumber: '', 
    gender: '', roleName: ''
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Tải danh sách vai trò khi component được mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiClient.get('/admin/roles');
        // Lọc ra vai trò 'Admin' để tránh việc Admin tự tạo thêm Admin khác
        setRoles(response.data.filter(role => role.roleName !== 'Admin'));
      } catch (err) {
        setError('Failed to load roles list. Please check the API endpoint.');
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roleName) {
      setError('Please select a role for the new user.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Gọi đến endpoint thống nhất mới
      const response = await apiClient.post('/admin/users', formData);
      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ username: '', password: '', email: '', firstName: '', lastName: '', phoneNumber: '', gender: '', roleName: '' }); // Reset form
        loadDashboardData(); // Tải lại dữ liệu cho các bảng
        
        // Tự động chuyển đến tab quản lý tương ứng sau 1.5 giây
        setTimeout(() => {
          if (formData.roleName === 'Doctor') setActiveTab('doctors');
          else if (formData.roleName === 'Manager') setActiveTab('managers');
          else setActiveTab('users');
        }, 1500);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred during user creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="create-user-section">
        <div className="content-header">
          <h2>Create New User Account</h2>
          <p>A unified form to create any type of user account.</p>
        </div>
        <form onSubmit={handleSubmit} className="unified-create-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="form-grid">
            <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" required />
            <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" required />
            <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" required />
            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" required />
            <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number (Optional)" />
            <select name="gender" value={formData.gender} onChange={handleChange} required>
              <option value="">Select Gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select name="roleName" value={formData.roleName} onChange={handleChange} required>
              <option value="">Select a Role...</option>
              {roles.length > 0 ? roles.map(role => (
                <option key={role.roleId} value={role.roleName}>{role.roleName}</option>
              )) : <option disabled>Loading roles...</option>}
            </select>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Creating Account...' : 'Create Account'}</button>
        </form>
      </div>
    </ErrorBoundary>
  );
};


// ----- COMPONENT CHÍNH: AdminDashboard -----
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
  
  const [usersError, setUsersError] = useState('');
  const [managersError, setManagersError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');

  const [isTabChanging, setIsTabChanging] = useState(false);

  const loadDashboardData = useCallback(async () => {
    setError(''); setUsersError(''); setManagersError(''); setAppointmentsError('');
    try {
      const results = await Promise.allSettled([
        apiClient.get('/admin/users'), apiClient.get('/admin/patients'),
        apiClient.get('/admin/doctors'), apiClient.get('/admin/managers'),
        apiClient.get('/admin/appointments')
      ]);
      const [usersResult, patientsResult, doctorsResult, managersResult, appointmentsResult] = results;
      
      setUsers(usersResult.status === 'fulfilled' ? usersResult.value.data : []);
      if (usersResult.status === 'rejected') setUsersError('Failed to load users');

      setPatients(patientsResult.status === 'fulfilled' ? patientsResult.value.data : []);

      setDoctors(doctorsResult.status === 'fulfilled' ? doctorsResult.value.data : []);

      setManagers(managersResult.status === 'fulfilled' ? managersResult.value.data : []);
      if (managersResult.status === 'rejected') setManagersError('Failed to load managers');

      setAppointments(appointmentsResult.status === 'fulfilled' ? appointmentsResult.value.data : []);
      if (appointmentsResult.status === 'rejected') setAppointmentsError('Failed to load appointments');
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  const handleToggleUserStatus = async (userId) => {
    try { await apiClient.put(`/admin/users/${userId}/toggle-status`); loadDashboardData(); }
    catch (err) { setError('Failed to toggle user status'); }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password for the user:');
    if (!newPassword) return;
    try { await apiClient.put(`/admin/users/${userId}/reset-password`, null, { params: { newPassword } }); alert('Password has been reset successfully.'); }
    catch (err) { setError('Failed to reset password.'); }
  };
  
  // Cập nhật navigationItems
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Manage Users', icon: '👥' },
    { id: 'doctors', label: 'Manage Doctors', icon: '👨‍⚕️' },
    { id: 'managers', label: 'Manage Managers', icon: '🧑‍💼' },
    { id: 'appointments', label: 'All Appointments', icon: '📅' },
    { id: 'create-user', label: 'Create User', icon: '➕' }
  ];

  // --- CÁC HÀM RENDER ---
  const renderOverview = () => (
    <ErrorBoundary>
      <div className="overview-section">
        <div className="content-header"><h2>Dashboard Overview</h2></div>
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
        <div className="content-header"><h2>Manage All Users</h2><p>View and manage all system users</p></div>
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
              {activeTab === 'create-user' && (
                <CreateUserForm
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
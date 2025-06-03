import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Data states
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  // Error states for individual sections
  const [usersError, setUsersError] = useState('');
  const [patientsError, setPatientsError] = useState('');
  const [doctorsError, setDoctorsError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');
  const [specialtiesError, setSpecialtiesError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    setUsersError('');
    setPatientsError('');
    setDoctorsError('');
    setAppointmentsError('');
    setSpecialtiesError('');

    try {
      console.log('Loading admin dashboard data...');
      
      // Load users
      try {
        const usersRes = await apiClient.get('/admin/users');
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch (err) {
        setUsers([]);
        setUsersError('Failed to load users');
        console.error('Failed to load users:', err);
      }
      // Load patients
      try {
        const patientsRes = await apiClient.get('/admin/patients');
        setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : []);
      } catch (err) {
        setPatients([]);
        setPatientsError('Failed to load patients');
        console.error('Failed to load patients:', err);
      }
      // Load doctors
      try {
        const doctorsRes = await apiClient.get('/admin/doctors');
        setDoctors(Array.isArray(doctorsRes.data) ? doctorsRes.data : []);
      } catch (err) {
        setDoctors([]);
        setDoctorsError('Failed to load doctors');
        console.error('Failed to load doctors:', err);
      }
      // Load appointments
      try {
        const appointmentsRes = await apiClient.get('/admin/appointments');
        setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
      } catch (err) {
        setAppointments([]);
        setAppointmentsError('Failed to load appointments');
        console.error('Failed to load appointments:', err);
      }
      // Load specialties
      try {
        const specialtiesRes = await apiClient.get('/admin/specialties');
        setSpecialties(Array.isArray(specialtiesRes.data) ? specialtiesRes.data : []);
      } catch (err) {
        setSpecialties([]);
        setSpecialtiesError('Failed to load specialties');
        console.error('Failed to load specialties:', err);
      }

    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/toggle-status`);
      if (response.data.success) {
        loadDashboardData();
      }
      } catch (error) {
      console.error('Toggle user status error:', error);
      setError('Failed to update user status');
      }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password:');
    if (newPassword) {
    try {
        const response = await apiClient.put(`/admin/users/${userId}/reset-password`, null, {
          params: { newPassword }
        });
        if (response.data.success) {
          alert('Password reset successfully');
        }
    } catch (error) {
        console.error('Reset password error:', error);
        setError('Failed to reset password');
    }
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'create-doctor', label: 'Add Doctor', icon: '➕' }
  ];
  const renderOverview = () => (
    <div className="overview-section">
      <div className="content-header">
        <h2>System Overview</h2>
        <p>Monitor and manage your HIV medical treatment system</p>
        </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Users</h3>
          <p className="stat-number">{users.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Patients</h3>
          <p className="stat-number">{patients.filter(p => p.isActive).length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Doctors</h3>
          <p className="stat-number">{doctors.filter(d => d.isActive).length}</p>
      </div>
        <div className="stat-card">
          <h3>Total Appointments</h3>
          <p className="stat-number">{appointments.length}</p>
        </div>
        <div className="stat-card">
          <h3>Scheduled Appointments</h3>
          <p className="stat-number">
            {appointments.filter(apt => apt.status === 'Scheduled').length}
          </p>
      </div>
        <div className="stat-card">
          <h3>Medical Specialties</h3>
          <p className="stat-number">{specialties.length}</p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadDashboardData} className="action-btn" style={{marginLeft: '1rem'}}>
            Retry
      </button>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="users-section">
      <div className="content-header">
        <h2>User Management</h2>
        <p>Manage all system users and their permissions</p>
      </div>

      <div className="section-header">
        <h3>All Users ({users.length})</h3>
      </div>

      {usersError && <div className="error-message">{usersError}</div>}
      
      {users.length === 0 && !usersError ? (
        <p>No users found.</p>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.userId || Math.random()}>
                  <td>{safeRender(user.userId)}</td>
                  <td>{safeRender(user.username)}</td>
                  <td>{safeRender(user.email)}</td>
                  <td>
                    <span className={`role-badge ${safeRender(user.role?.roleName, 'unknown').toLowerCase()}`}>
                      {safeRender(user.role?.roleName, 'Unknown')}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{safeDate(user.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className={`toggle-btn ${user.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleUserStatus(user.userId)}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        className="reset-btn"
                        onClick={() => handleResetPassword(user.userId)}
                      >
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDoctors = () => (
    <div className="doctors-section">
      <div className="content-header">
        <h2>Doctor Management</h2>
        <p>Manage doctor accounts and their specializations</p>
      </div>

      <div className="section-header">
        <h3>Doctors ({doctors.length})</h3>
        <button 
          className="add-btn"
          onClick={() => setActiveTab('create-doctor')}
        >
          Add New Doctor
        </button>
      </div>

      {doctorsError && <div className="error-message">{doctorsError}</div>}
      
      {doctors.length === 0 && !doctorsError ? (
        <p>No doctors found.</p>
      ) : (
        <div className="doctors-grid">
          {doctors.map(doctor => (
            <div key={doctor.userId || Math.random()} className="doctor-card">
              <h4>Dr. {safeRender(doctor.username)}</h4>
              <p><strong>Email:</strong> {safeRender(doctor.email)}</p>
              <p><strong>Status:</strong> {doctor.isActive ? 'Active' : 'Inactive'}</p>
              <p><strong>Created:</strong> {safeDate(doctor.createdAt)}</p>
              <div className="action-buttons">
                <button 
                  className={`toggle-btn ${doctor.isActive ? 'deactivate' : 'activate'}`}
                  onClick={() => handleToggleUserStatus(doctor.userId)}
                >
                  {doctor.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAppointments = () => (
    <div className="appointments-section">
      <div className="content-header">
        <h2>Appointment Management</h2>
        <p>Monitor and oversee all system appointments</p>
      </div>

      <div className="section-header">
        <h3>All Appointments ({appointments.length})</h3>
      </div>

      {appointmentsError && <div className="error-message">{appointmentsError}</div>}
      
      {appointments.length === 0 && !appointmentsError ? (
        <p>No appointments found.</p>
      ) : (
        <div className="appointments-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date & Time</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map(appointment => (
                <tr key={appointment.appointmentId || Math.random()}>
                  <td>{safeRender(appointment.appointmentId)}</td>
                  <td>{safeRender(appointment.patientUser?.username, 'Unknown Patient')}</td>
                  <td>Dr. {safeRender(appointment.doctorUser?.username, 'Unknown Doctor')}</td>
                  <td>{safeDateTime(appointment.appointmentDateTime)}</td>
                  <td>{safeRender(appointment.durationMinutes, '30')} min</td>
                  <td>
                    <span className={`status ${safeRender(appointment.status, 'unknown').toLowerCase()}`}>
                      {safeRender(appointment.status, 'Unknown')}
                    </span>
                  </td>
                  <td>{safeDate(appointment.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const CreateDoctorForm = () => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      specialtyId: '',
      bio: ''
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setFormLoading(true);
      setFormError('');

      try {
        const formDataToSend = new URLSearchParams();
        Object.keys(formData).forEach(key => {
          if (formData[key]) {
            formDataToSend.append(key, formData[key]);
          }
        });

        const response = await apiClient.post('/admin/doctors', formDataToSend, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

        if (response.data.success) {
          alert('Doctor created successfully!');
          setFormData({
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: '',
            phoneNumber: '',
            specialtyId: '',
            bio: ''
          });
          loadDashboardData();
        }
      } catch (error) {
        console.error('Create doctor error:', error);
        setFormError(error.response?.data?.message || 'Failed to create doctor');
      } finally {
        setFormLoading(false);
      }
};

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <div className="create-doctor-section">
        <div className="content-header">
          <h2>Add New Doctor</h2>
          <p>Create a new doctor account with profile information</p>
        </div>

        <form onSubmit={handleSubmit} className="create-doctor-form">
          {formError && <div className="error-message">{formError}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="specialtyId">Specialty</label>
              <select
                id="specialtyId"
                name="specialtyId"
                value={formData.specialtyId}
                onChange={handleChange}
              >
                <option value="">Select Specialty</option>
                {specialties.map(specialty => (
                  <option key={specialty.specialtyId} value={specialty.specialtyId}>
                    {specialty.specialtyName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="bio">Biography</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="4"
              placeholder="Brief professional biography..."
            />
          </div>

          <button type="submit" className="submit-btn" disabled={formLoading}>
            {formLoading ? 'Creating Doctor...' : 'Create Doctor Account'}
          </button>
        </form>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'doctors':
        return renderDoctors();
      case 'appointments':
        return renderAppointments();
      case 'create-doctor':
        return <CreateDoctorForm />;
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-layout">
        {/* Vertical Sidebar */}
        <div className="dashboard-sidebar">
          <div className="sidebar-header">
            <h1>Admin Panel</h1>
            <p>Welcome, {user?.username}</p>
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

        {/* Main Content */}
        <div className="dashboard-main">
          <div className="dashboard-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
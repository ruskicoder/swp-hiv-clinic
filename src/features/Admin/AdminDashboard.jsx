import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import { SafeText } from '../../utils/SafeComponents';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
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

  // Error states
  const [usersError, setUsersError] = useState('');
  const [appointmentsError, setAppointmentsError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Loading admin dashboard data...');
      
      // Load all data concurrently
      const [usersResult, patientsResult, doctorsResult, appointmentsResult, specialtiesResult] = await Promise.allSettled([
        apiClient.get('/admin/users'),
        apiClient.get('/admin/patients'),
        apiClient.get('/admin/doctors'),
        apiClient.get('/admin/appointments'),
        apiClient.get('/admin/specialties')
      ]);

      // Handle results
      if (usersResult.status === 'fulfilled' && usersResult.value?.data) {
        setUsers(Array.isArray(usersResult.value.data) ? usersResult.value.data : []);
      } else {
        setUsersError('Failed to load users');
      }

      if (patientsResult.status === 'fulfilled' && patientsResult.value?.data) {
        setPatients(Array.isArray(patientsResult.value.data) ? patientsResult.value.data : []);
      }

      if (doctorsResult.status === 'fulfilled' && doctorsResult.value?.data) {
        setDoctors(Array.isArray(doctorsResult.value.data) ? doctorsResult.value.data : []);
      }

      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value?.data) {
        setAppointments(Array.isArray(appointmentsResult.value.data) ? appointmentsResult.value.data : []);
      } else {
        setAppointmentsError('Failed to load appointments');
      }

      if (specialtiesResult.status === 'fulfilled' && specialtiesResult.value?.data) {
        setSpecialties(Array.isArray(specialtiesResult.value.data) ? specialtiesResult.value.data : []);
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
        loadDashboardData(); // Reload data
      }
    } catch (error) {
      console.error('Toggle user status error:', error);
      setError('Failed to toggle user status');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password for user:');
    if (!newPassword) return;

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
  };

  const handleLogout = () => {
    logout();
    navigate('/');
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
        <div className="content-header">
          <h2>Admin Dashboard</h2>
          <p>Welcome back, <SafeText>{safeRender(user?.username)}</SafeText>! Manage the HIV Medical Treatment System.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p className="stat-number">{users?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Patients</h3>
            <p className="stat-number">{patients?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Doctors</h3>
            <p className="stat-number">{doctors?.length || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <p className="stat-number">{appointments?.length || 0}</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <SafeText>{error}</SafeText>
            <button onClick={loadDashboardData} className="retry-btn">
              Retry
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );

  const renderUsers = () => (
    <ErrorBoundary>
      <div className="users-section">
        <div className="content-header">
          <h2>User Management</h2>
          <p>Manage all system users and their permissions</p>
        </div>

        {usersError && (
          <div className="error-message">
            <SafeText>{usersError}</SafeText>
          </div>
        )}

        {!users || users.length === 0 ? (
          <div className="no-data">
            <p>No users found.</p>
            <button className="refresh-btn" onClick={loadDashboardData}>
              Refresh
            </button>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user?.userId || index}>
                    <td><SafeText>{safeRender(user?.username)}</SafeText></td>
                    <td><SafeText>{safeRender(user?.email)}</SafeText></td>
                    <td>
                      <span className={`role-badge ${safeRender(user?.role, '').toLowerCase()}`}>
                        <SafeText>{safeRender(user?.role)}</SafeText>
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user?.isActive ? 'active' : 'inactive'}`}>
                        <SafeText>{user?.isActive ? 'Active' : 'Inactive'}</SafeText>
                      </span>
                    </td>
                    <td><SafeText>{safeDate(user?.createdAt)}</SafeText></td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className={`action-btn ${user?.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleUserStatus(user?.userId)}
                        >
                          {user?.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                          className="action-btn reset"
                          onClick={() => handleResetPassword(user?.userId)}
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
    </ErrorBoundary>
  );

  const renderDoctors = () => (
    <ErrorBoundary>
      <div className="doctors-section">
        <div className="content-header">
          <h2>Doctor Management</h2>
          <p>Manage doctor accounts and their specialties</p>
        </div>

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
                  <div className="doctor-info">
                    <h4><SafeText>Dr. {safeRender(doctor?.username)}</SafeText></h4>
                    <p><strong>Email:</strong> <SafeText>{safeRender(doctor?.email)}</SafeText></p>
                    <p><strong>Status:</strong> 
                      <span className={`status-badge ${doctor?.isActive ? 'active' : 'inactive'}`}>
                        <SafeText>{doctor?.isActive ? 'Active' : 'Inactive'}</SafeText>
                      </span>
                    </p>
                    <p><strong>Created:</strong> <SafeText>{safeDate(doctor?.createdAt)}</SafeText></p>
                  </div>
                  <div className="doctor-actions">
                    <button 
                      className={`action-btn ${doctor?.isActive ? 'deactivate' : 'activate'}`}
                      onClick={() => handleToggleUserStatus(doctor?.userId)}
                    >
                      {doctor?.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      className="action-btn reset"
                      onClick={() => handleResetPassword(doctor?.userId)}
                    >
                      Reset Password
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

  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="appointments-section">
        <div className="content-header">
          <h2>Appointment Management</h2>
          <p>Overview of all appointments in the system</p>
        </div>

        {appointmentsError && (
          <div className="error-message">
            <SafeText>{appointmentsError}</SafeText>
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
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment, index) => (
                  <tr key={appointment?.appointmentId || index}>
                    <td><SafeText>{safeRender(appointment?.patientUser?.username)}</SafeText></td>
                    <td><SafeText>Dr. {safeRender(appointment?.doctorUser?.username)}</SafeText></td>
                    <td><SafeText>{safeDateTime(appointment?.appointmentDateTime)}</SafeText></td>
                    <td><SafeText>{safeRender(appointment?.durationMinutes)} min</SafeText></td>
                    <td>
                      <span className={`status-badge ${safeRender(appointment?.status, '').toLowerCase()}`}>
                        <SafeText>{safeRender(appointment?.status)}</SafeText>
                      </span>
                    </td>
                    <td><SafeText>{safeDate(appointment?.createdAt)}</SafeText></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ErrorBoundary>
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
        const response = await apiClient.post('/admin/doctors', formData);
        if (response.data.success) {
          alert('Doctor account created successfully!');
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
          setActiveTab('doctors');
        }
      } catch (error) {
        console.error('Create doctor error:', error);
        setFormError(error.response?.data?.message || 'Failed to create doctor account');
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
      <ErrorBoundary>
        <div className="create-doctor-section">
          <div className="content-header">
            <h2>Create Doctor Account</h2>
            <p>Add a new doctor to the system</p>
          </div>

          <form onSubmit={handleSubmit} className="create-doctor-form">
            {formError && (
              <div className="error-message">
                <SafeText>{formError}</SafeText>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username</label>
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
                <label htmlFor="email">Email</label>
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
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
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
                <label htmlFor="lastName">Last Name</label>
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
                <option value="">Select a specialty...</option>
                {specialties.map((specialty, index) => (
                  <option key={specialty?.specialtyId || index} value={specialty?.specialtyId}>
                    {safeRender(specialty?.specialtyName)}
                  </option>
                ))}
              </select>
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
              {formLoading ? 'Creating...' : 'Create Doctor Account'}
            </button>
          </form>
        </div>
      </ErrorBoundary>
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
      <DashboardHeader 
        title="Admin Portal" 
        subtitle={`Welcome back, ${safeRender(user?.username)}!`}
      />
      
      <div className="dashboard-layout">
        {/* Vertical Sidebar */}
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
            
            {/* Logout Button */}
            <div className="nav-item nav-logout">
              <button
                className="nav-button logout-button"
                onClick={handleLogout}
              >
                <span className="nav-icon">🚪</span>
                Logout
              </button>
            </div>
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
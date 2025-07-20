import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './AdminDashboard.css';

// ----- COMPONENT PHÂN TRANG (PaginationControls) -----
const PaginationControls = ({ currentPage, totalPages, onPageChange, isLoading }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page) => {
    if (page >= 0 && page < totalPages && !isLoading) {
      onPageChange(page);
    }
  };

  return (
    <div className="pagination-controls">
      <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 0 || isLoading}>
        « Previous
      </button>
      <span className="page-info">
        Page {currentPage + 1} of {totalPages}
      </span>
      <button onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage >= totalPages - 1 || isLoading}>
        Next »
      </button>
    </div>
  );
};

// ----- COMPONENT TẠO USER (ĐÃ BAO GỒM ĐẦY ĐỦ) -----
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

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiClient.get('/admin/roles');
        setRoles(response.data.filter(role => role.roleName!== 'Admin'&& role.roleName !== 'Manager')); // Exclude Admin and Manager roles
      } catch (err) {
        setError('Failed to load roles list.');
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
      const response = await apiClient.post('/admin/users', formData);
      if (response.data && response.data.success) {
        setSuccess(response.data.message || 'User created successfully!');
        setFormData({ username: '', password: '', email: '', firstName: '', lastName: '', phoneNumber: '', gender: '', roleName: '' });
        
        if (typeof loadDashboardData === 'function') {
          loadDashboardData();
        }
        
        setTimeout(() => {
          if (formData.roleName === 'Doctor') setActiveTab('doctors');
          else setActiveTab('users');
        }, 1500);
      } else {
        setError(response.data.message || 'An unknown error occurred.');
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
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="">Select Gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <select name="roleName" value={formData.roleName} onChange={handleChange} required>
              <option value="">Select a Role...</option>
              {roles.length > 0 ? roles.map(role => (
                <option key={role.roleId} value={role.roleName}>{role.roleName}</option>
              )) : <option disabled>Loading roles...</option>}
            </select>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
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

  const [data, setData] = useState({
    users: { content: [], totalPages: 0, currentPage: 0, error: '' },
    managers: { content: [], totalPages: 0, currentPage: 0, error: '' },
    appointments: { content: [], totalPages: 0, currentPage: 0, error: '' },
    patients: { content: [], totalPages: 0, currentPage: 0, error: '' },
    doctors: { content: [], totalPages: 0, currentPage: 0, error: '' },
    overview: { users: 0, patients: 0, doctors: 0, managers: 0, appointments: 0 },
  });

  const PAGE_SIZE = 5; // Adjusted for better performance and usability
  // const PAGE_SIZE = 10; // Original value, can be adjusted based on performance
  const PAGINATED_TABS = ['users', 'managers', 'appointments', 'patients', 'doctors'];

  const loadDataForTab = useCallback(async (tab, page = 0) => {
    setLoading(true);
    const endpoint = `/admin/${tab}?page=${page}&size=${PAGE_SIZE}`;

    try {
      const response = await apiClient.get(endpoint);
      setData(prevData => ({
        ...prevData,
        [tab]: {
          content: response.data.content,
          totalPages: response.data.totalPages,
          currentPage: response.data.number,
          error: ''
        }
      }));
    } catch (err) {
      setData(prevData => ({
        ...prevData,
        [tab]: { ...prevData[tab], error: `Failed to load ${tab}.` }
      }));
    } finally {
      setLoading(false);
    }
  }, [PAGE_SIZE]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const results = await Promise.allSettled([
          apiClient.get('/admin/users/count'),
          apiClient.get('/admin/patients/count'),
          apiClient.get('/admin/doctors/count'),
          apiClient.get('/admin/managers/count'),
          apiClient.get('/admin/appointments/count'),
        ]);

        const [usersCount, patientsCount, doctorsCount, managersCount, appointmentsCount] = results;

        setData(prev => ({
          ...prev,
          overview: {
            users: usersCount.status === 'fulfilled' ? usersCount.value.data : 0,
            patients: patientsCount.status === 'fulfilled' ? patientsCount.value.data : 0,
            doctors: doctorsCount.status === 'fulfilled' ? doctorsCount.value.data : 0,
            managers: managersCount.status === 'fulfilled' ? managersCount.value.data : 0,
            appointments: appointmentsCount.status === 'fulfilled' ? appointmentsCount.value.data : 0,
          }
        }));

        await loadDataForTab('users', 0);
      } catch (err) {
        setError("Failed to load initial dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [loadDataForTab]);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (PAGINATED_TABS.includes(tabId) && data[tabId].content.length === 0) {
      loadDataForTab(tabId, 0);
    }
  };

  const handleToggleUserStatus = async (userId, tabToReload) => {
    try {
      await apiClient.put(`/admin/users/${userId}/toggle-status`);
      loadDataForTab(tabToReload, data[tabToReload].currentPage);
    } catch (err) {
      setError('Failed to toggle user status');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = prompt('Enter new password for the user:');
    if (!newPassword || newPassword.trim() === '') return;
    try {
        await apiClient.put(`/admin/users/${userId}/reset-password`, null, { params: { newPassword } });
        alert('Password has been reset successfully.');
    } catch (err) {
        setError('Failed to reset password.');
    }
  };
  
  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Manage Users', icon: '👥' },
    { id: 'doctors', label: 'Manage Doctors', icon: '👨‍⚕️' },
    { id: 'managers', label: 'Manage Managers', icon: '🧑‍💼' },
    { id: 'appointments', label: 'All Appointments', icon: '📅' },
    { id: 'create-user', label: 'Create User', icon: '➕' }
  ];

  const renderOverview = () => (
    <div className="overview-section">
      <div className="content-header"><h2>Dashboard Overview</h2></div>
      {error && <div className="error-message">{error}</div>}
      <div className="stats-grid">
        <div className="stat-card"><h3>Total Users</h3><p className="stat-number">{data.overview.users}</p></div>
        <div className="stat-card"><h3>Total Patients</h3><p className="stat-number">{data.overview.patients}</p></div>
        <div className="stat-card"><h3>Total Doctors</h3><p className="stat-number">{data.overview.doctors}</p></div>
        <div className="stat-card"><h3>Total Managers</h3><p className="stat-number">{data.overview.managers}</p></div>
        <div className="stat-card"><h3>Total Appointments</h3><p className="stat-number">{data.overview.appointments}</p></div>
      </div>
    </div>
  );

  const renderPaginatedTable = (tabName, headers, rowRenderer) => {
    const tabData = data[tabName];
    return (
      <div className={`${tabName}-section`}>
        <div className="content-header"><h2>Manage {tabName.charAt(0).toUpperCase() + tabName.slice(1)}</h2></div>
        {tabData.error && <div className="error-message">{tabData.error}</div>}
        {loading && tabData.content.length === 0 ? <p>Loading data...</p> : (
          !tabData.content || tabData.content.length === 0 ? <div className="no-data"><p>No data found.</p></div> : (
            <>
              <div className="users-table-container">
                <table className="users-table">
                  <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
                  <tbody>{tabData.content.map(rowRenderer)}</tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={tabData.currentPage}
                totalPages={tabData.totalPages}
                onPageChange={(page) => loadDataForTab(tabName, page)}
                isLoading={loading}
              />
            </>
          )
        )}
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <DashboardHeader title="Admin Dashboard" subtitle="System overview and management" />
      <div className="dashboard-layout">
        <aside className="manager-sidebar">
          {navigationItems.map(item => (
            <button key={item.id} className={`sidebar-option${activeTab === item.id ? ' active' : ''}`} onClick={() => handleTabClick(item.id)}>
              {item.icon} {item.label}
            </button>
          ))}
        </aside>
        <main className="dashboard-main">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderPaginatedTable('users', 
            ['Username', 'Email', 'Role', 'Status', 'Created', 'Actions'],
            (user) => (
              <tr key={user.userId}>
                <td>{safeRender(user.username)}</td>
                <td>{safeRender(user.email)}</td>
                <td>{safeRender(user.role?.roleName)}</td>
                <td><span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{safeDate(user.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-toggle" onClick={() => handleToggleUserStatus(user.userId, 'users')}>{user.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button className="btn-reset" onClick={() => handleResetPassword(user.userId)}>Reset Password</button>
                  </div>
                </td>
              </tr>
            )
          )}
          {activeTab === 'doctors' && renderPaginatedTable('doctors', 
            ['Username', 'Email', 'Status', 'Created', 'Actions'],
            (doctor) => (
              <tr key={doctor.userId}>
                <td>{safeRender(doctor.username)}</td>
                <td>{safeRender(doctor.email)}</td>
                <td><span className={`status-badge ${doctor.isActive ? 'active' : 'inactive'}`}>{doctor.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{safeDate(doctor.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-toggle" onClick={() => handleToggleUserStatus(doctor.userId, 'doctors')}>{doctor.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button className="btn-reset" onClick={() => handleResetPassword(doctor.userId)}>Reset Password</button>
                  </div>
                </td>
              </tr>
            )
          )}
          {activeTab === 'managers' && renderPaginatedTable('managers', 
             ['Username', 'Email', 'Status', 'Created', 'Actions'],
             (manager) => (
              <tr key={manager.userId}>
                <td>{safeRender(manager.username)}</td>
                <td>{safeRender(manager.email)}</td>
                <td><span className={`status-badge ${manager.isActive ? 'active' : 'inactive'}`}>{manager.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>{safeDate(manager.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-toggle" onClick={() => handleToggleUserStatus(manager.userId, 'managers')}>{manager.isActive ? 'Deactivate' : 'Activate'}</button>
                    <button className="btn-reset" onClick={() => handleResetPassword(manager.userId)}>Reset Password</button>
                  </div>
                </td>
              </tr>
             )
          )}
           {activeTab === 'appointments' && renderPaginatedTable('appointments', 
             ['Patient', 'Doctor', 'Date & Time', 'Status'],
             (appt) => (
                <tr key={appt.appointmentId}>
                    <td>{safeRender(appt.patientUser?.username)}</td>
                    <td>Dr. {safeRender(appt.doctorUser?.username)}</td>
                    <td>{safeDateTime(appt.appointmentDateTime)}</td>
                    <td><span className={`status ${safeRender(appt.status).toLowerCase()}`}>{safeRender(appt.status)}</span></td>
                </tr>
             )
          )}
          {activeTab === 'create-user' && (
            <CreateUserForm
              loadDashboardData={() => loadDataForTab('users', 0)}
              setActiveTab={setActiveTab}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
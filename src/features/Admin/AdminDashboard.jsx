import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import ErrorBoundary from '../../components/ErrorBoundary';
import DashboardHeader from '../../components/layout/DashboardHeader';
import { safeRender, safeDate, safeDateTime } from '../../utils/renderUtils';
import './AdminDashboard.css';
import PaginatedTable from '../../features/components/PaginatedTable'; // Import component PaginatedTable.jsx

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
  const [doctorsError, setDoctorsError] = useState('');

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
  // Bắt buộc phải có đoạn khai báo này
const appointmentColumns = [
    { header: 'Patient', cell: appt => safeRender(appt.patientUser?.username) },
    { header: 'Doctor', cell: appt => `Dr. ${safeRender(appt.doctorUser?.username)}` },
    { header: 'Date & Time', cell: appt => safeDateTime(appt.appointmentDateTime) },
    { header: 'Status', cell: appt => (
      <span className={`status ${safeRender(appt.status).toLowerCase()}`}>
        {safeRender(appt.status)}
      </span>
    )}
];
   const ManagerColumns = [
    { header: 'Username', cell: user => safeRender(user.username) },
    { header: 'Email', cell: user => safeRender(user.email) },
    { header: 'Role', cell: user => safeRender(user.role?.roleName) },
    { header: 'Status', cell: user => (
      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Created', cell: user => safeDate(user.createdAt) },
    { header: 'Actions', cell: user => (
      <div className="action-buttons">
        <button className="btn-toggle" onClick={() => handleToggleUserStatus(user.userId)}>
          {user.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button className="btn-reset" onClick={() => handleResetPassword(user.userId)}>
          Reset Password
        </button>
      </div>
    )}
  ];
  const doctorColumns = [
  // Sử dụng "doc" và thêm tiền tố "Dr."
  { header: 'Doctor Name', cell: doc => `Dr. ${safeRender(doc.username)}` }, 
  { header: 'Specialization', cell: doc => safeRender(doc.specialization) },
  { header: 'Phone', cell: doc => safeRender(doc.phoneNumber) },
  { header: 'Email', cell: doc => safeRender(doc.email) },
  { header: 'Status', cell: doc => (
    <span className={`status-badge ${doc.isActive ? 'active' : 'inactive'}`}>
      {doc.isActive ? 'Active' : 'Inactive'}
    </span>
  )},
  { header: 'Created', cell: doc => safeDate(doc.createdAt) },
  { header: 'Actions', cell: doc => (
    <div className="action-buttons">
      <button className="btn-toggle" onClick={() => handleToggleUserStatus(doc.userId)}>
        {doc.isActive ? 'Deactivate' : 'Activate'}
      </button>
      {/* Nút Reset Password vẫn có thể giữ lại nếu bạn muốn */}
      <button className="btn-reset" onClick={() => handleResetPassword(doc.userId)}>
        Reset Password
      </button>
    </div>
  )}
];
  const userColumns = [
    { header: 'Username', cell: user => safeRender(user.username) },
    { header: 'Email', cell: user => safeRender(user.email) },
    { header: 'Role', cell: user => safeRender(user.role?.roleName) },
    { header: 'Status', cell: user => (
      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
        {user.isActive ? 'Active' : 'Inactive'}
      </span>
    )},
    { header: 'Created', cell: user => safeDate(user.createdAt) },
    { header: 'Actions', cell: user => (
      <div className="action-buttons">
        <button className="btn-toggle" onClick={() => handleToggleUserStatus(user.userId)}>
          {user.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button className="btn-reset" onClick={() => handleResetPassword(user.userId)}>
          Reset Password
        </button>
      </div>
    )}
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
        {usersError ? <div className="error-message">{usersError}</div> : (
          <PaginatedTable
            data={users}
            columns={userColumns}
            itemsPerPage={9} // Bạn có thể tùy chỉnh số lượng
            emptyMessage="No users found."
          />
        )}
      </div>
    </ErrorBoundary>
  );
  
  const renderManagers = () => (
    <ErrorBoundary>
      <div className="users-section">
        <div className="content-header"><h2>Manage All Managers</h2><p>View and manage all system managers</p></div>
        {managersError ? <div className="error-message">{managersError}</div> : (
          <PaginatedTable
            data={managers}
            columns={ManagerColumns} // Sử dụng cột của Manager
            itemsPerPage={9} // Bạn có thể tùy chỉnh số lượng
            emptyMessage="No users found."
          />
        )}
      </div>
    </ErrorBoundary>
  );
   const renderDoctors = () => (
    <ErrorBoundary>
      {/* Sửa lại className cho đúng */}
      <div className="doctors-section"> 
        <div className="content-header"><h2>Manage Doctors</h2><p>View and manage doctor accounts</p></div>

        {doctorsError && <div className="error-message">{doctorsError}</div>} 

        {!doctorsError && (
          <PaginatedTable
            data={doctors}
            columns={doctorColumns} // <-- SỬ DỤNG CỘT CỦA DOCTOR
            itemsPerPage={9}        // Bạn có thể hiển thị 5 bác sĩ mỗi trang
            emptyMessage="No doctors found."
          />
        )}
      </div>
    </ErrorBoundary>
  );

  const renderAppointments = () => (
    <ErrorBoundary>
      <div className="users-section">
        <div className="content-header"><h2>Manage All Appointments</h2><p>View and manage all system appointments</p></div>
        {appointmentsError ? <div className="error-message">{appointmentsError}</div> : (
          <PaginatedTable
            data={appointments}
            columns={appointmentColumns} // Sử dụng cột của appointments
            itemsPerPage={9} // Bạn có thể tùy chỉnh số lượng
            emptyMessage="No users found."
          />
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
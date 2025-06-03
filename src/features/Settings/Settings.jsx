import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BackNavigation from '../../components/layout/BackNavigation';
import apiClient from '../../services/apiClient';
import { SafeText } from '../../utils/SafeComponents';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Profile editing state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    address: '',
    bio: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification settings state
  const [notifications, setNotifications] = useState({
    emailAppointments: true,
    smsReminders: true,
    marketingCommunications: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth || '',
        address: user.address || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiClient.put('/auth/profile', profileData);
      if (response.data.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        // Update user context
        if (updateUser) {
          updateUser({ ...user, ...profileData });
        }
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setMessage('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiClient.put('/auth/notifications', notifications);
      if (response.data.success) {
        setMessage('Notification preferences updated successfully!');
      }
    } catch (error) {
      console.error('Notification update error:', error);
      setError(error.response?.data?.message || 'Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const renderProfileSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Profile Information</h3>
        <button 
          className="btn btn-outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {message && (
        <div className="success-message">
          <SafeText>{message}</SafeText>
        </div>
      )}

      {error && (
        <div className="error-message">
          <SafeText>{error}</SafeText>
        </div>
      )}

      <form onSubmit={handleProfileSubmit} className="settings-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input 
              type="text" 
              name="firstName"
              value={profileData.firstName} 
              onChange={handleProfileChange}
              disabled={!isEditing} 
            />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input 
              type="text" 
              name="lastName"
              value={profileData.lastName} 
              onChange={handleProfileChange}
              disabled={!isEditing} 
            />
          </div>
        </div>

        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            name="email"
            value={profileData.email} 
            onChange={handleProfileChange}
            disabled={!isEditing} 
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input 
            type="tel" 
            name="phoneNumber"
            value={profileData.phoneNumber} 
            onChange={handleProfileChange}
            disabled={!isEditing} 
          />
        </div>

        {user?.role === 'Patient' && (
          <>
            <div className="form-group">
              <label>Date of Birth</label>
              <input 
                type="date" 
                name="dateOfBirth"
                value={profileData.dateOfBirth} 
                onChange={handleProfileChange}
                disabled={!isEditing} 
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea 
                name="address"
                value={profileData.address} 
                onChange={handleProfileChange}
                disabled={!isEditing}
                rows="3"
              />
            </div>
          </>
        )}

        {user?.role === 'Doctor' && (
          <div className="form-group">
            <label>Biography</label>
            <textarea 
              name="bio"
              value={profileData.bio} 
              onChange={handleProfileChange}
              disabled={!isEditing}
              rows="4"
              placeholder="Professional biography..."
            />
          </div>
        )}

        <div className="form-group">
          <label>Username</label>
          <input type="text" value={user?.username || ''} disabled />
          <small className="form-note">Username cannot be changed</small>
        </div>

        <div className="form-group">
          <label>Role</label>
          <input type="text" value={user?.role || ''} disabled />
          <small className="form-note">Role is managed by administrators</small>
        </div>

        {isEditing && (
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </form>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-section">
      <h3>Security Settings</h3>

      {message && (
        <div className="success-message">
          <SafeText>{message}</SafeText>
        </div>
      )}

      {error && (
        <div className="error-message">
          <SafeText>{error}</SafeText>
        </div>
      )}

      <form onSubmit={handlePasswordSubmit} className="settings-form">
        <h4>Change Password</h4>
        
        <div className="form-group">
          <label>Current Password</label>
          <input 
            type="password" 
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            required
          />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input 
            type="password" 
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            required
            minLength="6"
          />
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input 
            type="password" 
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            required
            minLength="6"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>

      <div className="security-info">
        <h4>Security Information</h4>
        <div className="info-item">
          <strong>Last Login:</strong> <SafeText>{user?.lastLogin || 'N/A'}</SafeText>
        </div>
        <div className="info-item">
          <strong>Account Created:</strong> <SafeText>{user?.createdAt || 'N/A'}</SafeText>
        </div>
        <div className="info-item">
          <strong>Account Status:</strong> 
          <span className={`status-badge ${user?.isActive ? 'active' : 'inactive'}`}>
            <SafeText>{user?.isActive ? 'Active' : 'Inactive'}</SafeText>
          </span>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-section">
      <h3>Notification Preferences</h3>

      {message && (
        <div className="success-message">
                    <SafeText>{message}</SafeText>
        </div>
      )}

      {error && (
        <div className="error-message">
          <SafeText>{error}</SafeText>
        </div>
      )}

      <form onSubmit={handleNotificationSubmit} className="settings-form">
        <div className="setting-item">
          <label className="setting-label">
            <input 
              type="checkbox" 
              name="emailAppointments"
              checked={notifications.emailAppointments}
              onChange={handleNotificationChange}
            />
            Email notifications for appointments
          </label>
          <small className="setting-description">
            Receive email confirmations and reminders for your appointments
          </small>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input 
              type="checkbox" 
              name="smsReminders"
              checked={notifications.smsReminders}
              onChange={handleNotificationChange}
            />
            SMS notifications for reminders
          </label>
          <small className="setting-description">
            Get text message reminders before your appointments
          </small>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input 
              type="checkbox" 
              name="marketingCommunications"
              checked={notifications.marketingCommunications}
              onChange={handleNotificationChange}
            />
            Marketing communications
          </label>
          <small className="setting-description">
            Receive updates about new features and health tips
          </small>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="settings-container">
      <div className="settings-header">
        <BackNavigation />
        <h1>Settings</h1>
        <p>Manage your account preferences and settings</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <button 
              className={`settings-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Profile
            </button>
            
            <button 
              className={`settings-nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="16" r="1" stroke="currentColor" strokeWidth="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Security
            </button>
            
            <button 
              className={`settings-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Notifications
            </button>
          </nav>
        </div>

        <div className="settings-main">
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'notifications' && renderNotificationSettings()}
        </div>
      </div>
    </div>
  );
};

export default Settings;


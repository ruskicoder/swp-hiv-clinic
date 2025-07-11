import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import BackNavigation from '../../components/layout/BackNavigation';
import apiClient from '../../services/apiClient';
import authService from '../../services/authService';
import { SafeText } from '../../utils/SafeComponents';
import './Settings.css';

/**
 * Settings component for managing user profile, security, and notification preferences
 */
const Settings = () => {
  const { user, updateUser } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastLoginData, setLastLoginData] = useState(null);

  // Profile data state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    dateOfBirth: '',
    address: '',
    bio: '',
    profileImageBase64: ''
  });

  // Password data state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailAppointments: true,
    smsReminders: false,
    marketingCommunications: false
  });

  // Load user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await authService.getUserProfile();
        
        if (response) {
          setProfileData({
            firstName: response.firstName || '',
            lastName: response.lastName || '',
            phoneNumber: response.phoneNumber || '',
            email: response.email || user.email || '',
            dateOfBirth: response.dateOfBirth || '',
            address: response.address || '',
            bio: response.bio || '',
            profileImageBase64: response.profileImageBase64 || ''
          });
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    const loadLastLoginData = async () => {
      if (!user) return;
      
      try {
        const response = await apiClient.get('/login-activity/last-login');
        if (response.data.success && response.data.data) {
          setLastLoginData(response.data.data);
        }
      } catch (err) {
        console.error('Error loading last login data:', err);
        // Don't set error for this as it's not critical
      }
    };

    loadUserProfile();
    loadLastLoginData();
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Add useEffect for initial style loading
  useEffect(() => {
    // Force a repaint to ensure styles are applied correctly
    document.body.style.display = 'none';
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';

    // Clean up
    return () => {
      document.body.style.display = '';
    };
  }, []);

  // Add loading state handling
  useEffect(() => {
    document.documentElement.style.visibility = loading ? 'hidden' : 'visible';
    return () => {
      document.documentElement.style.visibility = 'visible';
    };
  }, [loading]);

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle notification changes
  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Send the entire profileData object, not individual fields
      const response = await authService.updateProfile(profileData);

      if (response.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        
        // Update user context
        if (updateUser) {
          updateUser({
            ...user,
            firstName: profileData.firstName,
            lastName: profileData.lastName
          });
        }
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validate passwords
    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
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
      } else {
        setError(response.data.message || 'Failed to change password');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle notification form submission
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await apiClient.put('/auth/notifications', notifications);
      
      if (response.data.success) {
        setMessage('Notification preferences updated successfully!');
      } else {
        setError('Failed to update notification preferences');
      }
    } catch (err) {
      console.error('Error updating notifications:', err);
      setError('Failed to update notification preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target.result;
        
        try {
          const response = await authService.updateProfileImage(base64Image);
          
          if (response.success) {
            setProfileData(prev => ({
              ...prev,
              profileImageBase64: base64Image
            }));
            setMessage('Profile image updated successfully!');
          } else {
            setError(response.message || 'Failed to update profile image');
          }
        } catch (err) {
          console.error('Error updating profile image:', err);
          setError('Failed to update profile image. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file:', err);
      setError('Failed to read image file');
      setLoading(false);
    }
  };

  // Render profile settings
  const renderProfileSettings = () => (
    <div className="settings-section">
      <div className="section-header">
        <h3>Profile Information</h3>
        <button 
          className="btn btn-secondary"
          onClick={() => setIsEditing(!isEditing)}
          disabled={loading}
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
        {/* Profile Image */}
        <div className="form-group profile-image-group">
          <label>Profile Picture</label>
          <div className="profile-image-section">
            <div className="profile-image-container">
              {profileData.profileImageBase64 ? (
                <img 
                  src={profileData.profileImageBase64} 
                  alt="Profile" 
                  className="profile-image-preview"
                />
              ) : (
                <div className="profile-image-placeholder">
                  <span>No Image</span>
                </div>
              )}
            </div>
            <div className="image-upload-controls">
              <input
                type="file"
                id="profileImageInput"
                accept="image/*"
                onChange={handleProfileImageChange}
                disabled={loading}
                className="profile-image-input"
                style={{ display: 'none' }}
              />
              <label 
                htmlFor="profileImageInput" 
                className="upload-btn"
                style={{ 
                  opacity: loading ? 0.6 : 1, 
                  pointerEvents: loading ? 'none' : 'auto' 
                }}
              >
                {loading ? 'Uploading...' : 'Change Photo'}
              </label>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profileData.firstName}
              onChange={handleProfileChange}
              disabled={!isEditing || loading}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profileData.lastName}
              onChange={handleProfileChange}
              disabled={!isEditing || loading}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              disabled={true} // Email should not be editable
            />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={profileData.phoneNumber}
              onChange={handleProfileChange}
              disabled={!isEditing || loading}
            />
          </div>
        </div>

        {/* Patient-specific fields */}
        {user?.role === 'Patient' && (
          <>
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={profileData.dateOfBirth}
                onChange={handleProfileChange}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={profileData.address}
                onChange={handleProfileChange}
                disabled={!isEditing || loading}
                rows="3"
                placeholder="Enter your address..."
              />
            </div>
          </>
        )}

        {/* Doctor-specific fields */}
        {user?.role === 'Doctor' && (
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={handleProfileChange}
              disabled={!isEditing || loading}
              rows="4"
              placeholder="Tell us about yourself..."
            />
          </div>
        )}

        {isEditing && (
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );

  // Render security settings
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
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            disabled={loading}
            required
            minLength="6"
          />
          <small className="form-help">Password must be at least 6 characters</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>

      <div className="security-info">
        <h4>Security Information</h4>
        <div className="info-item">
          <strong>Last Login:</strong> <SafeText>{lastLoginData ? new Date(lastLoginData).toLocaleString() : 'N/A'}</SafeText>
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

  // Render notification settings
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
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="emailAppointments"
              checked={notifications.emailAppointments}
              onChange={handleNotificationChange}
              disabled={loading}
            />
            <span className="checkbox-text">Email notifications for appointments</span>
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="smsReminders"
              checked={notifications.smsReminders}
              onChange={handleNotificationChange}
              disabled={loading}
            />
            <span className="checkbox-text">SMS reminders</span>
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="marketingCommunications"
              checked={notifications.marketingCommunications}
              onChange={handleNotificationChange}
              disabled={loading}
            />
            <span className="checkbox-text">Marketing communications</span>
          </label>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );

  // Show loading state until component is initialized
  if (!isInitialized) {
    return (
      <div className="settings-container">
        <BackNavigation />
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Loading your preferences...</p>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <BackNavigation />
      
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account preferences</p>
      </div>

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            <button
              className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              👤 Profile
            </button>
            <button
              className={`nav-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              🔒 Security
            </button>
            <button
              className={`nav-button ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              🔔 Notifications
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
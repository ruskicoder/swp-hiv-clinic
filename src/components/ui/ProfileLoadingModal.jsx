import React from 'react';
import './ProfileLoadingModal.css';

/**
 * Modal component that appears when user profile is not fully loaded on first login
 * Provides option to reload the page to ensure all profile data is loaded
 */
const ProfileLoadingModal = ({
  isOpen,
  onReload,
  onClose
}) => {
  if (!isOpen) return null;

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="profile-loading-modal-overlay">
      <div className="profile-loading-modal">
        <div className="profile-loading-modal-header">
          <h3>⚠️ Profile Loading</h3>
        </div>
        
        <div className="profile-loading-modal-content">
          <p>Your profile is still loading. For the best experience, please reload the page to ensure all your information is displayed correctly.</p>
          
          <div className="profile-loading-info">
            <p>This will help ensure:</p>
            <ul>
              <li>All your profile information is loaded</li>
              <li>Notifications are properly initialized</li>
              <li>Dashboard data is fully synchronized</li>
            </ul>
          </div>
        </div>
        
        <div className="profile-loading-modal-actions">
          <button 
            className="btn btn-primary"
            onClick={handleReload}
          >
            Reload Page
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Continue Anyway
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileLoadingModal;
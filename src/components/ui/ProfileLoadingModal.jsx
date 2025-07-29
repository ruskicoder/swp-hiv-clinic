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
          <h3>🔄 Page Reload Required</h3>
        </div>
        
        <div className="profile-loading-modal-content">
          <p>Welcome! Your profile is still loading. Please reload the page to ensure all features work properly.</p>
          
          <div className="profile-loading-info">
            <p>Reloading will help ensure:</p>
            <ul>
              <li>Your profile information is fully loaded</li>
              <li>Notifications are properly initialized</li>
              <li>All dashboard features are available</li>
              <li>The system works optimally</li>
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
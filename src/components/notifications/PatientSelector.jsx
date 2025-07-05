import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './PatientSelector.css';

/**
 * Component for selecting patients with appointments
 * Supports both single and multiple selection modes
 */
const PatientSelector = ({ 
  patients, 
  selectedPatientIds, 
  onSelectionChange, 
  multiple = false,
  error,
  disabled = false,
  placeholder = "Search patients..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState([]);

  useEffect(() => {
    // Filter patients based on search term
    const filtered = patients.filter(patient => {
      const fullName = `${patient.firstName || ''} ${patient.lastName || ''}`.toLowerCase();
      const email = (patient.email || '').toLowerCase();
      const search = searchTerm.toLowerCase();
      
      return fullName.includes(search) || email.includes(search);
    });
    
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  /**
   * Handle patient selection
   */
  const handlePatientSelection = (patientId) => {
    if (disabled) return;

    let newSelection;
    
    if (multiple) {
      if (selectedPatientIds.includes(patientId)) {
        // Remove from selection
        newSelection = selectedPatientIds.filter(id => id !== patientId);
      } else {
        // Add to selection
        newSelection = [...selectedPatientIds, patientId];
      }
    } else {
      // Single selection
      newSelection = selectedPatientIds.includes(patientId) ? [] : [patientId];
      setShowDropdown(false);
    }
    
    onSelectionChange(newSelection);
  };

  /**
   * Remove a selected patient
   */
  const removePatient = (patientId) => {
    if (disabled) return;
    
    const newSelection = selectedPatientIds.filter(id => id !== patientId);
    onSelectionChange(newSelection);
  };

  /**
   * Get selected patient objects
   */
  const getSelectedPatients = () => {
    return patients.filter(patient => selectedPatientIds.includes(patient.userId));
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowDropdown(true);
  };

  /**
   * Handle input focus
   */
  const handleInputFocus = () => {
    if (!disabled) {
      setShowDropdown(true);
    }
  };

  /**
   * Handle click outside to close dropdown
   */
  const handleClickOutside = (e) => {
    if (!e.target.closest('.patient-selector')) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectedPatients = getSelectedPatients();

  return (
    <div className={`patient-selector ${error ? 'error' : ''} ${disabled ? 'disabled' : ''}`}>
      {/* Selected Patients Display */}
      {selectedPatients.length > 0 && (
        <div className="selected-patients">
          {selectedPatients.map(patient => (
            <div key={patient.userId} className="selected-patient-tag">
              <span className="patient-info">
                <span className="patient-name">
                  {patient.firstName || 'Unknown'} {patient.lastName || 'Patient'}
                </span>
                <span className="patient-email">{patient.email || 'No email'}</span>
              </span>
              <button
                type="button"
                className="remove-patient"
                onClick={() => removePatient(patient.userId)}
                disabled={disabled}
                aria-label={`Remove ${patient.firstName} ${patient.lastName}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          placeholder={selectedPatients.length > 0 ? "Add more patients..." : placeholder}
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleInputFocus}
          disabled={disabled}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          role="combobox"
        />
        <div className="search-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
      </div>

      {/* Dropdown List */}
      {showDropdown && !disabled && (
        <div className="patient-dropdown" role="listbox">
          {filteredPatients.length > 0 ? (
            <>
              {multiple && (
                <div className="dropdown-header">
                  <span>Select patients ({selectedPatientIds.length} selected)</span>
                  {selectedPatientIds.length > 0 && (
                    <button
                      type="button"
                      className="clear-all"
                      onClick={() => onSelectionChange([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>
              )}
              
              <div className="patient-list">
                {filteredPatients.map(patient => {
                  const isSelected = selectedPatientIds.includes(patient.userId);
                  
                  return (
                    <div
                      key={patient.userId}
                      className={`patient-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => handlePatientSelection(patient.userId)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="patient-info">
                        <div className="patient-name">
                          {patient.firstName || 'Unknown'} {patient.lastName || 'Patient'}
                        </div>
                        <div className="patient-details">
                          <span className="patient-email">{patient.email || 'No email'}</span>
                          {patient.lastAppointment && (
                            <span className="last-appointment">
                              Last visit: {new Date(patient.lastAppointment).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {multiple && (
                        <div className="selection-indicator">
                          {isSelected ? (
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          ) : (
                            <div className="checkbox-empty"></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="no-patients">
              {searchTerm ? (
                <>
                  <span className="icon">🔍</span>
                  <span>No patients found matching "{searchTerm}"</span>
                </>
              ) : (
                <>
                  <span className="icon">👥</span>
                  <span>No patients with appointments found</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selection Summary */}
      {multiple && selectedPatientIds.length > 0 && (
        <div className="selection-summary">
          <span className="summary-text">
            {selectedPatientIds.length} patient{selectedPatientIds.length !== 1 ? 's' : ''} selected
          </span>
          <button
            type="button"
            className="view-selection"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={disabled}
          >
            {showDropdown ? 'Hide' : 'View'} Selection
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message" role="alert">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      <div className="help-text">
        {multiple 
          ? "Search and select multiple patients to send notifications to"
          : "Search and select a patient to send notification to"
        }
      </div>
    </div>
  );
};

PatientSelector.propTypes = {
  patients: PropTypes.arrayOf(PropTypes.shape({
    userId: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    lastAppointment: PropTypes.string
  })).isRequired,
  selectedPatientIds: PropTypes.arrayOf(PropTypes.number).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  multiple: PropTypes.bool,
  error: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string
};

export default PatientSelector;
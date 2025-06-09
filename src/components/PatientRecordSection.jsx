import React, { useState, useEffect } from 'react';
import { SafeText } from '../utils/SafeComponents';
import './PatientRecordSection.css';

const PatientRecordSection = ({
  record = {},
  onSave,
  onImageUpload,
  loading = false,
  isEditable = true
}) => {
  // Initialize form data with empty strings
  const [formData, setFormData] = useState({
    medicalHistory: '',
    allergies: '',
    currentMedications: '', 
    notes: '',
    bloodType: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Debug log to track incoming data
  console.debug('PatientRecordSection received record:', record);

  // Add debug logging
  useEffect(() => {
    console.debug('PatientRecordSection mounted with record:', record);
  }, []);

  // Update form data when record changes
  useEffect(() => {
    console.debug('Updating form data with record:', record);
    
    // Check for error in record
    if (record?.error) {
      setError(record.error);
      return;
    }

    // Enhanced validation for record data
    const hasValidRecord = record && (
      record.success === true || 
      record.patientUserId || 
      record.patientUserID || 
      record.recordId ||
      record.patientId ||
      record.patientUsername ||
      // Check if it's a valid record object with at least some medical data
      (typeof record === 'object' && (
        record.medicalHistory !== undefined ||
        record.allergies !== undefined ||
        record.currentMedications !== undefined ||
        record.notes !== undefined ||
        record.bloodType !== undefined ||
        record.emergencyContact !== undefined ||
        record.emergencyPhone !== undefined
      ))
    );

    if (hasValidRecord) {
      setFormData({
        medicalHistory: record.medicalHistory || '',
        allergies: record.allergies || '',
        currentMedications: record.currentMedications || '',
        notes: record.notes || '',
        bloodType: record.bloodType || '',
        emergencyContact: record.emergencyContact || '',
        emergencyPhone: record.emergencyPhone || ''
      });
      setError('');
      console.debug('Form data updated successfully');
    } else {
      console.debug('No valid record data provided, using empty form');
      setFormData({
        medicalHistory: '',
        allergies: '',
        currentMedications: '',
        notes: '',
        bloodType: '',
        emergencyContact: '',
        emergencyPhone: ''
      });
    }
  }, [record]);

  // Helper to get patient name for header
  const getPatientName = () => {
    if (!record) return 'Patient';
    // Try to use patientName, then patientUsername, then fallback
    return (
      record.patientName ||
      (record.patientFirstName && record.patientLastName
        ? `${record.patientFirstName} ${record.patientLastName}`
        : null) ||
      record.patientUsername ||
      record.firstName ||
      record.username ||
      'Patient'
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any existing errors when user starts typing
    if (error) setError('');
    if (saveSuccess) setSaveSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaveSuccess('');

    // Basic validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (formData.emergencyPhone && !phoneRegex.test(formData.emergencyPhone.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid emergency phone number');
      return;
    }

    if (formData.emergencyContact && !formData.emergencyPhone) {
      setError('Please provide an emergency phone number when adding an emergency contact');
      return;
    }

    try {
      await onSave(formData);
      setSaveSuccess('Patient record saved successfully!');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving patient record:', error);
      setError(error.message || 'Failed to save patient record');
    }
  };
  const handleImageUpload = async (e) => {
    if (!onImageUpload) {
      console.error('No onImageUpload function provided to PatientRecordSection');
      setUploadError('Image upload is not available');
      return;
    }

    const file = e.target.files[0];
    if (!file) {
      console.debug('No file selected');
      return;
    }

    // Clear previous states
    setUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      console.debug('Processing image:', {
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      });

      // Create canvas for image resizing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Handle image loading
      await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Calculate new dimensions (max 512x512)
            const maxDimension = 512;
            let { width, height } = img;
            
            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;

            // Draw and compress image
            ctx.drawImage(img, 0, 0, width, height);
            const base64 = canvas.toDataURL('image/jpeg', 0.8);

            console.debug('Image processed:', {
              originalSize: `${(file.size / 1024).toFixed(2)}KB`,
              newSize: `${(base64.length / 1024).toFixed(2)}KB`,
              dimensions: `${width}x${height}`
            });

            resolve(base64);
          } catch (err) {
            reject(new Error('Failed to process image: ' + err.message));
          }
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        // Read file as data URL
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      })
      .then(async (base64) => {
        try {
          // Call the parent's onImageUpload function
          await onImageUpload(base64);
          setUploadSuccess('Image uploaded successfully!');
          setTimeout(() => setUploadSuccess(''), 3000);
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
          throw uploadError;
        }
      });

    } catch (error) {
      console.error('Image upload error:', error);
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Enhanced validation for displaying record
  const hasValidRecord = record && (
    record.success === true || 
    record.patientUserId || 
    record.patientUserID || 
    record.recordId ||
    record.patientId ||
    record.patientUsername ||
    // Check if it's a valid record object with medical data
    (typeof record === 'object' && (
      record.medicalHistory !== undefined ||
      record.allergies !== undefined ||
      record.currentMedications !== undefined ||
      record.notes !== undefined ||
      record.bloodType !== undefined ||
      record.emergencyContact !== undefined ||
      record.emergencyPhone !== undefined
    ))
  );

  return (
    <div className="patient-record-section">
      <div className="record-header">
        <h3>
          {loading ? 'Loading...' : 
           record?.error ? 'Error Loading Record' :
           hasValidRecord ? `${getPatientName()} Medical Record` :
           'Patient Medical Record'}
        </h3>
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="success-banner">
            {saveSuccess}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-message">
          <p>Loading patient record... Please wait.</p>
        </div>
      ) : (
        <div className="record-content">
          {/* Profile Image Section */}
          <div className="profile-image-section">
            <div className="profile-image-container">
              {record?.profileImageBase64 ? (
                <img
                  src={record.profileImageBase64}
                  alt="Profile"
                  className="profile-image"
                />
              ) : (
                <div className="profile-placeholder">
                  <span>No Image</span>
                </div>
              )}
            </div>
            <div className="image-upload">
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <label 
                htmlFor="profileImage" 
                className="upload-btn" 
                style={{ 
                  opacity: uploading ? 0.6 : 1, 
                  pointerEvents: uploading ? 'none' : 'auto' 
                }}
              >
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </label>
              {uploadError && <div className="error-message">{uploadError}</div>}
              {uploadSuccess && <div className="success-message">{uploadSuccess}</div>}
            </div>
          </div>

          {/* Medical Information Form */}
          <form id="patient-record-form" onSubmit={handleSubmit} className="record-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="medicalHistory">Medical History</label>
                {isEditable ? (
                  <textarea
                    id="medicalHistory"
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleChange}
                    placeholder="Enter medical history..."
                    rows="4"
                  />
                ) : (
                  <div className="form-display">
                    <SafeText value={formData.medicalHistory} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="allergies">Allergies</label>
                {isEditable ? (
                  <textarea
                    id="allergies"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="Enter known allergies..."
                    rows="4"
                  />
                ) : (
                  <div className="form-display">
                    <SafeText value={formData.allergies} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="currentMedications">Current Medications</label>
                {isEditable ? (
                  <textarea
                    id="currentMedications"
                    name="currentMedications"
                    value={formData.currentMedications}
                    onChange={handleChange}
                    placeholder="Enter current medications..."
                    rows="4"
                  />
                ) : (
                  <div className="form-display">
                    <SafeText value={formData.currentMedications} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                {isEditable ? (
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Enter additional notes..."
                    rows="4"
                  />
                ) : (
                  <div className="form-display">
                    <SafeText value={formData.notes} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="bloodType">Blood Type</label>
                {isEditable ? (
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                  >
                    <option value="">Select blood type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                ) : (
                  <div className="form-display">
                    <SafeText value={formData.bloodType} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                {isEditable ? (
                  <input
                    type="text"
                    id="emergencyContact"
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    placeholder="Enter emergency contact name..."
                  />
                ) : (
                  <div className="form-display">
                    <SafeText value={formData.emergencyContact} />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="emergencyPhone">Emergency Phone</label>
                {isEditable ? (
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="Enter emergency phone number..."
                  />
                ) : (
                  <div className="form-display">
                    <SafeText value={formData.emergencyPhone} />
                  </div>
                )}
              </div>
            </div>

            {isEditable && (
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Record'
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientRecordSection;
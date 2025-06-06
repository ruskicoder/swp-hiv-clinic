import React, { useState, useEffect } from 'react';
import { SafeText } from '../utils/SafeComponents';
import './PatientRecordSection.css';

const PatientRecordSection = ({
  record = null,  // Change default to null for better null checking
  onSave,
  onImageUpload,
  loading = false,
  isEditable = true
}) => {
  // Debug log to track incoming data
  console.debug('PatientRecordSection received record:', record);

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

  // Add debug logging
  useEffect(() => {
    console.debug('PatientRecordSection mounted with record:', record);
  }, []);

  // Update form data when record changes
  useEffect(() => {
    console.debug('Updating form data with record:', record);
    
    if (record && typeof record === 'object') {
      setFormData({
        medicalHistory: record.medicalHistory || '',
        allergies: record.allergies || '',
        currentMedications: record.currentMedications || '',
        notes: record.notes || '',
        bloodType: record.bloodType || '',
        emergencyContact: record.emergencyContact || '',
        emergencyPhone: record.emergencyPhone || ''
      });
      // Clear any previous errors
      setError('');
    } else {
      console.debug('No valid record data provided');
      // Reset form to empty state
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

  // Update SafeText rendering in the JSX
  const renderSafeText = (value, placeholder = 'N/A') => (
    <SafeText>
      {value && value.toString().trim() !== '' ? value : placeholder}
    </SafeText>
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Validate required fields
      if (!formData.emergencyContact || !formData.emergencyPhone) {
        setError('Emergency contact information is required');
        return;
      }

      // Validate phone number format
      const emergencyNumberRegex = /^[0-9]{3}$/;  // For numbers like 911, 112, 110
      const phoneRegex = /^\+?[\d\s-()]{8,20}$/;  // For regular phone numbers
      
      if (!emergencyNumberRegex.test(formData.emergencyPhone) && 
          !phoneRegex.test(formData.emergencyPhone)) {
        setError('Please enter a valid phone number: \n' +
                '- Emergency numbers (e.g., 911, 112) \n' +
                '- Regular phone numbers (8-20 digits, may include +, spaces, -, ())');
        return;
      }

      // Save record and wait for response
      await onSave(formData);
      
      // If we get here, the save was successful
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = 'Record saved successfully';
      e.target.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);

    } catch (err) {
      // Enhanced error handling
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error ||
                         err.message || 
                         'Failed to save patient record. Please try again.';
      
      setError(errorMessage);
      console.error('Save error:', err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleImageUpload = async (e) => {
    setUploadError('');
    setUploadSuccess('');
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        // Create an image to crop and resize
        const img = new window.Image();
        img.onload = async () => {
          // Crop to center square
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          // Draw to 512x512 canvas
          const canvas = document.createElement('canvas');
          canvas.width = 512;
          canvas.height = 512;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(
            img,
            sx, sy, minSide, minSide,
            0, 0, 512, 512
          );
          // Always use jpeg for compatibility
          const base64String = canvas.toDataURL('image/jpeg', 0.92);
          setUploading(true);
          setUploadError('');
          setUploadSuccess('');
          try {
            await onImageUpload(base64String);
            setUploadSuccess('Profile image updated successfully!');
          } catch (err) {
            setUploadError('Failed to upload image');
          } finally {
            setUploading(false);
          }
        };
        img.onerror = () => setUploadError('Failed to process image');
        img.src = event.target.result;
      };
      reader.onerror = () => setUploadError('Failed to read image file');
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="patient-record-section">
      <div className="record-header">
        <h3>My Medical Record</h3>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

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
            <label htmlFor="profileImage" className="upload-btn" style={{ opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto' }}>
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
                  placeholder="Enter your medical history..."
                  rows="4"
                />
              ) : (
                <div className="form-display">
                  {renderSafeText(record?.medicalHistory)}
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
                  placeholder="List any allergies..."
                  rows="3"
                />
              ) : (
                <div className="form-display">
                  {renderSafeText(record?.allergies)}
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
                  placeholder="List current medications..."
                  rows="3"
                />
              ) : (
                <div className="form-display">
                  {renderSafeText(record?.currentMedications)}
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
                  {renderSafeText(record?.bloodType)}
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
                  placeholder="Emergency contact name"
                />
              ) : (
                <div className="form-display">
                  {renderSafeText(record?.emergencyContact)}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="emergencyPhone">Emergency Phone</label>
              {isEditable ? (
                <>
                  <input
                    type="tel"
                    id="emergencyPhone"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleChange}
                    placeholder="Emergency number or phone number"
                  />
                  <small className="form-hint">
                    Valid formats: Emergency numbers (911, 112) or regular phone numbers (+1234567890, (123) 456-7890)
                  </small>
                </>
              ) : (
                <div className="form-display">
                  {renderSafeText(record?.emergencyPhone)}
                </div>
              )}
            </div>

            <div className="form-group full-width">
              <label htmlFor="notes">Additional Notes</label>
              {isEditable ? (
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes..."
                  rows="3"
                />
              ) : (
                <div className="form-display">
                  {renderSafeText(record?.notes)}
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default PatientRecordSection;
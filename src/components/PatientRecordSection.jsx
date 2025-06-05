import React, { useState } from 'react';
import { SafeText } from '../utils/SafeComponents';
import './PatientRecordSection.css';

const PatientRecordSection = ({
  record,
  onSave,
  onImageUpload,
  loading = false,
  isEditable = true
}) => {
  const [formData, setFormData] = useState({
    medicalHistory: record?.medicalHistory || '',
    allergies: record?.allergies || '',
    currentMedications: record?.currentMedications || '',
    notes: record?.notes || '',
    bloodType: record?.bloodType || '',
    emergencyContact: record?.emergencyContact || '',
    emergencyPhone: record?.emergencyPhone || ''
  });
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  React.useEffect(() => {
    if (record) {
      setFormData({
        medicalHistory: record.medicalHistory || '',
        allergies: record.allergies || '',
        currentMedications: record.currentMedications || '',
        notes: record.notes || '',
        bloodType: record.bloodType || '',
        emergencyContact: record.emergencyContact || '',
        emergencyPhone: record.emergencyPhone || ''
      });
    }
  }, [record]);

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
      await onSave(formData);
    } catch (err) {
      setError('Failed to save patient record');
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
                // If backend only returns base64 without prefix, add: src={`data:image/jpeg;base64,${record.profileImageBase64}`}
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
                  <SafeText>{record?.medicalHistory}</SafeText>
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
                  <SafeText>{record?.allergies}</SafeText>
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
                  <SafeText>{record?.currentMedications}</SafeText>
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
                  <SafeText>{record?.bloodType}</SafeText>
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
                  <SafeText>{record?.emergencyContact}</SafeText>
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
                  placeholder="Emergency contact phone"
                />
              ) : (
                <div className="form-display">
                  <SafeText>{record?.emergencyPhone}</SafeText>
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
                  <SafeText>{record?.notes}</SafeText>
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
import React, { useState } from 'react';
import { SafeText } from '../utils/SafeComponents';
import './PatientRecordSection.css';

const PatientRecordSection = ({ record, onSave, onImageUpload }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    medicalHistory: record?.medicalHistory || '',
    allergies: record?.allergies || '',
    currentMedications: record?.currentMedications || '',
    notes: record?.notes || '',
    bloodType: record?.bloodType || '',
    emergencyContact: record?.emergencyContact || '',
    emergencyPhone: record?.emergencyPhone || ''
  });
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setError('');
    try {
      await onSave(formData);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to save patient record');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    setUploadError('');
    setUploadSuccess('');
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target.result;
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
      reader.onerror = () => setUploadError('Failed to read image file');
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="patient-record-section">
      <div className="record-header">
        <h3>My Medical Record</h3>
        <div className="record-actions">
          {!isEditing ? (
            <button 
              className="btn-primary"
              onClick={() => setIsEditing(true)}
            >
              Edit Record
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                type="submit" 
                form="patient-record-form"
                className="btn-primary" 
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setError('');
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
              {isEditing ? (
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
        </form>
      </div>
    </div>
  );
};

export default PatientRecordSection;


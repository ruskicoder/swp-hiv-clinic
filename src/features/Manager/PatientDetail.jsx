import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './PatientDetail.css';

const PatientDetail = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const profileRes = await apiClient.get(`/manager/patients/${userId}/profile`);
        setProfile(profileRes.data);
      } catch (err) {
        setError('Patient information not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return <div>Loading patient information...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!profile) return <div>Patient information not found</div>;

  return (
    <div className="patient-detail-container">
      <Link to="/manager" className="patient-detail-back">
        <span style={{ fontSize: 20, marginRight: 8 }}>&larr;</span> Return to dashboard
      </Link>
      <div className="patient-detail-card">
        <div className="patient-detail-flex">
          <div className="patient-detail-avatar">
            {profile.profileImageBase64 ? (
              <img
                src={profile.profileImageBase64}
                alt="Ảnh bệnh nhân"
                className="patient-detail-avatar-img"
              />
            ) : (
              <div className="patient-detail-avatar-placeholder">
                <span>?</span>
              </div>
            )}
            <div className="patient-detail-username">{profile.username || '-'}</div>
          </div>
          <div className="patient-detail-info">
            <h2 className="patient-detail-title">Patient information</h2>
            <div className="patient-detail-grid">
              <div>
                <div className="patient-detail-label">Full name</div>
                <div className="patient-detail-value">{profile.firstName || ''} {profile.lastName || ''}</div>
              </div>
              <div>
                <div className="patient-detail-label">Email</div>
                <div className="patient-detail-value">{profile.email || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Date of birth</div>
                <div className="patient-detail-value">{profile.dateOfBirth || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Gender</div>
                <div className="patient-detail-value">{profile.gender || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Phone number</div>
                <div className="patient-detail-value">{profile.phoneNumber || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Address</div>
                <div className="patient-detail-value">{profile.address || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Status</div>
                <div className="patient-detail-value">
                  {profile.isActive === true ? <span className="patient-detail-status-active">Active</span> : profile.isActive === false ? <span className="patient-detail-status-inactive">Inactive</span> : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;

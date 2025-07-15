import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './PatientDetail.css';

const DoctorDetail = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, arvRes, appRes, slotRes] = await Promise.all([
          apiClient.get(`/manager/doctors/${userId}/profile`),
          apiClient.get(`/manager/doctors/${userId}/arv-treatments`),
          apiClient.get(`/manager/doctors/${userId}/appointments`),
          apiClient.get(`/manager/doctors/${userId}/slots`)
        ]);
        setProfile(profileRes.data);
        setArvTreatments(arvRes.data);
        setAppointments(appRes.data);
        setSlots(slotRes.data);
      } catch (err) {
        setError('Doctor record not found');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return <div>Loading doctor infromation...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!profile) return <div>Doctor information not found</div>;

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
                src={`data:image/jpeg;base64,${profile.profileImageBase64}`}
                alt="avatar"
                className="patient-detail-avatar-img"
              />
            ) : (
              <div className="patient-detail-avatar-placeholder">
                <span>BS</span>
              </div>
            )}
            <div className="patient-detail-username">{profile.username}</div>
          </div>
          <div className="patient-detail-info">
            <h2 className="patient-detail-title">Doctor information</h2>
            <div className="patient-detail-grid">
              <div>
                <div className="patient-detail-label">Full name</div>
                <div className="patient-detail-value">{profile.firstName} {profile.lastName}</div>
              </div>
              <div>
                <div className="patient-detail-label">Email</div>
                <div className="patient-detail-value">{profile.email}</div>
              </div>
              <div>
                <div className="patient-detail-label">Specialty</div>
                <div className="patient-detail-value">{profile.specialty || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Phone number</div>
                <div className="patient-detail-value">{profile.phoneNumber || '-'}</div>
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
      <div className="patient-detail-records-card">
        <h3 className="patient-detail-records-title">ARV regimen made by this doctor</h3>
        {arvTreatments.length === 0 ? (
          <div className="patient-detail-records-empty">There is no ARV regimen</div>
        ) : (
          <div className="patient-detail-table-wrapper">
            <table className="patient-detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Regimen</th>
                  <th>Start date</th>
                  <th>End date</th>
                  <th>Note</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {arvTreatments.map(t => (
                  <tr key={t.arvTreatmentId}>
                    <td>{t.arvTreatmentId}</td>
                    <td>{t.patientName || '-'}</td>
                    <td>{t.regimen || '-'}</td>
                    <td>{t.startDate || '-'}</td>
                    <td>{t.endDate || '-'}</td>
                    <td>{t.notes || '-'}</td>
                    <td>
                      {t.notes === 'default template'
                        ? 'Default'
                        : t.notes === 'template'
                        ? 'Template'
                        : 'Custom'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="patient-detail-records-card">
        <h3 className="patient-detail-records-title">Appointments</h3>
        {appointments.length === 0 ? (
          <div className="patient-detail-records-empty">There is no appointment</div>
        ) : (
          <div className="patient-detail-table-wrapper">
            <table className="patient-detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.appointmentId}>
                    <td>{a.appointmentId}</td>
                    <td>{a.patientName || '-'}</td>
                    <td>{a.dateTime || '-'}</td>
                    <td>{a.status || '-'}</td>
                    <td>{a.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="patient-detail-records-card">
        <h3 className="patient-detail-records-title">Doctor Availability Slots</h3>
        {slots.length === 0 ? (
          <div className="patient-detail-records-empty">There is no available slot</div>
        ) : (
          <div className="patient-detail-table-wrapper">
            <table className="patient-detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Date</th>
                  <th>Start time</th>
                  <th>End time</th>
                  <th>Status</th>
                  <th>Booked By (Name)</th>
                  <th>Username</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(s => (
                  <tr key={s.slotId}>
                    <td>{s.slotId}</td>
                    <td>{s.date || '-'}</td>
                    <td>{s.startTime || '-'}</td>
                    <td>{s.endTime || '-'}</td>
                    <td>{s.status || '-'}</td>
                    <td>{s.status === 'Booked' ? (s.bookedByName || '-') : '-'}</td>
                    <td>{s.status === 'Booked' ? (s.bookedByUsername || '-') : '-'}</td>
                    <td>{s.status === 'Booked' ? (s.bookedByEmail || '-') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDetail;

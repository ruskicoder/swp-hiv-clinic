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
        setError('Không thể tải thông tin chi tiết bác sĩ.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return <div>Đang tải thông tin...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!profile) return <div>Không tìm thấy hồ sơ bác sĩ.</div>;

  return (
    <div className="patient-detail-container">
      <Link to="/manager" className="patient-detail-back">
        <span style={{ fontSize: 20, marginRight: 8 }}>&larr;</span> Quay lại danh sách
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
            <h2 className="patient-detail-title">Thông tin bác sĩ</h2>
            <div className="patient-detail-grid">
              <div>
                <div className="patient-detail-label">Họ tên</div>
                <div className="patient-detail-value">{profile.firstName} {profile.lastName}</div>
              </div>
              <div>
                <div className="patient-detail-label">Email</div>
                <div className="patient-detail-value">{profile.email}</div>
              </div>
              <div>
                <div className="patient-detail-label">Chuyên khoa</div>
                <div className="patient-detail-value">{profile.specialty || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Số điện thoại</div>
                <div className="patient-detail-value">{profile.phoneNumber || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Trạng thái</div>
                <div className="patient-detail-value">
                  {profile.isActive === true ? <span className="patient-detail-status-active">Active</span> : profile.isActive === false ? <span className="patient-detail-status-inactive">Inactive</span> : '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="patient-detail-records-card">
        <h3 className="patient-detail-records-title">Phác đồ ARV do bác sĩ tạo</h3>
        {arvTreatments.length === 0 ? (
          <div className="patient-detail-records-empty">Không có phác đồ ARV.</div>
        ) : (
          <div className="patient-detail-table-wrapper">
            <table className="patient-detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bệnh nhân</th>
                  <th>Phác đồ</th>
                  <th>Ngày bắt đầu</th>
                  <th>Ngày kết thúc</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {arvTreatments.map(t => (
                  <tr key={t.arvTreatmentID}>
                    <td>{t.arvTreatmentID}</td>
                    <td>{t.patientName || '-'}</td>
                    <td>{t.regimen || '-'}</td>
                    <td>{t.startDate || '-'}</td>
                    <td>{t.endDate || '-'}</td>
                    <td>{t.notes || '-'}</td>
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
          <div className="patient-detail-records-empty">Không có appointment.</div>
        ) : (
          <div className="patient-detail-table-wrapper">
            <table className="patient-detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Bệnh nhân</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Ghi chú</th>
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
          <div className="patient-detail-records-empty">Không có slot nào.</div>
        ) : (
          <div className="patient-detail-table-wrapper">
            <table className="patient-detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ngày</th>
                  <th>Giờ bắt đầu</th>
                  <th>Giờ kết thúc</th>
                  <th>Trạng thái</th>
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

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './PatientDetail.css';

const PatientDetail = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, recordsRes] = await Promise.all([
          apiClient.get(`/manager/patients/${userId}/profile`),
          apiClient.get(`/manager/patients/${userId}/records`)
        ]);
        setProfile(profileRes.data);
        setRecords(recordsRes.data);
      } catch (err) {
        setError('Không thể tải thông tin chi tiết bệnh nhân.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) return <div>Đang tải thông tin...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!profile) return <div>Không tìm thấy hồ sơ bệnh nhân.</div>;

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
            <h2 className="patient-detail-title">Thông tin hồ sơ bệnh nhân</h2>
            <div className="patient-detail-grid">
              <div>
                <div className="patient-detail-label">Họ tên</div>
                <div className="patient-detail-value">{profile.firstName || ''} {profile.lastName || ''}</div>
              </div>
              <div>
                <div className="patient-detail-label">Email</div>
                <div className="patient-detail-value">{profile.email || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Ngày sinh</div>
                <div className="patient-detail-value">{profile.dateOfBirth || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Giới tính</div>
                <div className="patient-detail-value">{profile.gender || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Số điện thoại</div>
                <div className="patient-detail-value">{profile.phoneNumber || '-'}</div>
              </div>
              <div>
                <div className="patient-detail-label">Địa chỉ</div>
                <div className="patient-detail-value">{profile.address || '-'}</div>
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
        <h3 className="patient-detail-records-title">Lịch sử hồ sơ bệnh án</h3>
        {records.length === 0 ? (
          <div className="patient-detail-records-empty">Không có hồ sơ bệnh án.</div>
        ) : (
          <div className="patient-detail-table-wrapper">
            <table className="patient-detail-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Ngày tạo</th>
                  <th>Chẩn đoán</th>
                  <th>Điều trị</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.recordId || r.recordID}>
                    <td>{r.recordId || r.recordID}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '-'}</td>
                    <td>{r.diagnosis || r.medicalHistory || '-'}</td>
                    <td>{r.treatment || r.currentMedications || '-'}</td>
                    <td>{r.notes || '-'}</td>
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

export default PatientDetail;

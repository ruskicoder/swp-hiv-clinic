import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';

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
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <Link to="/manager" style={{ marginBottom: 16, display: 'inline-block' }}>&larr; Quay lại danh sách</Link>
      <h2>Thông tin hồ sơ bệnh nhân</h2>
      <div style={{ background: '#f1f5f9', padding: 24, borderRadius: 12, marginBottom: 32 }}>
        <p><b>Username:</b> {profile.username || '-'}</p>
        <p><b>Email:</b> {profile.email || '-'}</p>
        <p><b>Họ tên:</b> {profile.firstName || ''} {profile.lastName || ''}</p>
        <p><b>Ngày sinh:</b> {profile.dateOfBirth || '-'}</p>
        <p><b>Giới tính:</b> {profile.gender || '-'}</p>
        <p><b>Địa chỉ:</b> {profile.address || '-'}</p>
        <p><b>Số điện thoại:</b> {profile.phoneNumber || '-'}</p>
        <p><b>Trạng thái:</b> {profile.isActive === true ? 'Active' : profile.isActive === false ? 'Inactive' : '-'}</p>
      </div>
      <h3>Lịch sử hồ sơ bệnh án</h3>
      {records.length === 0 ? (
        <div>Không có hồ sơ bệnh án.</div>
      ) : (
        <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px #e2e8f0', marginBottom: 32 }}>
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
      )}
    </div>
  );
};

export default PatientDetail;

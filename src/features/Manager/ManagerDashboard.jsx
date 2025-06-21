import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import UserProfileDropdown from '../../components/layout/UserProfileDropdown';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/manager/stats');
        setStats(res.data);
      } catch (err) {
        setError('Không thể tải dữ liệu thống kê.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true);
      setPatientsError('');
      try {
        const res = await apiClient.get('/manager/patients');
        setPatients(res.data);
      } catch (err) {
        setPatientsError('Không thể tải danh sách bệnh nhân.');
      } finally {
        setPatientsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      setDoctorsLoading(true);
      setDoctorsError('');
      try {
        const res = await apiClient.get('/manager/doctors');
        setDoctors(res.data);
      } catch (err) {
        setDoctorsError('Không thể tải danh sách bác sĩ.');
      } finally {
        setDoctorsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="manager-dashboard">
      <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manager Dashboard</h1>
          <p>Giám sát tổng quan hệ thống</p>
        </div>
        <UserProfileDropdown />
      </div>
      {loading ? (
        <div>Đang tải dữ liệu...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Số bệnh nhân</h3>
            <div className="stat-number">{stats.totalPatients}</div>
          </div>
          <div className="stat-card">
            <h3>Số bác sĩ</h3>
            <div className="stat-number">{stats.totalDoctors}</div>
          </div>
          <div className="stat-card">
            <h3>Số cuộc hẹn</h3>
            <div className="stat-number">{stats.totalAppointments}</div>
          </div>
          <div className="stat-card">
            <h3>Tổng số ARV</h3>
            <div className="stat-number">{stats.totalARVTreatments}</div>
          </div>
        </div>
      )}
      <div className="patients-section">
        <h2>Danh sách bệnh nhân</h2>
        {patientsLoading ? (
          <div>Đang tải danh sách bệnh nhân...</div>
        ) : patientsError ? (
          <div style={{ color: 'red' }}>{patientsError}</div>
        ) : (
          <div className="patients-table-container">
            <table className="patients-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Specialty</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => (
                  <tr key={p.userId || idx}>
                    <td>{p.username}</td>
                    <td>{p.email}</td>
                    <td>{p.firstName}</td>
                    <td>{p.lastName}</td>
                    <td>{p.specialty || '-'}</td>
                    <td>
                      <span className={`status-badge ${p.isActive ? 'active' : 'inactive'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="doctors-section">
        <h2>Danh sách bác sĩ</h2>
        {doctorsLoading ? (
          <div>Đang tải danh sách bác sĩ...</div>
        ) : doctorsError ? (
          <div style={{ color: 'red' }}>{doctorsError}</div>
        ) : (
          <div className="doctors-table-container">
            <table className="doctors-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Specialty</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d, idx) => (
                  <tr key={d.userId || idx}>
                    <td>{d.username}</td>
                    <td>{d.email}</td>
                    <td>{d.firstName}</td>
                    <td>{d.lastName}</td>
                    <td>{d.specialty || '-'}</td>
                    <td>
                      <span className={`status-badge ${d.isActive ? 'active' : 'inactive'}`}>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleString() : '-'}</td>
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

export default ManagerDashboard;

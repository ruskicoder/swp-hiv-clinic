import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="manager-dashboard">
      <div className="manager-header">
        <h1>Manager Dashboard</h1>
        <p>Giám sát tổng quan hệ thống</p>
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
    </div>
  );
};

export default ManagerDashboard;

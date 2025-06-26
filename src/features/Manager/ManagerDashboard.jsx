import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import UserProfileDropdown from '../../components/layout/UserProfileDropdown';
import './ManagerDashboard.css';

const SIDEBAR_OPTIONS = [
  { key: 'patients', label: 'Quản lý bệnh nhân' },
  { key: 'doctors', label: 'Quản lý bác sĩ' },
  { key: 'arv', label: 'Quản lý phác đồ ARV' },
  { key: 'schedules', label: 'Quản lý lịch làm việc' },
];

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [patientsError, setPatientsError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');
  const [arvTreatments, setArvTreatments] = useState([]);
  const [arvLoading, setArvLoading] = useState(true);
  const [arvError, setArvError] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState('');
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const navigate = useNavigate();

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

  useEffect(() => {
    if (activeTab === 'arv') {
      setArvLoading(true);
      setArvError('');
      apiClient.get('/manager/arv-treatments')
        .then(res => setArvTreatments(res.data))
        .catch(() => setArvError('Không thể tải danh sách phác đồ ARV.'))
        .finally(() => setArvLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'schedules') {
      setSchedulesLoading(true);
      setSchedulesError('');
      apiClient.get('/manager/schedules')
        .then(res => setSchedules(res.data))
        .catch(() => setSchedulesError('Không thể tải danh sách lịch làm việc.'))
        .finally(() => setSchedulesLoading(false));
    }
  }, [activeTab]);

  // Search patients
  const handlePatientSearch = async (e) => {
    const value = e.target.value;
    setPatientSearch(value);
    if (value.trim() === "") {
      // Reload all patients
      setPatientsLoading(true);
      try {
        const res = await apiClient.get('/manager/patients');
        setPatients(res.data);
      } catch {
        setPatientsError('Không thể tải danh sách bệnh nhân.');
      } finally {
        setPatientsLoading(false);
      }
      return;
    }
    setPatientsLoading(true);
    try {
      const res = await apiClient.get(`/manager/patients/search?q=${encodeURIComponent(value)}`);
      setPatients(res.data);
    } catch {
      setPatientsError('Không thể tìm kiếm bệnh nhân.');
    } finally {
      setPatientsLoading(false);
    }
  };

  // Search doctors
  const handleDoctorSearch = async (e) => {
    const value = e.target.value;
    setDoctorSearch(value);
    if (value.trim() === "") {
      setDoctorsLoading(true);
      try {
        const res = await apiClient.get('/manager/doctors');
        setDoctors(res.data);
      } catch {
        setDoctorsError('Không thể tải danh sách bác sĩ.');
      } finally {
        setDoctorsLoading(false);
      }
      return;
    }
    setDoctorsLoading(true);
    try {
      const res = await apiClient.get(`/manager/doctors/search?q=${encodeURIComponent(value)}`);
      setDoctors(res.data);
    } catch {
      setDoctorsError('Không thể tìm kiếm bác sĩ.');
    } finally {
      setDoctorsLoading(false);
    }
  };

  return (
    <div className="manager-dashboard" style={{ display: 'flex', minHeight: '80vh' }}>
      <aside className="manager-sidebar" style={{ minWidth: 220, background: '#f1f5f9', padding: '2rem 1rem', borderRadius: 12, marginRight: 32 }}>
        <div style={{ marginBottom: 32 }}>
          <UserProfileDropdown />
        </div>
        <nav>
          {SIDEBAR_OPTIONS.map(opt => (
            <div
              key={opt.key}
              className={`sidebar-option${activeTab === opt.key ? ' active' : ''}`}
              style={{
                padding: '0.75rem 1rem',
                marginBottom: 8,
                borderRadius: 8,
                background: activeTab === opt.key ? '#059669' : 'transparent',
                color: activeTab === opt.key ? '#fff' : '#1e293b',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setActiveTab(opt.key)}
            >
              {opt.label}
            </div>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1 }}>
        <div className="manager-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Manager Dashboard</h1>
            <p>Giám sát tổng quan hệ thống</p>
          </div>
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
        <div style={{ marginTop: 32 }}>
          {activeTab === 'patients' && (
            <section className="patients-section">
              <h2>Danh sách bệnh nhân</h2>
              <input
                type="text"
                placeholder="Tìm kiếm tên bệnh nhân..."
                value={patientSearch}
                onChange={handlePatientSearch}
                style={{ marginBottom: 16, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0', width: 300 }}
              />
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
                          <td>
                            <span
                              style={{ color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => navigate(`/manager/patients/${p.userId}`)}
                            >
                              {p.username}
                            </span>
                          </td>
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
            </section>
          )}
          {activeTab === 'doctors' && (
            <section className="doctors-section">
              <h2>Danh sách bác sĩ</h2>
              <input
                type="text"
                placeholder="Tìm kiếm tên hoặc chuyên khoa..."
                value={doctorSearch}
                onChange={handleDoctorSearch}
                style={{ marginBottom: 16, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0', width: 300 }}
              />
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
                          <td>
                            <span
                              style={{ color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => navigate(`/manager/doctors/${d.userId}`)}
                            >
                              {d.username}
                            </span>
                          </td>
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
            </section>
          )}
          {activeTab === 'arv' && (
            <section className="arv-section">
              <h2>Danh sách phác đồ ARV</h2>
              {arvLoading ? (
                <div>Đang tải danh sách phác đồ ARV...</div>
              ) : arvError ? (
                <div style={{ color: 'red' }}>{arvError}</div>
              ) : (
                <div className="arv-table-container">
                  <table className="arv-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Bệnh nhân</th>
                        <th>Bác sĩ</th>
                        <th>Regimen</th>
                        <th>StartDate</th>
                        <th>EndDate</th>
                        <th>Adherence</th>
                        <th>SideEffects</th>
                        <th>Notes</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {arvTreatments.map((arv, idx) => (
                        <tr key={arv.arvTreatmentID || idx}>
                          <td>{arv.arvTreatmentID}</td>
                          <td>{arv.patientName || '-'}</td>
                          <td>{arv.doctorName || '-'}</td>
                          <td>{arv.regimen}</td>
                          <td>{arv.startDate}</td>
                          <td>{arv.endDate || '-'}</td>
                          <td>{arv.adherence || '-'}</td>
                          <td>{arv.sideEffects || '-'}</td>
                          <td>{arv.notes || '-'}</td>
                          <td>{arv.isActive ? 'Active' : 'Inactive'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {activeTab === 'schedules' && (
            <section className="schedules-section">
              <h2>Danh sách lịch làm việc</h2>
              {schedulesLoading ? (
                <div>Đang tải danh sách lịch làm việc...</div>
              ) : schedulesError ? (
                <div style={{ color: 'red' }}>{schedulesError}</div>
              ) : (
                <div className="schedules-table-container">
                  <table className="schedules-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>DoctorUserID</th>
                        <th>Ngày</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc</th>
                        <th>Đã đặt?</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((s, idx) => (
                        <tr key={s.availabilitySlotId || idx}>
                          <td>{s.availabilitySlotId}</td>
                          <td>{s.doctorUser && s.doctorUser.userId ? s.doctorUser.userId : '-'}</td>
                          <td>{s.slotDate}</td>
                          <td>{s.startTime}</td>
                          <td>{s.endTime}</td>
                          <td>{s.isBooked ? 'Đã đặt' : 'Trống'}</td>
                          <td>{s.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManagerDashboard;

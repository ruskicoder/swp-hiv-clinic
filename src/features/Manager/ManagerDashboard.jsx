import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import NotificationsManager from '../Doctor/NotificationsManager';
import './ManagerDashboard.css';

const SIDEBAR_OPTIONS = [
  { 
    key: 'overview', 
    label: 'Dashboard Overview',
    icon: '📊'
  },
  { 
    key: 'patients', 
    label: 'Patient Management',
    icon: '👥'
  },
  { 
    key: 'doctors', 
    label: 'Doctor Management',
    icon: '👨‍⚕️'
  },
  { 
    key: 'arv', 
    label: 'ARV Regimen Management',
    icon: '💊'
  },
  { 
    key: 'schedules', 
    label: 'Schedule Management',
    icon: '📅'
  },
  {
    key: 'notifications',
    label: 'Notification Management',
    icon: '🔔'
  },
];

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
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
    if (activeTab === 'overview') {
      const fetchStats = async () => {
        setLoading(true);
        setError('');
        try {
          const res = await apiClient.get('/manager/stats');
          setStats(res.data);
        } catch (err) {
          setError(`Failed to load statistics: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'patients') {
      const fetchPatients = async () => {
        setPatientsLoading(true);
        setPatientsError('');
        try {
          const res = await apiClient.get('/manager/patients');
          setPatients(res.data);
        } catch (err) {
          setPatientsError(`Failed to load patient list: ${err.message}`);
        } finally {
          setPatientsLoading(false);
        }
      };
      fetchPatients();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'doctors') {
      const fetchDoctors = async () => {
        setDoctorsLoading(true);
        setDoctorsError('');
        try {
          const res = await apiClient.get('/manager/doctors');
          setDoctors(res.data);
        } catch (err) {
          setDoctorsError(`Failed to load doctor list: ${err.message}`);
        } finally {
          setDoctorsLoading(false);
        }
      };
      fetchDoctors();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'arv') {
      setArvLoading(true);
      setArvError('');
      apiClient.get('/manager/arv-treatments')
        .then(res => setArvTreatments(res.data))
        .catch(() => setArvError('Failed to load ARV regimens.'))
        .finally(() => setArvLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'schedules') {
      setSchedulesLoading(true);
      setSchedulesError('');
      apiClient.get('/manager/schedules')
        .then(res => setSchedules(res.data))
        .catch(() => setSchedulesError('Failed to load schedules.'))
        .finally(() => setSchedulesLoading(false));
    }
  }, [activeTab]);

  // Search patients
  const handlePatientSearch = async (e) => {
    const value = e.target.value;
    setPatientSearch(value);
    if (value.trim() === "") {
      setPatientsLoading(true);
      try {
        const res = await apiClient.get('/manager/patients');
        setPatients(res.data);
      } catch {
        setPatientsError('Failed to load patient list.');
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
      setPatientsError('Failed to search patients.');
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
        setDoctorsError('Failed to load doctor list.');
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
      setDoctorsError('Failed to search doctors.');
    } finally {
      setDoctorsLoading(false);
    }
  };

  const renderOverview = () => (
    <div>
      <div className="section-header">
        <h2>System Overview</h2>
      </div>
      
      {loading ? (
        <div className="loading-state">
          <div>📊 Loading dashboard statistics...</div>
        </div>
      ) : error ? (
        <div className="error-state">{error}</div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Patients</h3>
            <div className="stat-number">{stats.totalPatients || 0}</div>
            <div className="stat-change positive">+12% from last month</div>
          </div>
          <div className="stat-card">
            <h3>Active Doctors</h3>
            <div className="stat-number">{stats.totalDoctors || 0}</div>
            <div className="stat-change positive">+5% from last month</div>
          </div>
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <div className="stat-number">{stats.totalAppointments || 0}</div>
            <div className="stat-change positive">+18% from last week</div>
          </div>
          <div className="stat-card">
            <h3>ARV Treatments</h3>
            <div className="stat-number">{stats.totalARVTreatments || 0}</div>
            <div className="stat-change positive">Active regimens</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPatients = () => (
    <div>
      <div className="section-header">
        <h2>Patient Management</h2>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={patientSearch}
          onChange={handlePatientSearch}
          className="search-input"
        />
      </div>

      {patientsLoading ? (
        <div className="loading-state">Loading patient data...</div>
      ) : patientsError ? (
        <div className="error-state">{patientsError}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Patient Info</th>
                <th>Contact</th>
                <th>Specialty</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, idx) => (
                <tr key={p.userId || idx}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        {p.firstName} {p.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        @{p.username}
                      </div>
                    </div>
                  </td>
                  <td>{p.email}</td>
                  <td>{p.specialty || 'General'}</td>
                  <td>
                    <span className={`status-badge ${p.isActive ? 'active' : 'inactive'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button
                      className="action-link"
                      onClick={() => navigate(`/manager/patients/${p.userId}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDoctors = () => (
    <div>
      <div className="section-header">
        <h2>Doctor Management</h2>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search doctors by name or specialty..."
          value={doctorSearch}
          onChange={handleDoctorSearch}
          className="search-input"
        />
      </div>

      {doctorsLoading ? (
        <div className="loading-state">Loading doctor data...</div>
      ) : doctorsError ? (
        <div className="error-state">{doctorsError}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor Info</th>
                <th>Contact</th>
                <th>Specialty</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d, idx) => (
                <tr key={d.userId || idx}>
                  <td>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>
                        Dr. {d.firstName} {d.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        @{d.username}
                      </div>
                    </div>
                  </td>
                  <td>{d.email}</td>
                  <td>{d.specialty || 'General Medicine'}</td>
                  <td>
                    <span className={`status-badge ${d.isActive ? 'active' : 'inactive'}`}>
                      {d.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <button
                      className="action-link"
                      onClick={() => navigate(`/manager/doctors/${d.userId}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderARV = () => (
    <div>
      <div className="section-header">
        <h2>ARV Treatment Management</h2>
      </div>

      {arvLoading ? (
        <div className="loading-state">Loading ARV treatment data...</div>
      ) : arvError ? (
        <div className="error-state">{arvError}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Treatment ID</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Regimen</th>
                <th>Duration</th>
                <th>Adherence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {arvTreatments.map((arv, idx) => (
                <tr key={arv.arvTreatmentID || idx}>
                  <td>#{arv.arvTreatmentID}</td>
                  <td>{arv.patientName || 'N/A'}</td>
                  <td>{arv.doctorName || 'N/A'}</td>
                  <td style={{ fontWeight: '600' }}>{arv.regimen}</td>
                  <td>
                    <div style={{ fontSize: '0.75rem' }}>
                      <div>Start: {arv.startDate}</div>
                      {arv.endDate && <div>End: {arv.endDate}</div>}
                    </div>
                  </td>
                  <td>{arv.adherence || 'Not recorded'}</td>
                  <td>
                    <span className={`status-badge ${arv.isActive ? 'active' : 'inactive'}`}>
                      {arv.isActive ? 'Active' : 'Completed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSchedules = () => (
    <div>
      <div className="section-header">
        <h2>Schedule Management</h2>
      </div>

      {schedulesLoading ? (
        <div className="loading-state">Loading schedule data...</div>
      ) : schedulesError ? (
        <div className="error-state">{schedulesError}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Slot ID</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Availability</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((s, idx) => (
                <tr key={s.availabilitySlotId || idx}>
                  <td>#{s.availabilitySlotId}</td>
                  <td>
                    {s.doctorUser && s.doctorUser.userId ? 
                      `Doctor ID: ${s.doctorUser.userId}` : 'N/A'}
                  </td>
                  <td style={{ fontWeight: '600' }}>{s.slotDate}</td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      {s.startTime} - {s.endTime}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${s.isBooked ? 'booked' : 'available'}`}>
                      {s.isBooked ? 'Booked' : 'Available'}
                    </span>
                  </td>
                  <td>{s.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderNotifications = () => (
    <div>
      <div className="section-header">
        <h2>Notification Management</h2>
        <p>Manage patient notifications and communication across the system</p>
      </div>
      <NotificationsManager />
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'patients':
        return renderPatients();
      case 'doctors':
        return renderDoctors();
      case 'arv':
        return renderARV();
      case 'schedules':
        return renderSchedules();
      case 'notifications':
        return renderNotifications();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="manager-dashboard">
      <DashboardHeader title="Manager Dashboard" />
      
      <div className="dashboard-container">
        <div className="dashboard-layout">
          <aside className="manager-sidebar">
            <div className="sidebar-title">Navigation Menu</div>
            <nav className="sidebar-nav">
              {SIDEBAR_OPTIONS.map(opt => (
                <div
                  key={opt.key}
                  className={`sidebar-option ${activeTab === opt.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(opt.key)}
                >
                  <span className="sidebar-icon">{opt.icon}</span>
                  <span>{opt.label}</span>
                </div>
              ))}
            </nav>
          </aside>

          <main className="dashboard-main">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

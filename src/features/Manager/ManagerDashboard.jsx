import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
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
  const [arvFrom, setArvFrom] = useState("");
  const [arvTo, setArvTo] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState('');
  const [scheduleFrom, setScheduleFrom] = useState("");
  const [scheduleTo, setScheduleTo] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const navigate = useNavigate();

  // Handle CSV exports
  const handleExportCSV = async (endpoint) => {
    try {
        const response = await apiClient.get(`/export/${endpoint}`, {
            responseType: 'blob'
        });
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${endpoint}.csv`);
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        
        // Clean up the URL
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(`Error downloading ${endpoint} CSV:`, error);
        alert(`Failed to download ${endpoint} CSV. Please try again later.`);
    }
};

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
      fetchARVTreatments();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchARVTreatments = async () => {
    setArvLoading(true);
    setArvError("");
    try {
      let res;
      if (arvFrom && arvTo) {
        res = await apiClient.get(`/manager/arv-treatments/search?from=${encodeURIComponent(arvFrom)}&to=${encodeURIComponent(arvTo)}`);
      } else {
        res = await apiClient.get('/manager/arv-treatments');
      }
      setArvTreatments(res.data);
    } catch {
      setArvError('Failed to load ARV regimens.');
    } finally {
      setArvLoading(false);
    }
  };

  const handleARVFromChange = (e) => setArvFrom(e.target.value);
  const handleARVToChange = (e) => setArvTo(e.target.value);
  const handleARVSearch = (e) => {
    e.preventDefault();
    fetchARVTreatments();
  };

  useEffect(() => {
    if (activeTab === 'schedules') {
      fetchSchedules();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  const fetchSchedules = async () => {
    setSchedulesLoading(true);
    setSchedulesError('');
    try {
      let res;
      if (scheduleFrom && scheduleTo) {
        res = await apiClient.get(`/manager/schedules/search?from=${encodeURIComponent(scheduleFrom)}&to=${encodeURIComponent(scheduleTo)}`);
      } else {
        res = await apiClient.get('/manager/schedules');
      }
      setSchedules(res.data);
    } catch {
      setSchedulesError('Failed to load schedules.');
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleScheduleFromChange = (e) => setScheduleFrom(e.target.value);
  const handleScheduleToChange = (e) => setScheduleTo(e.target.value);
  const handleScheduleSearch = (e) => {
    e.preventDefault();
    fetchSchedules();
  };

  // Search patients
  // Only update state on change
  const handlePatientSearchChange = (e) => {
    setPatientSearch(e.target.value);
  };

  const handlePatientSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value;
      if (value.trim() === "") {
        setPatientsLoading(true);
        setPatientsError("");
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
      setPatientsError("");
      try {
        const res = await apiClient.get(`/manager/patients/search?q=${encodeURIComponent(value)}`);
        setPatients(res.data);
      } catch {
        setPatientsError('Failed to search patients.');
      } finally {
        setPatientsLoading(false);
      }
    }
  };

  // Search doctors
  const handleDoctorSearchChange = (e) => {
    setDoctorSearch(e.target.value);
  };

  const handleDoctorSearchKeyDown = async (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value;
      if (value.trim() === "") {
        setDoctorsLoading(true);
        setDoctorsError("");
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
      setDoctorsError("");
      try {
        const res = await apiClient.get(`/manager/doctors/search?q=${encodeURIComponent(value)}`);
        setDoctors(res.data);
      } catch {
        setDoctorsError('Failed to search doctors.');
      } finally {
        setDoctorsLoading(false);
      }
    }
  };

  const renderOverview = () => (
    <div>
      <div className="section-header">
        <h2>System Overview</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            className="btn-secondary"
            onClick={() => handleExportCSV('patient-profiles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>⬇️</span> Export Patient Profiles
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleExportCSV('doctor-slots')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>⬇️</span> Export Doctor Slots
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleExportCSV('arv-treatments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>⬇️</span> Export ARV Treatments
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleExportCSV('appointments')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              borderRadius: 8,
              padding: '0.5rem 1.25rem',
              fontSize: '0.875rem',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>⬇️</span> Export Appointments
          </button>
          <button
            className="btn-secondary"
            onClick={() => handleExportCSV('doctor-profiles')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 600,
              borderRadius: 8,
              padding: '0.5rem 1.25rem', 
              fontSize: '0.875rem',
              background: '#22c55e',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span>⬇️</span> Export Doctor Profiles
          </button>
        </div>
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
          </div>
          <div className="stat-card">
            <h3>Active Doctors</h3>
            <div className="stat-number">{stats.totalDoctors || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Appointments</h3>
            <div className="stat-number">{stats.totalAppointments || 0}</div>
          </div>
          <div className="stat-card">
            <h3>ARV Treatments</h3>
            <div className="stat-number">{stats.totalARVTreatments || 0}</div>
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
          placeholder="Search patients by name"
          value={patientSearch}
          onChange={handlePatientSearchChange}
          onKeyDown={handlePatientSearchKeyDown}
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
          placeholder="Search doctors by name"
          value={doctorSearch}
          onChange={handleDoctorSearchChange}
          onKeyDown={handleDoctorSearchKeyDown}
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
      <form className="arv-search-form" onSubmit={handleARVSearch} style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>
          From:
          <input type="date" value={arvFrom} onChange={handleARVFromChange} />
        </label>
        <label>
          To:
          <input type="date" value={arvTo} onChange={handleARVToChange} />
        </label>
        <button type="submit" className="search-btn">Search</button>
        <button type="button" className="reset-btn" onClick={() => { setArvFrom(""); setArvTo(""); fetchARVTreatments(); }}>Reset</button>
      </form>
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
      <form className="schedule-search-form" onSubmit={handleScheduleSearch} style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <label>
          From:
          <input type="date" value={scheduleFrom} onChange={handleScheduleFromChange} />
        </label>
        <label>
          To:
          <input type="date" value={scheduleTo} onChange={handleScheduleToChange} />
        </label>
        <button type="submit" className="search-btn">Search</button>
        <button type="button" className="reset-btn" onClick={() => { setScheduleFrom(""); setScheduleTo(""); fetchSchedules(); }}>Reset</button>
      </form>
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

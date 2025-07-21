import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import './ManagerDashboard.css';
import PaginatedTable from '../../features/components/PaginatedTable';

const SIDEBAR_OPTIONS = [
  { key: 'overview', label: 'Dashboard Overview', icon: '📊' },
  { key: 'patients', label: 'Patient Management', icon: '👥' },
  { key: 'doctors', label: 'Doctor Management', icon: '👨‍⚕️' },
  { key: 'arv', label: 'ARV Regimen Management', icon: '💊' },
  { key: 'schedules', label: 'Schedule Management', icon: '📅' },
];

const ManagerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] =useState({});
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

  // --- THÊM MỚI: State cho chức năng thông báo gender ---
  const [userProfile, setUserProfile] = useState(null);
  const [showGenderNotification, setShowGenderNotification] = useState(false);


  // --- THÊM MỚI: Hàm tải hồ sơ người dùng để kiểm tra gender ---
  const loadUserProfile = async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      setUserProfile(response.data);
      
      // Kiểm tra nếu gender là null hoặc rỗng và hiển thị thông báo
      if (!response.data?.gender) {
        setShowGenderNotification(true);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      // Không cần hiển thị lỗi này cho người dùng, chỉ log ra console
    }
  };

  // --- THÊM MỚI: Các hàm xử lý hành động trên banner thông báo ---
  const handleGoToSettings = () => {
    navigate('/settings'); // Điều hướng đến trang cài đặt
  };

  const dismissGenderNotification = () => {
    setShowGenderNotification(false); // Ẩn thông báo
  };


  // Handle CSV exports
  const handleExportCSV = async (endpoint) => {
    // ... code giữ nguyên ...
  };
   const patientColumns = [
    { header: 'Patient Name', cell: p => `${p.lastName} ${p.firstName}` },
    { header: 'Gender', cell: p => p.gender || 'N/A' },
    { header: 'Date of Birth', cell: p => new Date(p.dateOfBirth).toLocaleDateString() },
    { header: 'Phone', cell: p => p.phoneNumber || 'N/A' },
    { header: 'Actions', cell: p => (
      <button className="view-btn" onClick={() => navigate(`/manager/patients/${p.patientId}`)}>
        View Details
      </button>
    )}
  ];

  const doctorColumns = [
    { header: 'Doctor Name', cell: d => `Dr. ${d.lastName} ${d.firstName}` },
    { header: 'Specialization', cell: d => d.specialization || 'N/A' },
    { header: 'Email', cell: d => d.email },
    { header: 'Phone', cell: d => d.phoneNumber || 'N/A' },
     { header: 'Actions', cell: d => (
      <button className="view-btn" onClick={() => navigate(`/manager/doctors/${d.doctorId}`)}>
        View Schedule
      </button>
    )}
  ];

  const arvColumns = [
    { header: 'Regimen Code', cell: a => a.regimenCode },
    { header: 'Line', cell: a => a.line },
    { header: 'Description', cell: a => a.description }
  ];

  const scheduleColumns = [
    { header: 'Doctor', cell: s => `Dr. ${s.doctor.lastName} ${s.doctor.firstName}` },
    { header: 'Date', cell: s => new Date(s.workDate).toLocaleDateString() },
    { header: 'Start Time', cell: s => s.startTime.substring(0, 5) },
    { header: 'End Time', cell: s => s.endTime.substring(0, 5) }
  ];

  // --- THÊM MỚI: useEffect để tải hồ sơ người dùng khi component được mount ---
  useEffect(() => {
    loadUserProfile();
  }, []); // Mảng dependency rỗng đảm bảo nó chỉ chạy một lần

  useEffect(() => {
    if (activeTab === 'overview') {
      const fetchStats = async () => {
        // ... code giữ nguyên ...
      };
      fetchStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'patients') {
      const fetchPatients = async () => {
        // ... code giữ nguyên ...
      };
      fetchPatients();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'doctors') {
      const fetchDoctors = async () => {
        // ... code giữ nguyên ...
      };
      fetchDoctors();
    }
  }, [activeTab]);

  // Các useEffect và hàm xử lý khác giữ nguyên
  // ... (fetchARVTreatments, fetchSchedules, handle search, etc.)

  const renderOverview = () => { /* ... code giữ nguyên ... */ };
  const renderPatients = () => (
    <div className="tab-content">
      <div className="content-header">
        <h2>Patient Management</h2>
        <button onClick={() => handleExportCSV('patients')} className="export-btn">Export Patients CSV</button>
      </div>
      <div className="filters">
        <input
          type="text"
          placeholder="Search by patient name..."
          value={patientSearch}
          onChange={e => setPatientSearch(e.target.value)}
        />
      </div>
      {patientsLoading ? <div className="loading-spinner">Loading...</div> :
       patientsError ? <div className="error-message">{patientsError}</div> :
        (
          <PaginatedTable
            data={patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearch.toLowerCase()))}
            columns={patientColumns}
            itemsPerPage={10}
            emptyMessage="No patients found."
          />
        )
      }
    </div>
  );
  const renderDoctors = () => (
    <div className="tab-content">
      <div className="content-header">
        <h2>Doctor Management</h2>
        <button onClick={() => handleExportCSV('doctors')} className="export-btn">Export Doctors CSV</button>
      </div>
      <div className="filters">
        <input
          type="text"
          placeholder="Search by doctor name..."
          value={doctorSearch}
          onChange={e => setDoctorSearch(e.target.value)}
        />
      </div>
      {doctorsLoading ? <div className="loading-spinner">Loading...</div> :
       doctorsError ? <div className="error-message">{doctorsError}</div> :
        (
          <PaginatedTable
            data={doctors.filter(d => `${d.firstName} ${d.lastName}`.toLowerCase().includes(doctorSearch.toLowerCase()))}
            columns={doctorColumns}
            itemsPerPage={3}
            emptyMessage="No doctors found."
          />
        )
      }
    </div>
  );
  const renderARV = () => (
    <div className="tab-content">
      <div className="content-header">
        <h2>ARV Regimen Management</h2>
        {/* Thêm nút export nếu cần */}
      </div>
      {arvLoading ? <div className="loading-spinner">Loading...</div> :
       arvError ? <div className="error-message">{arvError}</div> :
        (
          <PaginatedTable
            data={arvTreatments}
            columns={arvColumns}
            itemsPerPage={15}
            emptyMessage="No ARV regimens found."
          />
        )
      }
    </div>
  );
  const renderSchedules = () => (
    <div className="tab-content">
      <div className="content-header">
        <h2>Schedule Management</h2>
        <button onClick={() => handleExportCSV('schedules')} className="export-btn">Export Schedules CSV</button>
      </div>
      {/* Giữ lại các filter nếu bạn cần */}
      {schedulesLoading ? <div className="loading-spinner">Loading...</div> :
       schedulesError ? <div className="error-message">{schedulesError}</div> :
        (
          <PaginatedTable
            data={schedules}
            columns={scheduleColumns}
            itemsPerPage={15}
            emptyMessage="No schedules found."
          />
        )
      }
    </div>
  );
  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'patients': return renderPatients();
      case 'doctors': return renderDoctors();
      case 'arv': return renderARV();
      case 'schedules': return renderSchedules();
      default: return renderOverview();
    }
  };

  return (
    <div className="manager-dashboard">
      <DashboardHeader title="Manager Dashboard" />
      
      {/* --- THÊM MỚI: Banner thông báo cập nhật Gender --- */}
      {showGenderNotification && (
        <div className="gender-notification-banner">
          <div className="gender-notification-content">
            <span className="gender-notification-icon">⚠️</span>
            <div className="gender-notification-text">
              <strong>Profile Incomplete:</strong> Please update your gender in Settings to complete your profile.
            </div>
            <div className="gender-notification-actions">
              <button
                onClick={handleGoToSettings}
                className="gender-btn primary"
              >
                Go to Settings
              </button>
              <button
                onClick={dismissGenderNotification}
                className="gender-btn secondary"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
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
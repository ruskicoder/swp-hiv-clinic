import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import DashboardHeader from '../../components/layout/DashboardHeader';
import './ManagerDashboard.css';

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
  const renderPatients = () => { /* ... code giữ nguyên ... */ };
  const renderDoctors = () => { /* ... code giữ nguyên ... */ };
  const renderARV = () => { /* ... code giữ nguyên ... */ };
  const renderSchedules = () => { /* ... code giữ nguyên ... */ };

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
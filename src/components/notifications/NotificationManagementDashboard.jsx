import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import notificationService from '../../services/notificationService';
import NotificationSendModal from './NotificationSendModal';
import NotificationHistoryTable from './NotificationHistoryTable';
import NotificationTemplateSelector from './NotificationTemplateSelector';
import './NotificationManagementDashboard.css';

/**
 * Comprehensive notification management dashboard for doctors
 * Provides functionality to send notifications, manage templates, and view history
 */
const NotificationManagementDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showSendModal, setShowSendModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Data states
  const [patients, setPatients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    pendingNotifications: 0,
    todaysSent: 0,
    mostUsedTemplate: null
  });
  
  // Filter states
  const [selectedPatient, setSelectedPatient] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  /**
   * Load all dashboard data including patients, templates, and history
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const doctorId = user?.userId || user?.id;
      if (!doctorId) {
        setError('Doctor ID not found. Please login again.');
        return;
      }

      const [patientsRes, templatesRes, historyRes] = await Promise.allSettled([
        notificationService.getPatientsWithAppointments(doctorId),
        notificationService.getNotificationTemplates(),
        notificationService.getNotificationHistory(doctorId)
      ]);

      // Handle patients response
      if (patientsRes.status === 'fulfilled' && patientsRes.value.success) {
        setPatients(patientsRes.value.data || []);
      } else {
        console.error('Failed to load patients:', patientsRes.value?.error || patientsRes.reason);
        setPatients([]);
      }

      // Handle templates response
      if (templatesRes.status === 'fulfilled' && templatesRes.value.success) {
        setTemplates(templatesRes.value.data || []);
      } else {
        console.error('Failed to load templates:', templatesRes.value?.error || templatesRes.reason);
        setTemplates([]);
      }

      // Handle notification history response
      if (historyRes.status === 'fulfilled' && historyRes.value.success) {
        const history = historyRes.value.data || [];
        setNotificationHistory(history);
        calculateAnalytics(history);
      } else {
        console.error('Failed to load notification history:', historyRes.value?.error || historyRes.reason);
        setNotificationHistory([]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate analytics from notification history
   */
  const calculateAnalytics = (history) => {
    const today = new Date().toDateString();
    const todaysSent = history.filter(n => 
      new Date(n.sentAt).toDateString() === today && n.status === 'SENT'
    ).length;

    const pending = history.filter(n => n.status === 'PENDING').length;
    const totalSent = history.filter(n => n.status === 'SENT').length;

    // Find most used template
    const templateUsage = {};
    history.forEach(n => {
      if (n.templateName) {
        templateUsage[n.templateName] = (templateUsage[n.templateName] || 0) + 1;
      }
    });

    const mostUsedTemplate = Object.keys(templateUsage).length > 0 
      ? Object.keys(templateUsage).reduce((a, b) => 
          templateUsage[a] > templateUsage[b] ? a : b
        ) 
      : null;

    setAnalytics({
      totalSent,
      pendingNotifications: pending,
      todaysSent,
      mostUsedTemplate
    });
  };

  /**
   * Handle sending a notification
   */
  const handleSendNotification = async (notificationData) => {
    try {
      const doctorId = user?.userId || user?.id;
      if (!doctorId) {
        return {
          success: false,
          error: 'Doctor ID not found. Please login again.'
        };
      }

      const result = await notificationService.sendNotification(notificationData, doctorId);
      
      if (result.success) {
        setShowSendModal(false);
        loadDashboardData(); // Reload to get updated data
        return { success: true, message: result.message || 'Notification sent successfully!' };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send notification'
        };
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while sending notification'
      };
    }
  };

  /**
   * Handle unsending a single notification
   */
  const handleUnsendNotification = async (notificationId) => {
    try {
      const doctorId = user?.userId || user?.id;
      if (!doctorId) {
        return {
          success: false,
          error: 'Doctor ID not found. Please login again.'
        };
      }

      const result = await notificationService.unsendNotification(notificationId, doctorId);
      
      if (result.success) {
        loadDashboardData(); // Reload data
        return { success: true, message: result.message || 'Notification cancelled successfully!' };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to cancel notification'
        };
      }
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return {
        success: false,
        error: 'An unexpected error occurred while cancelling notification'
      };
    }
  };

  /**
   * Handle bulk notification operations
   */
  const handleBulkOperation = async (operation, selectedIds) => {
    try {
      const result = await notificationService.bulkOperation(operation, selectedIds);
      
      if (result.success) {
        loadDashboardData(); // Reload data
        return { success: true, message: result.message || `Bulk ${operation} completed successfully!` };
      } else {
        return {
          success: false,
          error: result.error || `Failed to perform bulk ${operation}`
        };
      }
    } catch (error) {
      console.error(`Error performing bulk ${operation}:`, error);
      return {
        success: false,
        error: `An unexpected error occurred during bulk ${operation}`
      };
    }
  };

  /**
   * Filter notification history based on current filters
   */
  const getFilteredHistory = () => {
    let filtered = [...notificationHistory];

    // Filter by patient
    if (selectedPatient) {
      filtered = filtered.filter(n => n.patientId === parseInt(selectedPatient));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(n => n.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Filter by date range
    const now = new Date();
    const filterDate = new Date();
    
    switch (dateRange) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      default:
        filterDate.setFullYear(1900); // Show all
    }

    filtered = filtered.filter(n => new Date(n.createdAt) >= filterDate);

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  if (loading) {
    return (
      <div className="notification-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading notification management dashboard...</p>
      </div>
    );
  }

  return (
    <div className="notification-management-dashboard">
      <div className="dashboard-header">
        <div className="header-info">
          <h1>Notification Management</h1>
          <p>Send notifications and manage communication with your patients</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => setShowTemplateSelector(true)}
            aria-label="Manage notification templates"
          >
            <span className="icon">📋</span>
            Manage Templates
          </button>
          
          <button 
            className="btn-primary"
            onClick={() => setShowSendModal(true)}
            aria-label="Send new notification"
          >
            <span className="icon">📤</span>
            Send Notification
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert" role="alert">
          <span className="icon">⚠️</span>
          <span>{error}</span>
          <button 
            className="close-btn"
            onClick={() => setError('')}
            aria-label="Close error message"
          >
            ×
          </button>
        </div>
      )}

      {/* Analytics Cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="card-icon sent">📤</div>
          <div className="card-content">
            <h3>Total Sent</h3>
            <p className="stat-number">{analytics.totalSent}</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="card-icon pending">⏳</div>
          <div className="card-content">
            <h3>Pending</h3>
            <p className="stat-number">{analytics.pendingNotifications}</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="card-icon today">📅</div>
          <div className="card-content">
            <h3>Today's Sent</h3>
            <p className="stat-number">{analytics.todaysSent}</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <div className="card-icon template">🎯</div>
          <div className="card-content">
            <h3>Most Used Template</h3>
            <p className="stat-text">{analytics.mostUsedTemplate || 'None'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-group">
          <div className="filter-item">
            <label htmlFor="patient-filter">Filter by Patient:</label>
            <select 
              id="patient-filter"
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="filter-select"
            >
              <option value="">All Patients</option>
              {patients.map(patient => (
                <option key={patient.userId} value={patient.userId}>
                  {patient.firstName} {patient.lastName} ({patient.email})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select 
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="date-filter">Date Range:</label>
            <select 
              id="date-filter"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <button 
            className="btn-secondary reset-filters"
            onClick={() => {
              setSelectedPatient('');
              setStatusFilter('all');
              setDateRange('week');
            }}
            aria-label="Reset all filters"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Notification History Table */}
      <div className="history-section">
        <div className="section-header">
          <h2>Notification History</h2>
          <div className="history-actions">
            <button 
              className="btn-secondary"
              onClick={() => loadDashboardData()}
              aria-label="Refresh notification history"
            >
              <span className="icon">🔄</span>
              Refresh
            </button>
          </div>
        </div>

        <NotificationHistoryTable
          notifications={getFilteredHistory()}
          patients={patients}
          onUnsend={(notificationId) => handleUnsendNotification(notificationId)}
          onBulkOperation={handleBulkOperation}
          onRefresh={loadDashboardData}
        />
      </div>

      {/* Send Notification Modal */}
      {showSendModal && (
        <NotificationSendModal
          isOpen={showSendModal}
          onClose={() => setShowSendModal(false)}
          onSend={handleSendNotification}
          patients={patients}
          templates={templates}
        />
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <NotificationTemplateSelector
          isOpen={showTemplateSelector}
          onClose={() => setShowTemplateSelector(false)}
          templates={templates}
          onRefresh={loadDashboardData}
        />
      )}
    </div>
  );
};

export default NotificationManagementDashboard;
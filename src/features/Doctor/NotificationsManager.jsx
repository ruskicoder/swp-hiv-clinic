import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import './NotificationsManager.css';

const NotificationsManager = () => {
    const { user } = useAuth();
    const [patientsWithAppointments, setPatientsWithAppointments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showSendForm, setShowSendForm] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('APPOINTMENT_REMINDER');
    const [templateId, setTemplateId] = useState('');
    const [templates, setTemplates] = useState([]);
    const [viewMode, setViewMode] = useState('patients'); // 'patients', 'notifications'
    const [statusFilter, setStatusFilter] = useState('all');
    const [sendingNotification, setSendingNotification] = useState(false);
    const [retractingNotification, setRetractingNotification] = useState(false);
    const [notificationStatuses, setNotificationStatuses] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Fetch patients with appointments sorted by status
            const patientsResponse = await apiClient.get('/doctors/patients-appointments-sorted');
            setPatientsWithAppointments(patientsResponse.data);
            
            // Fetch notification templates
            const templatesResponse = await apiClient.get('/doctors/notification-templates');
            setTemplates(templatesResponse.data);
            
            // Fetch existing notifications
            const notificationsResponse = await apiClient.get('/doctors/notifications');
            setNotifications(notificationsResponse.data);
            
            // Fetch notification statuses for each notification
            const statusPromises = notificationsResponse.data.map(notification =>
                fetchNotificationStatus(notification.notificationId)
            );
            await Promise.all(statusPromises);
            
        } catch (err) {
            setError('Failed to fetch notification data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNotificationStatus = async (notificationId) => {
        try {
            const response = await apiClient.get(`/doctors/notifications/${notificationId}/status`);
            setNotificationStatuses(prev => ({
                ...prev,
                [notificationId]: response.data
            }));
        } catch (err) {
            console.error(`Failed to fetch status for notification ${notificationId}:`, err);
        }
    };

    const handleSendNotification = async () => {
        if (!selectedPatient || !notificationMessage) {
            alert('Please select a patient and enter a message.');
            return;
        }

        try {
            setSendingNotification(true);
            
            const response = await apiClient.post('/doctors/send-notification', {
                patientId: selectedPatient,
                message: notificationMessage,
                type: notificationType,
                templateId: templateId || null
            });
            
            if (response.data.success) {
                // Reset form and refresh data
                setShowSendForm(false);
                setNotificationMessage('');
                setSelectedPatient(null);
                setTemplateId('');
                fetchData();
                
                alert('Notification sent successfully!');
            } else {
                alert(response.data.message || 'Failed to send notification');
            }
        } catch (err) {
            alert(`Failed to send notification: ${err.response?.data?.message || err.message}`);
            console.error(err);
        } finally {
            setSendingNotification(false);
        }
    };

    const handleRetractNotification = async (notificationId, reason = '') => {
        try {
            setRetractingNotification(true);
            
            const response = await apiClient.post(`/doctors/notifications/${notificationId}/retract`, {
                reason: reason || 'Retracted by doctor'
            });
            
            if (response.data.success) {
                // Refresh data to get updated status
                fetchData();
                alert('Notification retracted successfully!');
            } else {
                alert(response.data.message || 'Failed to retract notification');
            }
        } catch (err) {
            alert(`Failed to retract notification: ${err.response?.data?.message || err.message}`);
            console.error(err);
        } finally {
            setRetractingNotification(false);
        }
    };

    const handleSendBatchNotifications = async () => {
        if (!notificationMessage) {
            alert('Please enter a message for the batch notification.');
            return;
        }

        try {
            setSendingNotification(true);
            
            // Get all patient IDs from current filtered view
            const patientIds = getFilteredPatients().map(p => p.patientUserId);
            
            // Send notifications to all patients
            const promises = patientIds.map(patientId =>
                apiClient.post('/doctors/send-notification', {
                    patientId: patientId,
                    message: notificationMessage,
                    type: notificationType,
                    templateId: templateId || null
                })
            );
            
            await Promise.all(promises);
            
            // Reset form and refresh data
            setShowSendForm(false);
            setNotificationMessage('');
            setTemplateId('');
            fetchData();
            
            alert('Batch notifications sent successfully!');
        } catch (err) {
            alert(`Failed to send batch notifications: ${err.response?.data?.message || err.message}`);
            console.error(err);
        } finally {
            setSendingNotification(false);
        }
    };

    const handleTemplateSelect = (e) => {
        const selectedTemplateId = e.target.value;
        setTemplateId(selectedTemplateId);
        
        if (selectedTemplateId) {
            const template = templates.find(t => t.templateId === parseInt(selectedTemplateId));
            if (template) {
                setNotificationMessage(template.templateContent);
            }
        }
    };

    const getFilteredPatients = () => {
        let filtered = [...patientsWithAppointments];
        
        // Filter by appointment status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(patient =>
                patient.appointments.some(apt => apt.status === statusFilter)
            );
        }
        
        return filtered;
    };

    const getFilteredNotifications = () => {
        let filtered = [...notifications];
        
        // Filter by patient if selected
        if (selectedPatient) {
            filtered = filtered.filter(n => n.patientUserId === selectedPatient);
        }
        
        // Sort by creation date, newest first
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return filtered;
    };

    const getNotificationStatusInfo = (notificationId) => {
        const status = notificationStatuses[notificationId];
        if (!status) return { label: 'Unknown', className: 'unknown' };
        
        switch (status.status) {
            case 'SENT':
                return { label: 'Sent', className: 'sent' };
            case 'DELIVERED':
                return { label: 'Delivered', className: 'delivered' };
            case 'SEEN':
                return { label: 'Seen', className: 'seen' };
            case 'READ':
                return { label: 'Read', className: 'read' };
            case 'RETRACTED':
                return { label: 'Retracted', className: 'retracted' };
            default:
                return { label: 'Unknown', className: 'unknown' };
        }
    };

    const renderActionButtons = (notification) => {
        const statusInfo = getNotificationStatusInfo(notification.notificationId);
        const canRetract = statusInfo.className !== 'retracted' && statusInfo.className !== 'read';
        
        return (
            <div className="action-buttons">
                {canRetract && (
                    <button
                        onClick={() => {
                            const reason = prompt('Enter reason for retracting this notification (optional):');
                            if (reason !== null) { // User didn't cancel
                                handleRetractNotification(notification.notificationId, reason);
                            }
                        }}
                        className="action-button retract-button"
                        disabled={retractingNotification}
                    >
                        {retractingNotification ? 'Retracting...' : 'Retract'}
                    </button>
                )}
                <button
                    onClick={() => fetchNotificationStatus(notification.notificationId)}
                    className="action-button refresh-button"
                >
                    Refresh Status
                </button>
            </div>
        );
    };

    const renderStatusLabel = (notificationId) => {
        const statusInfo = getNotificationStatusInfo(notificationId);
        return <span className={`status-label status-${statusInfo.className}`}>{statusInfo.label}</span>;
    };

    if (loading) return <div className="loading-container">Loading notification data...</div>;
    if (error) return <div className="error-container">{error}</div>;

    return (
        <div className="notifications-manager">
            <div className="notifications-header">
                <h1>Notification Manager</h1>
                <div className="notifications-actions">
                    <button
                        className="create-button"
                        onClick={() => setShowSendForm(!showSendForm)}
                    >
                        {showSendForm ? 'Cancel' : 'Send Notification'}
                    </button>
                </div>
            </div>
            
            {showSendForm && (
                <div className="notification-form">
                    <h2>Send Notification</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="notificationType">Notification Type</label>
                            <select
                                id="notificationType"
                                value={notificationType}
                                onChange={(e) => setNotificationType(e.target.value)}
                            >
                                <option value="APPOINTMENT_REMINDER">Appointment Reminder</option>
                                <option value="MEDICATION_REMINDER">Medication Reminder</option>
                                <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                                <option value="LAB_RESULT">Lab Result</option>
                                <option value="CUSTOM">Custom Message</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="notificationRecipient">Recipient</label>
                            <select
                                id="notificationRecipient"
                                value={selectedPatient || ''}
                                onChange={(e) => setSelectedPatient(e.target.value ? parseInt(e.target.value) : null)}
                            >
                                <option value="">Select Patient</option>
                                {getFilteredPatients().map(patient => (
                                    <option key={patient.patientUserId} value={patient.patientUserId}>
                                        {patient.patientName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="notificationTemplate">Use Template</label>
                            <select
                                id="notificationTemplate"
                                value={templateId}
                                onChange={handleTemplateSelect}
                            >
                                <option value="">Select Template</option>
                                {templates.map(template => (
                                    <option key={template.templateId} value={template.templateId}>
                                        {template.templateName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="notificationMessage">Message</label>
                        <textarea
                            id="notificationMessage"
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                            rows={4}
                            placeholder="Enter notification message..."
                        />
                    </div>
                    
                    <div className="form-actions">
                        <button
                            className="send-button"
                            onClick={handleSendNotification}
                            disabled={!selectedPatient || !notificationMessage || sendingNotification}
                        >
                            {sendingNotification ? 'Sending...' : 'Send to Selected Patient'}
                        </button>
                        <button
                            className="send-all-button"
                            onClick={handleSendBatchNotifications}
                            disabled={!notificationMessage || sendingNotification}
                        >
                            {sendingNotification ? 'Sending...' : 'Send to All Filtered Patients'}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="view-controls">
                <div className="view-mode-tabs">
                    <button
                        className={viewMode === 'patients' ? 'active' : ''}
                        onClick={() => { setViewMode('patients'); setSelectedPatient(null); }}
                    >
                        Patient Management
                    </button>
                    <button
                        className={viewMode === 'notifications' ? 'active' : ''}
                        onClick={() => setViewMode('notifications')}
                    >
                        Sent Notifications
                    </button>
                </div>
                
                <div className="filters">
                    {viewMode === 'patients' && (
                        <select
                            onChange={(e) => setStatusFilter(e.target.value)}
                            value={statusFilter}
                            className="status-filter"
                        >
                            <option value="all">All Appointment Statuses</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                        </select>
                    )}
                    
                    {viewMode === 'notifications' && (
                        <select
                            onChange={(e) => setSelectedPatient(e.target.value ? parseInt(e.target.value) : null)}
                            value={selectedPatient || ''}
                        >
                            <option value="">All Patients</option>
                            {getFilteredPatients().map(patient => (
                                <option key={patient.patientUserId} value={patient.patientUserId}>
                                    {patient.patientName}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>
            
            {viewMode === 'patients' ? (
                <div className="patients-table-container">
                    <table className="patients-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Appointments</th>
                                <th>Priority Status</th>
                                <th>Next Appointment</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredPatients().length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="no-data">No patients found</td>
                                </tr>
                            ) : (
                                getFilteredPatients().map(patient => (
                                    <tr key={patient.patientUserId} className={`priority-${patient.priority.toLowerCase()}`}>
                                        <td>
                                            <div className="patient-info">
                                                <div className="patient-name">{patient.patientName}</div>
                                                <div className="patient-id">ID: {patient.patientUserId}</div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="appointments-summary">
                                                {patient.appointments.map(apt => (
                                                    <div key={apt.appointmentId} className={`appointment-item status-${apt.status.toLowerCase().replace(' ', '-')}`}>
                                                        <span className="appointment-date">{new Date(apt.appointmentDateTime).toLocaleDateString()}</span>
                                                        <span className="appointment-status">{apt.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`priority-badge priority-${patient.priority.toLowerCase()}`}>
                                                {patient.priority}
                                            </span>
                                        </td>
                                        <td>
                                            {patient.nextAppointment ?
                                                new Date(patient.nextAppointment).toLocaleString() :
                                                'None scheduled'
                                            }
                                        </td>
                                        <td>
                                            <button
                                                className="action-button send-button"
                                                onClick={() => {
                                                    setSelectedPatient(patient.patientUserId);
                                                    setShowSendForm(true);
                                                }}
                                            >
                                                Send Notification
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="notifications-table-container">
                    <table className="notifications-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Type</th>
                                <th>Message</th>
                                <th>Date Sent</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredNotifications().length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="no-data">No notifications found</td>
                                </tr>
                            ) : (
                                getFilteredNotifications().map(notification => (
                                    <tr key={notification.notificationId} className={`notification-row`}>
                                        <td>{notification.patientName}</td>
                                        <td>{notification.type.replace(/_/g, ' ')}</td>
                                        <td className="message-cell">{notification.message}</td>
                                        <td>{new Date(notification.createdAt).toLocaleString()}</td>
                                        <td>{renderStatusLabel(notification.notificationId)}</td>
                                        <td>{renderActionButtons(notification)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default NotificationsManager;
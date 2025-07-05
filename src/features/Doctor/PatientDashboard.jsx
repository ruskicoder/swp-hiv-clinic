import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import './PatientDashboard.css';

const PatientDashboard = () => {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        fetchPatientData();
    }, []);

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/doctors/dashboard-patients');
            setPatients(response.data);
        } catch (err) {
            setError('Failed to fetch patient data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sortedPatients = useMemo(() => {
        const statusOrder = { 'In Progress': 1, 'Scheduled': 2, 'Completed': 3 };
        return [...patients].sort((a, b) => {
            const statusA = statusOrder[a.appointmentStatus] || 4;
            const statusB = statusOrder[b.appointmentStatus] || 4;
            return statusA - statusB;
        });
    }, [patients]);

    const handleShowNotificationModal = (patient) => {
        setSelectedPatient(patient);
        setShowNotificationModal(true);
    };

    const closeNotificationModal = () => {
        setShowNotificationModal(false);
        setSelectedPatient(null);
    };

    const handleShowHistoryModal = (patient) => {
        setSelectedPatient(patient);
        setShowHistoryModal(true);
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setSelectedPatient(null);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="patient-dashboard">
            <h1>Patient Dashboard</h1>
            <table className="patient-table">
                <thead>
                    <tr>
                        <th>Patient Name</th>
                        <th>Appointment Date</th>
                        <th>Appointment Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedPatients.map(patient => (
                        <tr key={patient.patientId}>
                            <td>{patient.patientName}</td>
                            <td>{new Date(patient.appointmentDateTime).toLocaleString()}</td>
                            <td>{patient.appointmentStatus}</td>
                            <td>
                                <button onClick={() => handleShowNotificationModal(patient)}>Send Notification</button>
                                <button onClick={() => handleShowHistoryModal(patient)}>View History</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <NotificationModal patient={selectedPatient} onClose={closeNotificationModal} />
            <NotificationHistoryModal patient={selectedPatient} onClose={closeHistoryModal} />
        </div>
    );
};

export default PatientDashboard;

const NotificationModal = ({ patient, onClose }) => {
    const [message, setMessage] = useState('');
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    useEffect(() => {
        if (patient) {
            apiClient.get('/notifications/templates')
                .then(response => setTemplates(response.data))
                .catch(err => console.error('Failed to fetch templates', err));
        }
    }, [patient]);

    const handleTemplateChange = (e) => {
        const template = templates.find(t => t.templateId === parseInt(e.target.value));
        if (template) {
            setSelectedTemplate(template.templateId);
            setMessage(template.templateContent);
        }
    };

    const handleSend = async () => {
        try {
            await apiClient.post('/notifications/send', {
                patientId: patient.patientId,
                message: message,
                type: 'CUSTOM'
            });
            alert('Notification sent successfully!');
            onClose();
        } catch (err) {
            alert('Failed to send notification.');
            console.error(err);
        }
    };

    if (!patient) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Send Notification to {patient.patientName}</h2>
                <select onChange={handleTemplateChange} value={selectedTemplate}>
                    <option value="">Select a template</option>
                    {templates.map(template => (
                        <option key={template.templateId} value={template.templateId}>
                            {template.templateName}
                        </option>
                    ))}
                </select>
                <textarea
                    placeholder="Custom message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />
                <div className="modal-actions">
                    <button onClick={onClose}>Cancel</button>
                    <button onClick={handleSend}>Send</button>
                </div>
            </div>
        </div>
    );
};

const NotificationHistoryModal = ({ patient, onClose }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (patient) {
            setLoading(true);
            apiClient.get(`/notifications/history/${patient.patientId}`)
                .then(response => setHistory(response.data))
                .catch(err => console.error('Failed to fetch history', err))
                .finally(() => setLoading(false));
        }
    }, [patient]);

    const handleRetract = async (notificationId) => {
        try {
            await apiClient.post(`/notifications/${notificationId}/retract`);
            // Refresh history
            apiClient.get(`/notifications/history/${patient.patientId}`)
                .then(response => setHistory(response.data));
        } catch (err) {
            alert('Failed to retract notification.');
            console.error(err);
        }
    };

    if (!patient) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Notification History for {patient.patientName}</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Message</th>
                                <th>Status</th>
                                <th>Timestamp</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(notification => (
                                <tr key={notification.notificationId}>
                                    <td>{notification.message}</td>
                                    <td>{notification.status}</td>
                                    <td>{new Date(notification.createdAt).toLocaleString()}</td>
                                    <td>
                                        {notification.status === 'Sent' && (
                                            <button onClick={() => handleRetract(notification.notificationId)}>Retract</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <div className="modal-actions">
                    <button onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};
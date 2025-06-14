import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import EnhancedHeader from '../../components/enhanced/EnhancedHeader';
import PatientRecordSection from '../../components/PatientRecordSection';
import UnifiedCalendar from '../../components/schedule/UnifiedCalendar';
import ARVTreatmentModal from '../../components/arv/ARVTreatmentModal';
import ErrorBoundary from '../../components/ErrorBoundary';
import { safeRender, safeDate, safeDateTime, safeTime } from '../../utils/renderUtils';
import { Beams } from '../../../react-bits/src/ts-default/components/backgrounds/Beams';
import { SpotlightCard } from '../../../react-bits/src/ts-default/components/cards/SpotlightCard';
import { GooeyNav } from '../../../react-bits/src/ts-default/components/navs/GooeyNav';
import './DoctorDashboard.css';

const EnhancedDoctorDashboard = () => {
  // State management (same as before)
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [arvTreatments, setArvTreatments] = useState([]);
  const [showARVModal, setShowARVModal] = useState(false);
  const [showPrivacyAlert, setShowPrivacyAlert] = useState(false);

  // Format doctor's name
  const doctorName = user?.firstName 
    ? `${user.firstName} ${user.lastName || ''}`
    : user?.username || 'Doctor';

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'patients', label: 'Patients' },
    { id: 'availability', label: 'Availability' }
  ];

  return (
    <div className="doctor-dashboard">
      <Beams className="dashboard-background" />
      <EnhancedHeader 
        title={`Welcome, Dr. ${doctorName}`}
        subtitle="Manage your appointments and patient records"
      />

      <GooeyNav
        items={navItems}
        activeItem={activeTab}
        onChange={setActiveTab}
        className="dashboard-nav"
      />

      <main className="dashboard-content">
        <ErrorBoundary>
          <SpotlightCard className="appointments-section">
            {activeTab === 'overview' && (
              <div className="overview-grid">
                <UnifiedCalendar
                  appointments={appointments}
                  availabilitySlots={availabilitySlots}
                  onAppointmentSelect={setSelectedAppointment}
                />
                {patientRecord && (
                  <PatientRecordSection
                    patientRecord={patientRecord}
                    showPrivacyAlert={showPrivacyAlert}
                  />
                )}
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="appointments-list">
                {/* Appointments list content */}
              </div>
            )}

            {activeTab === 'patients' && (
              <div className="patients-list">
                {/* Patients list content */}
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="availability-section">
                {/* Availability management content */}
              </div>
            )}
          </SpotlightCard>
        </ErrorBoundary>
      </main>

      {showARVModal && (
        <ARVTreatmentModal
          show={showARVModal}
          onHide={() => setShowARVModal(false)}
          patientRecord={patientRecord}
          arvTreatments={arvTreatments}
        />
      )}
    </div>
  );
};

export default EnhancedDoctorDashboard;

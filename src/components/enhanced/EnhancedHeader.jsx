import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { GradientText } from '../../../react-bits/src/ts-default/components/text/GradientText';
import { Aurora } from '../../../react-bits/src/ts-default/components/backgrounds/Aurora';
import { SpotlightCard } from '../../../react-bits/src/ts-default/components/cards/SpotlightCard';
import { GlassIcons } from '../../../react-bits/src/ts-default/components/icons/GlassIcons';
import { TrueFocus } from '../../../react-bits/src/ts-default/components/text/TrueFocus';
import { FiUser, FiClock, FiShield, FiSettings } from 'react-icons/fi';
import '../layout/DashboardHeader.css';

const EnhancedHeader = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPatient = () => {
    return user && (user.role === 'Patient' || user?.role?.roleName === 'Patient');
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    if (isPatient()) {
      fetchPrivacySettings();
    }

    return () => clearInterval(timer);
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/api/patients/privacy-settings');
      setIsPrivate(response.data.isPrivate);
    } catch (err) {
      setError('Failed to fetch privacy settings');
      console.error('Error fetching privacy settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePrivacy = async () => {
    try {
      setIsLoading(true);
      await apiClient.post('/api/patients/privacy-settings', {
        isPrivate: !isPrivate
      });
      setIsPrivate(!isPrivate);
    } catch (err) {
      setError('Failed to update privacy settings');
      console.error('Error updating privacy settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const headerIcons = [
    { icon: <FiUser/>, color: '#4A90E2', label: user?.username || 'User' },
    { icon: <FiClock/>, color: '#50C878', label: currentDateTime.toLocaleTimeString() },
    isPatient() && { icon: <FiShield/>, color: isPrivate ? '#FFD700' : '#808080', label: isPrivate ? 'Private Mode' : 'Public Mode' },
    { icon: <FiSettings/>, color: '#9370DB', label: 'Settings' }
  ].filter(Boolean);

  return (
    <div className="dashboard-header">
      <Aurora 
        color1="#4A90E2" 
        color2="#50C878" 
        color3="#9370DB" 
        speed={0.5}
        blend={0.3}
      />
      <SpotlightCard className="header-content">
        <div className="header-title">
          <TrueFocus blurAmount={3} animationDuration={0.5}>
            <GradientText 
              text={title}
              gradient={["#4A90E2", "#50C878"]}
              className="header-heading"
            />
          </TrueFocus>
          {subtitle && <div className="header-subtitle">{subtitle}</div>}
        </div>
        <div className="header-controls">
          <GlassIcons items={headerIcons} />
          {isPatient() && (
            <button 
              onClick={togglePrivacy}
              disabled={isLoading}
              className={`privacy-toggle ${isPrivate ? 'private' : ''}`}
            >
              {isLoading ? 'Updating...' : isPrivate ? 'Disable Privacy' : 'Enable Privacy'}
            </button>
          )}
        </div>
      </SpotlightCard>
    </div>
  );
};

export default EnhancedHeader;

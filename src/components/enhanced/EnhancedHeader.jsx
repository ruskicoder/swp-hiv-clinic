import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import { GradientText } from '../../../react-bits/src/ts-default/components/text/GradientText';
import { Beams } from '../../../react-bits/src/ts-default/components/backgrounds/Beams';
import { SpotlightCard } from '../../../react-bits/src/ts-default/components/cards/SpotlightCard';
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

    const loadPrivateMode = async () => {
      if (isPatient()) {
        try {
          const response = await apiClient.get('/patients/privacy-settings');
          const privacyState = response.data?.isPrivate ?? false;
          setIsPrivate(privacyState);
          localStorage.setItem('privateMode', JSON.stringify(privacyState));
        } catch (error) {
          console.error('Failed to load privacy settings:', error);
          setError('Failed to load privacy settings');
          const savedMode = localStorage.getItem('privateMode');
          if (savedMode) {
            setIsPrivate(JSON.parse(savedMode));
          }
        }
      }
    };

    loadPrivateMode();
    return () => clearInterval(timer);
  }, [user]);

  const togglePrivacy = async () => {
    if (!isPatient() || isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await apiClient.post('/patients/privacy-settings', {
        isPrivate: !isPrivate
      });
      
      setIsPrivate(!isPrivate);
      localStorage.setItem('privateMode', JSON.stringify(!isPrivate));
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      setError('Failed to update privacy settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="dashboard-header">
      <Beams className="header-background" />
      <div className="header-content">
        <SpotlightCard>
          <div className="header-title-section">
            <GradientText
              text={title}
              className="header-title"
              gradient="from-primary-500 to-secondary-500"
            />
            {subtitle && (
              <GradientText
                text={subtitle}
                className="header-subtitle"
                gradient="from-gray-400 to-gray-600"
              />
            )}
          </div>
        </SpotlightCard>

        <div className="header-actions">
          {isPatient() && (
            <div className="privacy-toggle">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={togglePrivacy}
                  disabled={isLoading}
                />
                <span className="slider round"></span>
              </label>
              <span className="privacy-label">
                {isPrivate ? 'Private Mode' : 'Public Mode'}
              </span>
            </div>
          )}
          <div className="datetime">
            {currentDateTime.toLocaleString()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default EnhancedHeader;

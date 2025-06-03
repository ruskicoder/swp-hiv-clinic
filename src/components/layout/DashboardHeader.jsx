import { useAuth } from '../../contexts/AuthContext';
import UserProfileDropdown from './UserProfileDropdown';
import './DashboardHeader.css';

const DashboardHeader = ({ title, subtitle }) => {
  const { user } = useAuth();

  return (
    <div className="dashboard-header">
      <div className="dashboard-header-content">
        <div className="dashboard-header-info">
          {title && <h1 className="dashboard-title">{title}</h1>}
          {subtitle && <p className="dashboard-subtitle">{subtitle}</p>}
        </div>
        
        <div className="dashboard-header-actions">
          <UserProfileDropdown />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
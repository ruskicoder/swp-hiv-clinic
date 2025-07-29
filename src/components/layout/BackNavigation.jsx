import { useNavigate, useLocation } from 'react-router-dom';
import './BackNavigation.css';

const BackNavigation = ({ customBack, disabled = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Pages that should not show back navigation
  const noBackPages = [
    '/',
    '/login',
    '/register',
    '/admin',
    '/doctor',
    '/customer'
  ];

  const shouldShowBack = !noBackPages.includes(location.pathname) && !disabled;

  const handleBack = () => {
    if (customBack) {
      customBack();
    } else {
      navigate(-1);
    }
  };

  if (!shouldShowBack) {
    return null;
  }

  return (
    <button 
      className="back-navigation"
      onClick={handleBack}
      aria-label="Go back"
    >
      <svg 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none"
      >
        <path 
          d="M19 12H5m7-7l-7 7 7 7" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
      </svg>
      Back
    </button>
  );
};

export default BackNavigation;
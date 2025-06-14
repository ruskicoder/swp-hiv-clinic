import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Import enhanced components
import EnhancedDoctorDashboard from './components/enhanced/EnhancedDoctorDashboard';
import EnhancedHeader from './components/enhanced/EnhancedHeader';

/**
 * Main App component that sets up the application structure
 * with routing, authentication context, and error boundaries
 */
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppRouter 
            EnhancedDoctorDashboard={EnhancedDoctorDashboard}
            EnhancedHeader={EnhancedHeader}
          />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
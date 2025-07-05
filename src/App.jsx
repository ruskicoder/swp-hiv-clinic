import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

import StagewiseToolbarDevOnly from './StagewiseToolbarDevOnly';

/**
 * Main App component that sets up the application structure
 * with routing, authentication context, and error boundaries
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="App">
            <StagewiseToolbarDevOnly />
            <AppRouter />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
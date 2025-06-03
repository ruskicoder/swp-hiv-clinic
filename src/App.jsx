import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import './components/ErrorBoundary.css';

function App() {
  return (
    <ErrorBoundary>
        <div className="App">
        <Router>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
      </Router>
      </div>
    </ErrorBoundary>
  );
}

export default App;

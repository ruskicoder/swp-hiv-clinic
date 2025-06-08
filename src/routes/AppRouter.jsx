import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';

// Lazy load components to improve performance
const Home = React.lazy(() => import('../features/Website/Home'));
const Login = React.lazy(() => import('../features/auth/Login'));
const Register = React.lazy(() => import('../features/auth/Register'));
const CustomerDashboard = React.lazy(() => import('../features/Customer/CustomerDashboard'));
const DoctorDashboard = React.lazy(() => import('../features/Doctor/DoctorDashboard'));
const AdminDashboard = React.lazy(() => import('../features/Admin/AdminDashboard'));
const Settings = React.lazy(() => import('../features/Settings/Settings'));

/**
 * Loading component for lazy-loaded routes
 */
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '18px',
    color: '#666'
  }}>
    Loading...
  </div>
);

/**
 * Protected Route component
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

/**
 * Public Route component
 */
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (user) {
    switch (user.role) {
      case 'Admin':
        return <Navigate to="/admin" replace />;
      case 'Doctor':
        return <Navigate to="/doctor" replace />;
      case 'Patient':
        return <Navigate to="/customer" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingSpinner />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  );
};

/**
 * Main App Router component
 */
const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/" 
        element={
          <ErrorBoundary>
            <React.Suspense fallback={<LoadingSpinner />}>
              <Home />
            </React.Suspense>
          </ErrorBoundary>
        } 
      />
      
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/customer" 
        element={
          <ProtectedRoute allowedRoles={['Patient']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/doctor" 
        element={
          <ProtectedRoute allowedRoles={['Doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Import components
import Home from '../features/Website/Home';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import CustomerDashboard from '../features/Customer/CustomerDashboard';
import DoctorDashboard from '../features/Doctor/DoctorDashboard';
import AdminDashboard from '../features/Admin/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Dashboard Route Component (role-based routing)
const DashboardRoute = () => {
  const { user } = useAuth();

  console.log('DashboardRoute - User:', user);
  console.log('DashboardRoute - User Role:', user?.role);

  // Handle role-based routing with case-insensitive comparison
  const userRole = user?.role?.toLowerCase();
  
  switch (userRole) {
    case 'patient':
      console.log('Routing to CustomerDashboard');
      return <CustomerDashboard />;
    case 'doctor':
      console.log('Routing to DoctorDashboard');
      return <DoctorDashboard />;
    case 'admin':
      console.log('Routing to AdminDashboard');
      return <AdminDashboard />;
    default:
      console.log('Unknown role, redirecting to unauthorized:', userRole);
      return <Navigate to="/unauthorized" replace />;
  }
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
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
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        } 
      />

      {/* Role-specific Routes */}
      <Route 
        path="/patient/*" 
        element={
          <ProtectedRoute allowedRoles={['Patient']}>
            <CustomerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/doctor/*" 
        element={
          <ProtectedRoute allowedRoles={['Doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />

      {/* Error Routes */}
      <Route 
        path="/unauthorized" 
        element={
          <div className="error-page">
            <h1>Unauthorized</h1>
            <p>You don't have permission to access this page.</p>
          </div>
        } 
      />
      <Route 
        path="*" 
        element={
          <div className="error-page">
            <h1>Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
          </div>
        } 
      />
    </Routes>
  );
};

export default AppRouter;
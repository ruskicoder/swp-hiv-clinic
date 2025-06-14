import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../features/auth/Login';
import Register from '../features/auth/Register';
import AdminDashboard from '../features/Admin/AdminDashboard';
import CustomerDashboard from '../features/Customer/CustomerDashboard';
import PatientRegistration from '../features/Website/PatientRegistration';
import Settings from '../features/Settings/Settings';

const AppRouter = ({ EnhancedDoctorDashboard, EnhancedHeader }) => {
  const { user, isAuthenticated } = useAuth();

  const getDashboardForRole = () => {
    if (!user || !user.role) return <Navigate to="/login" />;

    const role = typeof user.role === 'string' ? user.role : user.role.roleName;
    
    switch (role) {
      case 'Admin':
        return <AdminDashboard />;
      case 'Doctor':
        return <EnhancedDoctorDashboard />;
      case 'Customer':
        return <CustomerDashboard />;
      default:
        return <Navigate to="/login" />;
    }
  };

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/patient-registration" element={<PatientRegistration />} />
      <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
      <Route path="/dashboard" element={isAuthenticated ? getDashboardForRole() : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default AppRouter;
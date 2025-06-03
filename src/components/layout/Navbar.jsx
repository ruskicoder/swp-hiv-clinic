import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🏥</span>
          HIV Clinic
        </Link>

        <div className="navbar-menu">
          {!isAuthenticated ? (
            <div className="navbar-auth">
              <Link to="/login" className="navbar-link">
                Sign In
              </Link>
              <Link to="/register" className="navbar-button">
                Get Started
              </Link>
            </div>
          ) : (
            <div className="navbar-user">
                <span className="user-greeting">
                Welcome, {user?.username}
                </span>
              <Link to="/dashboard" className="navbar-link">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="navbar-button logout">
                Logout
              </button>
            </div>
          )}
        </div>
        </div>
    </nav>
  );
};

export default Navbar;
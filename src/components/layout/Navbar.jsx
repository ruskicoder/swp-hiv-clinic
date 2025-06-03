import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserProfileDropdown from './UserProfileDropdown';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          HIV Medical System
        </Link>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {!user ? (
            <>
              <Link to="/" className="nav-link" onClick={closeMenu}>
                Home
              </Link>
              <Link to="/login" className="nav-link nav-cta" onClick={closeMenu}>
                Sign In
              </Link>
            </>
          ) : (
            <>
              {/* Remove Home and Admin Panel for admin */}
              {user.role !== 'Admin' && (
                <Link to="/" className="nav-link" onClick={closeMenu}>
                  Home
                </Link>
              )}
              {user.role === 'Doctor' && (
                <Link to="/doctor" className="nav-link" onClick={closeMenu}>
                  Doctor Dashboard
                </Link>
              )}
              {user.role === 'Patient' && (
                <Link to="/customer" className="nav-link" onClick={closeMenu}>
                  My Dashboard
                </Link>
              )}

              {/* User Profile Dropdown - Desktop */}
              <div className="nav-user-desktop">
                <UserProfileDropdown />
              </div>

              {/* Mobile Menu Items */}
              <div className="nav-user-mobile">
                <div className="nav-user-info">
                  <span className="user-greeting">
                    Welcome, {user.firstName || user.username}
                  </span>
                  <span className="user-role">{user.role}</span>
                </div>
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        <div className="nav-toggle" onClick={toggleMenu}>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
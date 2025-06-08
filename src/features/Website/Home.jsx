import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import './Home.css';

/**
 * Home page component
 */
const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      
      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">HIV Medical Treatment System</h1>
              <h2 className="hero-subtitle">Comprehensive Healthcare Management</h2>
              <p className="hero-description">
                A secure and efficient platform for managing HIV medical treatment, 
                appointments, and patient care coordination.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary btn-large">
                  Sign In
                </Link>
              </div>
            </div>
            
            <div className="hero-image">
              <div className="hero-placeholder">
                <div className="medical-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <h3>Secure Healthcare Platform</h3>
                <p>Trusted by healthcare professionals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      
      {/* Hero Section */}
      <section className="hero-section" >
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                HIV Medical Treatment System
              </h1>
              <h2 className="hero-subtitle">
                Comprehensive Healthcare Management
              </h2>
              <p className="hero-description">
                Streamline your HIV healthcare journey with our integrated platform. 
                Connect with specialized doctors, manage appointments, and access 
                personalized treatment plans all in one secure environment.
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
                  {/* Use a medical cross SVG icon */}
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6a1 1 0 0 1-2 0v-6H5a1 1 0 0 1 0-2h6V5a1 1 0 0 1 2 0v6h6a1 1 0 0 1 0 2z"/>
                  </svg>
                </div>
                <h3>Advanced Healthcare Platform</h3>
                <p>Secure, reliable, and user-friendly medical management system</p>
            </div>
              </div>
            </div>
              </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Platform Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
              </div>
              <h3>Appointment Management</h3>
              <p>Schedule, reschedule, and manage your medical appointments with ease. Real-time availability and automated reminders.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3>Secure Medical Records</h3>
              <p>Access your complete medical history, treatment plans, and test results in a secure, encrypted environment.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Specialist Network</h3>
              <p>Connect with HIV specialists and healthcare professionals who understand your unique medical needs.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
            </div>
              <h3>Treatment Monitoring</h3>
              <p>Track your treatment progress, medication schedules, and health metrics with comprehensive monitoring tools.</p>
          </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
        </div>
              <h3>Communication Hub</h3>
              <p>Stay connected with your healthcare team through secure messaging and notification systems.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
        </div>
              <h3>Privacy & Security</h3>
              <p>Your medical information is protected with enterprise-grade security and HIPAA-compliant data handling.</p>
            </div>
            </div>
            </div>
      </section>

      {/* User Types Section */}
      <section className="user-types-section">
        <div className="container">
          <h2 className="section-title">Who We Serve</h2>
          <div className="user-types-grid">
            <div className="user-type-card">
              <div className="user-type-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
        </div>
              <h3>Patients</h3>
              <p>Manage your appointments, view treatment plans, and stay connected with your healthcare team.</p>
              <ul>
                <li>Book and manage appointments</li>
                <li>View medical history</li>
                <li>Access treatment plans</li>
                <li>Secure messaging</li>
              </ul>
    </div>

            <div className="user-type-card">
              <div className="user-type-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <h3>Healthcare Providers</h3>
              <p>Streamline patient care with comprehensive tools for appointment and treatment management.</p>
              <ul>
                <li>Patient appointment scheduling</li>
                <li>Medical record management</li>
                <li>Treatment plan creation</li>
                <li>Progress monitoring</li>
              </ul>
            </div>

            <div className="user-type-card">
              <div className="user-type-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3>Administrators</h3>
              <p>Oversee system operations, manage users, and ensure optimal platform performance.</p>
              <ul>
                <li>User management</li>
                <li>System settings</li>
                <li>Appointment oversight</li>
                <li>Analytics and reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Get Started?</h2>
            <p>Join our platform today and experience comprehensive HIV healthcare management.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary btn-large">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>HIV Medical Treatment System</h4>
              <p>Providing comprehensive healthcare management solutions for HIV patients and medical professionals.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/login">Sign In</Link></li>
                <li><Link to="/register">Register</Link></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">About</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <ul>
                <li><a href="#help">Help Center</a></li>
                <li><a href="#contact">Contact Us</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 HIV Medical Treatment System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#333',
      color: 'white',
      textAlign: 'center',
      padding: '2rem',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div>
            <h3>HIV Medical Treatment System</h3>
            <p>Providing comprehensive healthcare management for HIV treatment and care.</p>
          </div>
          
          <div>
            <h4>Quick Links</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="/" style={{ color: '#ccc', textDecoration: 'none' }}>Home</a></li>
              <li><a href="/about" style={{ color: '#ccc', textDecoration: 'none' }}>About Us</a></li>
              <li><a href="/contact" style={{ color: '#ccc', textDecoration: 'none' }}>Contact</a></li>
            </ul>
          </div>
          
          <div>
            <h4>Support</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><a href="/help" style={{ color: '#ccc', textDecoration: 'none' }}>Help Center</a></li>
              <li><a href="/privacy" style={{ color: '#ccc', textDecoration: 'none' }}>Privacy Policy</a></li>
              <li><a href="/terms" style={{ color: '#ccc', textDecoration: 'none' }}>Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div style={{ borderTop: '1px solid #555', paddingTop: '1rem' }}>
          <p>&copy; 2024 HIV Medical Treatment System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
@echo off
echo ========================================
echo HIV Clinic Database Setup
echo ========================================
echo.
echo This script will help you set up the database for the HIV Clinic Management System.
echo.
echo Prerequisites:
echo - Microsoft SQL Server installed and running
echo - SQL Server Management Studio (SSMS) or similar tool
echo - Database access with sa account or equivalent permissions
echo.
echo ========================================
echo Database Configuration
echo ========================================
echo.
echo Database Server: localhost:1433
echo Database Name: hiv_clinic
echo Username: sa
echo Password: 12345 (update in application.properties if different)
echo.
echo ========================================
echo Setup Instructions
echo ========================================
echo.
echo 1. Start SQL Server service
echo 2. Open SQL Server Management Studio
echo 3. Connect to localhost with sa account
echo 4. Execute the following scripts in order:
echo    - src/main/resources/db/schema.sql
echo    - src/main/resources/db/data.sql (optional - for sample data)
echo.
echo ========================================
echo Default Login Credentials
echo ========================================
echo.
echo Admin Account:
echo   Username: admin
echo   Password: admin123
echo.
echo Test Doctor Account:
echo   Username: doctor1  
echo   Password: doctor123
echo.
echo Test Patient Account:
echo   Username: patient1
echo   Password: patient123
echo.
echo ========================================
echo Application Startup
echo ========================================
echo.
echo After database setup:
echo 1. Update application.properties with your database password
echo 2. Start the Spring Boot application: mvn spring-boot:run
echo 3. Start the React frontend: npm start
echo 4. Access the application at: http://localhost:3000
echo.
echo ========================================
echo Troubleshooting
echo ========================================
echo.
echo Common Issues:
echo - Connection refused: Check if SQL Server is running
echo - Login failed: Verify sa account password
echo - Database not found: Ensure hiv_clinic database is created
echo - Port conflicts: Check if ports 8080 and 3000 are available
echo.
echo For support, check the README.md file or application logs.
echo.
pause

import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Return a properly formatted error
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
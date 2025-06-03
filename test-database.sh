#!/bin/bash

echo "========================================="
echo "HIV Clinic Database Test Script"
echo "========================================="
echo ""

# Database configuration
DB_SERVER="localhost"
DB_NAME="hiv_clinic"
DB_USER="sa"
DB_PASSWORD="12345"

echo "Testing database connectivity and data integrity..."
echo ""

# Test 1: Basic connection
echo "1. Testing database connection..."
sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -Q "SELECT 'Connection successful' AS Status" -h -1

if [ $? -eq 0 ]; then
    echo "✓ Database connection successful"
else
    echo "✗ Database connection failed"
    exit 1
fi

# Test 2: Check tables exist
echo ""
echo "2. Checking if all required tables exist..."
sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -Q "
SELECT 
    CASE 
        WHEN COUNT(*) = 11 THEN 'All tables exist'
        ELSE 'Missing tables: ' + CAST((11 - COUNT(*)) AS VARCHAR)
    END AS TableStatus
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN (
    'Roles', 'Users', 'Specialties', 'DoctorProfiles', 'PatientProfiles',
    'DoctorAvailabilitySlots', 'Appointments', 'AppointmentStatusHistory',
    'SystemSettings', 'LoginActivity', 'PasswordResetTokens'
)
" -h -1

# Test 3: Check initial data
echo ""
echo "3. Checking initial data..."
sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -Q "
SELECT 'Roles: ' + CAST(COUNT(*) AS VARCHAR) FROM Roles;
SELECT 'Users: ' + CAST(COUNT(*) AS VARCHAR) FROM Users;
SELECT 'Specialties: ' + CAST(COUNT(*) AS VARCHAR) FROM Specialties;
" -h -1

# Test 4: Test user authentication data
echo ""
echo "4. Testing default user accounts..."
sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -Q "
SELECT 
    u.Username,
    r.RoleName,
    CASE WHEN u.IsActive = 1 THEN 'Active' ELSE 'Inactive' END AS Status
FROM Users u
JOIN Roles r ON u.RoleID = r.RoleID
ORDER BY r.RoleName, u.Username
" -h -1
echo ""
echo "========================================="
echo "Database test completed!"
echo "========================================="
echo ""
echo "If all tests passed, you can start the application:"
echo "1. Backend: mvn spring-boot:run"
echo "2. Frontend: npm start"
echo ""
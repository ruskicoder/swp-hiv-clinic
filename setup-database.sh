#!/bin/bash

echo "========================================="
echo "HIV Clinic Database Setup Script"
echo "========================================="
echo ""

# Check if SQL Server is running
echo "Checking SQL Server status..."
if ! command -v sqlcmd &> /dev/null; then
    echo "ERROR: sqlcmd not found. Please install SQL Server command line tools."
    exit 1
fi

# Database configuration
DB_SERVER="localhost"
DB_NAME="hiv_clinic"
DB_USER="sa"
DB_PASSWORD="12345"

echo "Database Configuration:"
echo "Server: $DB_SERVER"
echo "Database: $DB_NAME"
echo "Username: $DB_USER"
echo ""

# Test connection
echo "Testing database connection..."
sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -Q "SELECT @@VERSION" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Database connection successful"
else
    echo "✗ Database connection failed"
    echo "Please check:"
    echo "1. SQL Server is running"
    echo "2. Username and password are correct"
    echo "3. SQL Server is configured to accept connections"
    exit 1
fi

# Create database if it doesn't exist
echo ""
echo "Creating database if it doesn't exist..."
sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -Q "
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '$DB_NAME')
BEGIN
    CREATE DATABASE [$DB_NAME]
    PRINT 'Database $DB_NAME created successfully'
END
ELSE
BEGIN
    PRINT 'Database $DB_NAME already exists'
END
"

# Run schema script
echo ""
echo "Running schema script..."
if [ -f "src/main/resources/db/schema.sql" ]; then
    sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -i "src/main/resources/db/schema.sql"
    echo "✓ Schema script executed"
else
    echo "⚠ Schema script not found at src/main/resources/db/schema.sql"
fi

# Run data script
echo ""
echo "Running initial data script..."
if [ -f "src/main/resources/db/data.sql" ]; then
    sqlcmd -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -d $DB_NAME -i "src/main/resources/db/data.sql"
    echo "✓ Data script executed"
else
    echo "⚠ Data script not found at src/main/resources/db/data.sql"
fi

echo ""
echo "========================================="
echo "Database setup completed!"
echo "========================================="
echo ""
echo "Default login credentials:"
echo "Admin: username=admin, password=admin123"
echo "Doctor: username=doctor1, password=doctor123"
echo "Patient: username=patient1, password=patient123"
echo ""
echo "Next steps:"
echo "1. Start the Spring Boot application: mvn spring-boot:run"
echo "2. Start the React frontend: npm start"
echo "3. Access the application at: http://localhost:3000"
echo ""
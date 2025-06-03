#!/bin/bash

echo "========================================="
echo "HIV Clinic Application Startup"
echo "========================================="
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo "Starting Spring Boot backend..."
    cd "$(dirname "$0")"
    
    if check_port 8080; then
        echo "⚠ Port 8080 is already in use. Please stop the existing service or change the port."
        return 1
    fi

    # Check if Maven is installed
    if ! command -v mvn &> /dev/null; then
        echo "✗ Maven not found. Please install Maven first."
        return 1
    fi
    
    # Start backend in background
    echo "Building and starting backend on port 8080..."
    mvn spring-boot:run > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    for i in {1..30}; do
        if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
            echo "✓ Backend started successfully"
            return 0
        fi
        sleep 2
        echo -n "."
    done
    
echo ""
    echo "✗ Backend failed to start within 60 seconds"
    return 1
}

# Function to start frontend
start_frontend() {
echo ""
    echo "Starting React frontend..."
    
    if check_port 3000; then
        echo "⚠ Port 3000 is already in use. Please stop the existing service or change the port."
        return 1
    fi
    
    # Check if Node.js is installed
    if ! command -v npm &> /dev/null; then
        echo "✗ Node.js/npm not found. Please install Node.js first."
        return 1
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo "Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend
    echo "Starting frontend on port 3000..."
    npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    echo "✓ Frontend starting..."
    return 0
}

# Function to stop services
stop_services() {
echo ""
    echo "Stopping services..."
    
    if [ -f backend.pid ]; then
        BACKEND_PID=$(cat backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            echo "✓ Backend stopped"
        fi
        rm -f backend.pid
    fi
    
    if [ -f frontend.pid ]; then
        FRONTEND_PID=$(cat frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            echo "✓ Frontend stopped"
        fi
        rm -f frontend.pid
    fi
}

# Handle script termination
trap stop_services EXIT

# Main execution
case "$1" in
    "stop")
        stop_services
        exit 0
        ;;
    "backend")
        start_backend
        if [ $? -eq 0 ]; then
echo ""
            echo "Backend is running. Press Ctrl+C to stop."
            wait
        fi
        exit 0
        ;;
    "frontend")
        start_frontend
        if [ $? -eq 0 ]; then
echo ""
            echo "Frontend is starting. Press Ctrl+C to stop."
            wait
        fi
        exit 0
        ;;
    *)
        # Start both services
        echo "Starting HIV Clinic Management System..."
echo ""
        
        # Start backend first
        start_backend
        if [ $? -ne 0 ]; then
            echo "Failed to start backend. Exiting."
            exit 1
        fi
        
        # Start frontend
        start_frontend
        if [ $? -ne 0 ]; then
            echo "Failed to start frontend. Stopping backend."
            stop_services
            exit 1
        fi
echo ""
        echo "========================================="
        echo "Application started successfully!"
        echo "========================================="
        echo ""
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 Backend API: http://localhost:8080/api"
        echo "❤️ Health Check: http://localhost:8080/api/health"
        echo ""
        echo "Default Login Credentials:"
        echo "👤 Admin: username=admin, password=admin123"
        echo "👨‍⚕️ Doctor: username=doctor1, password=doctor123"
        echo "🏥 Patient: username=patient1, password=patient123"
        echo ""
        echo "Press Ctrl+C to stop all services"
        echo ""
        
        # Wait for user to stop
        wait
        ;;
esac

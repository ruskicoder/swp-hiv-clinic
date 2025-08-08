# HIV Clinic System - Data Flow Analysis

This document provides a comprehensive analysis of the data flows in the HIV Clinic Booking System, separated into individual mermaid diagrams for better maintainability and understanding.

## 📊 Overview

The system follows a typical 3-tier architecture with:
- **Frontend**: React.js with Context API for state management
- **Backend**: Spring Boot with REST APIs
- **Database**: SQL Server with JPA/Hibernate ORM

## 🔐 Authentication & Session Management

### 1. Login Authentication Flow
- **File**: [login-authentication.mermaid](dataflow/login-authentication.mermaid) → [SVG](dataflow/login-authentication.svg)
- **Description**: Complete user authentication process from frontend form submission to JWT token generation
- **Key Components**: AuthContext, AuthService, AuthController, JWT utilities

### 2. Logout Process
- **File**: [logout.mermaid](dataflow/logout.mermaid) → [SVG](dataflow/logout.svg)
- **Description**: User logout and session cleanup
- **Key Components**: Session invalidation, token cleanup

### 3. Session Monitoring
- **File**: [session-monitoring.mermaid](dataflow/session-monitoring.mermaid) → [SVG](dataflow/session-monitoring.svg)
- **Description**: Real-time session status checking and timeout handling
- **Key Components**: useSessionMonitor hook, session extension

### 4. Session Management
- **File**: [session-management.mermaid](dataflow/session-management.mermaid) → [SVG](dataflow/session-management.svg)
- **Description**: Session lifecycle management including creation, validation, and expiration
- **Key Components**: UserSessionService, session validation

## 📅 Appointment Management

### 5. Appointment Booking
- **File**: [appointment-booking.mermaid](dataflow/appointment-booking.mermaid) → [SVG](dataflow/appointment-booking.svg)
- **Description**: Complete appointment booking process from slot selection to confirmation
- **Key Components**: UnifiedCalendar, AppointmentService, availability validation

### 6. Appointment Cancellation
- **File**: [appointment-cancellation.mermaid](dataflow/appointment-cancellation.mermaid) → [SVG](dataflow/appointment-cancellation.svg)
- **Description**: Appointment cancellation with reason tracking and slot release
- **Key Components**: Status history tracking, notification system

## 👨‍⚕️ Doctor Operations

### 7. Doctor Schedule Management
- **File**: [doctor-schedule-management.mermaid](dataflow/doctor-schedule-management.mermaid) → [SVG](dataflow/doctor-schedule-management.svg)
- **Description**: Viewing and managing doctor availability schedules
- **Key Components**: WeeklySchedule component, DoctorAvailabilityService

### 8. Doctor Schedule Update
- **File**: [doctor-schedule-update.mermaid](dataflow/doctor-schedule-update.mermaid) → [SVG](dataflow/doctor-schedule-update.svg)
- **Description**: Bulk updates to doctor availability slots
- **Key Components**: Bulk update operations, schedule validation

### 9. Doctor Patient Record Access
- **File**: [doctor-patient-record-access.mermaid](dataflow/doctor-patient-record-access.mermaid) → [SVG](dataflow/doctor-patient-record-access.svg)
- **Description**: Doctor accessing patient medical records with privacy controls
- **Key Components**: Privacy validation, appointment-based access control

## 🏥 Patient Record Management

### 10. Patient Record Viewing
- **File**: [patient-record-view.mermaid](dataflow/patient-record-view.mermaid) → [SVG](dataflow/patient-record-view.svg)
- **Description**: Patient viewing their own medical records
- **Key Components**: PatientRecordSection, user authentication

### 11. Patient Record Updates
- **File**: [patient-record-update.mermaid](dataflow/patient-record-update.mermaid) → [SVG](dataflow/patient-record-update.svg)
- **Description**: Patients updating their medical information
- **Key Components**: Form validation, record merging

## 💊 ARV Treatment Management

### 12. ARV Treatment Creation
- **File**: [arv-treatment-create.mermaid](dataflow/arv-treatment-create.mermaid) → [SVG](dataflow/arv-treatment-create.svg)
- **Description**: Doctors creating new ARV treatment plans
- **Key Components**: Treatment modals, medication routine creation

### 13. ARV Treatment Adherence Monitoring
- **File**: [arv-treatment-adherence-monitoring.mermaid](dataflow/arv-treatment-adherence-monitoring.mermaid) → [SVG](dataflow/arv-treatment-adherence-monitoring.svg)
- **Description**: Monitoring patient adherence to ARV medications
- **Key Components**: Adherence tracking, reminder systems

## 🔔 Notification System

### 14. Notification Sending
- **File**: [notification-send.mermaid](dataflow/notification-send.mermaid) → [SVG](dataflow/notification-send.svg)
- **Description**: Healthcare providers sending notifications to patients
- **Key Components**: Template system, bulk notifications

### 15. Notification Polling
- **File**: [notification-polling.mermaid](dataflow/notification-polling.mermaid) → [SVG](dataflow/notification-polling.svg)
- **Description**: Real-time notification retrieval and badge updates
- **Key Components**: Polling service, notification icons

### 16. Notification History Management
- **File**: [notification-history-management.mermaid](dataflow/notification-history-management.mermaid) → [SVG](dataflow/notification-history-management.svg)
- **Description**: Managing notification history and read status
- **Key Components**: Pagination, status updates

### 17. User Notification Retrieval
- **File**: [notification-get-user.mermaid](dataflow/notification-get-user.mermaid) → [SVG](dataflow/notification-get-user.svg)
- **Description**: Users retrieving their personalized notifications
- **Key Components**: User-specific filtering, notification center

## 👑 Administrative Functions

### 18. Admin User Creation
- **File**: [admin-user-create.mermaid](dataflow/admin-user-create.mermaid) → [SVG](dataflow/admin-user-create.svg)
- **Description**: Administrators creating new user accounts
- **Key Components**: Role assignment, password generation

### 19. Admin User List Management
- **File**: [admin-user-list-management.mermaid](dataflow/admin-user-list-management.mermaid) → [SVG](dataflow/admin-user-list-management.svg)
- **Description**: Viewing and managing all system users
- **Key Components**: Pagination, search, filtering

### 20. Admin User Management
- **File**: [admin-user-management.mermaid](dataflow/admin-user-management.mermaid) → [SVG](dataflow/admin-user-management.svg)
- **Description**: Administrative operations on user accounts
- **Key Components**: Status toggles, role updates

## 📊 Manager Operations

### 21. Manager CSV Export
- **File**: [manager-csv-export.mermaid](dataflow/manager-csv-export.mermaid) → [SVG](dataflow/manager-csv-export.svg)
- **Description**: Exporting system data for reporting purposes
- **Key Components**: Data aggregation, CSV generation

## 🏗️ Architecture Patterns

### Common Frontend Patterns
1. **State Management**: React Context API with useReducer for complex state
2. **API Integration**: Centralized axios client with interceptors
3. **Error Handling**: Consistent error boundaries and user feedback
4. **Loading States**: UI indicators for all async operations
5. **Form Validation**: Client-side validation with server-side verification

### Common Backend Patterns
1. **Controller Layer**: RESTful endpoints with consistent response formats
2. **Service Layer**: Business logic encapsulation with transaction management
3. **Repository Layer**: Data access abstraction with JPA
4. **Security**: Role-based access control with JWT authentication
5. **Logging**: Comprehensive audit trails for all operations

### Data Flow Principles
1. **Unidirectional Flow**: Data flows from UI → Service → Repository → Database
2. **Error Propagation**: Structured error handling from backend to frontend
3. **State Synchronization**: Real-time updates through polling and notifications
4. **Security First**: Authentication and authorization at every layer

## 🔄 Cross-Cutting Concerns

### Security
- JWT token-based authentication
- Role-based authorization (PATIENT, DOCTOR, ADMIN, MANAGER)
- Session management with timeout controls
- Privacy controls for sensitive medical data

### Monitoring & Logging
- Login activity tracking
- Appointment status history
- User session monitoring
- System audit trails

### Notification System
- Template-based notifications
- Multi-channel delivery (in-app, email)
- Scheduled reminders
- Real-time polling

### Data Privacy
- Patient consent management
- Doctor-patient relationship validation
- Appointment-based record access
- Privacy setting enforcement

## 📁 File Organization

All mermaid source files are located in `docs/diagrams/dataflow/` with corresponding SVG outputs for embedding in documentation or presentations.

```
docs/diagrams/dataflow/
├── *.mermaid           # Source diagrams
├── *.svg              # Generated SVG files
└── README.md          # This documentation
```

## 🚀 Usage

To regenerate SVG files from mermaid sources:

```powershell
npx -p @mermaid-js/mermaid-cli mmdc -i input.mermaid -o output.svg
```

Or to batch convert all files:

```powershell
Get-ChildItem "docs\diagrams\dataflow\*.mermaid" | ForEach-Object { 
    $inputFile = $_.FullName
    $outputFile = $inputFile -replace '.mermaid$', '.svg'
    npx -p @mermaid-js/mermaid-cli mmdc -i $inputFile -o $outputFile
}
```

# HIV Clinic Management System - Workflow & Data Flow Explanation

## 🏗️ System Architecture Overview

The HIV Clinic Management System is a full-stack web application built with a **React frontend** and **Spring Boot backend**, using **Microsoft SQL Server** as the database. The system follows a **3-tier architecture**:

1. **Presentation Layer (Frontend)** - React with Vite
2. **Business Logic Layer (Backend)** - Spring Boot with REST APIs  
3. **Data Layer** - MS SQL Server Database

### Technology Stack
- **Frontend**: React 18, React Router, Axios, Vite
- **Backend**: Spring Boot 3.2, Spring Security, Spring Data JPA, JWT
- **Database**: Microsoft SQL Server
- **Authentication**: JWT tokens with role-based access control

---

## 🔄 Data Flow Architecture

### Frontend → Backend Communication
```
React Components → Services (apiClient.js) → REST Controllers → Services → Repositories → Database
```

### Authentication Flow
```
User Login → AuthController → JWT Token → Stored in localStorage → Included in API Headers
```

### Role-Based Access
- **Patient**: Book appointments, view medical records, receive notifications
- **Doctor**: Manage availability, view appointments, send notifications, access patient records
- **Manager**: Export reports, view system statistics, manage data
- **Admin**: Create user accounts, manage system settings

---

## 🎯 Key System Components

### Backend Components

#### 1. Controllers (REST API Endpoints)
- `AuthController`: Authentication and user management
- `AppointmentController`: Appointment booking and management
- `DoctorController`: Doctor availability and profile management
- `NotificationController`: Notification sending and management
- `AdminController`: Admin user creation and system management
- `ManagerController`: Reports and system statistics
- `PatientRecordController`: Medical record management

#### 2. Services (Business Logic)
- `AppointmentService`: Complex appointment booking logic
- `DoctorAvailabilityService`: Slot management
- `NotificationService`: Notification handling
- `AdminService`: User account creation
- `ManagerService`: Report generation
- `PatientRecordService`: Medical record operations

#### 3. Repositories (Data Access)
- Spring Data JPA repositories for each entity
- Custom queries for complex operations
- Transaction management

#### 4. Models (Data Entities)
- `User`: Base user entity with roles
- `Appointment`: Appointment bookings
- `DoctorAvailabilitySlot`: Doctor time slots
- `PatientRecord`: Medical information
- `Notification`: System notifications
- `ARVTreatment`: HIV treatment records

### Frontend Components

#### 1. Authentication & Routing
- `AuthContext`: Global user state management
- `AppRouter`: Protected routes based on user roles
- `ProtectedRoute`: Role-based access control

#### 2. Feature-Specific Components
- Dashboard components for each user role
- Appointment booking and management
- Notification system
- Medical record forms
- Admin management interfaces

#### 3. Services
- `authService`: Authentication API calls
- `apiClient`: Centralized HTTP client with JWT headers

---

## 📋 Detailed Workflow for 7 Key Scenarios

### 1. Patient Books Appointment (Requires Doctor Availability Slots)

#### Data Flow:
```
Patient → Frontend Booking Form → AppointmentController.bookAppointment() → AppointmentService
→ Check Doctor Availability → Create Appointment → Update Slot Status → Send Notifications
```

#### Step-by-Step Process:
1. **Doctor Creates Availability** (Prerequisite):
   - Doctor logs in and navigates to schedule management
   - Frontend sends POST to `/api/doctors/availability`
   - `DoctorController.createAvailabilitySlot()` processes request
   - `DoctorAvailabilityService` validates and creates slot in database
   - Slot marked as `isBooked = false`

2. **Patient Views Available Slots**:
   - Patient accesses booking interface
   - Frontend fetches available slots via GET `/api/doctors/{doctorId}/availability`
   - Only unbooked slots are displayed

3. **Patient Books Appointment**:
   - Patient selects doctor, date, and time slot
   - Frontend validates selection and sends POST to `/api/appointments/book`
   - `AppointmentController.bookAppointment()` receives request
   - `AppointmentService.bookAppointment()` executes business logic:
     - Validates slot availability
     - Creates `Appointment` record
     - Updates `DoctorAvailabilitySlot.isBooked = true`
     - Creates appointment status history
     - Triggers notification to doctor

4. **Database Updates**:
   - New record in `Appointments` table
   - `DoctorAvailabilitySlots` table updated (slot marked as booked)
   - `AppointmentStatusHistory` record created
   - `Notifications` record for doctor

#### API Endpoints Used:
- `POST /api/doctors/availability` - Create availability slot
- `GET /api/doctors/{doctorId}/availability` - Get available slots
- `POST /api/appointments/book` - Book appointment

---

### 2. Patient Updates Medical Records

#### Data Flow:
```
Patient → Medical Record Form → PatientRecordController.updateMyRecord() → PatientRecordService
→ Validate Data → Update Database → Return Success Response
```

#### Step-by-Step Process:
1. **Access Medical Record**:
   - Patient navigates to "My Medical Records" section
   - Frontend calls GET `/api/patient-records/my-record`
   - `PatientRecordController.getMyRecord()` returns existing record

2. **Update Information**:
   - Patient modifies medical history, allergies, medications, etc.
   - Frontend validates input data
   - PUT request sent to `/api/patient-records/my-record`

3. **Backend Processing**:
   - `PatientRecordController.updateMyRecord()` receives data
   - `PatientRecordService.updatePatientRecordWithResponse()` processes:
     - Validates patient ownership of record
     - Sanitizes and validates medical data
     - Updates `PatientRecords` table
     - Updates `UpdatedAt` timestamp

4. **Privacy Controls**:
   - System checks `PatientProfiles.IsPrivate` setting
   - Applies privacy filters when data is accessed by doctors
   - Sensitive information masked for anonymous mode

#### API Endpoints Used:
- `GET /api/patient-records/my-record` - Get patient's record
- `PUT /api/patient-records/my-record` - Update patient's record

---

### 3. Doctor Creates Appointment Availability Slot

#### Data Flow:
```
Doctor → Schedule Interface → DoctorController.createAvailabilitySlot() → DoctorAvailabilityService
→ Validate Time Slot → Check Conflicts → Create Slot → Return Confirmation
```

#### Step-by-Step Process:
1. **Access Schedule Management**:
   - Doctor logs in and navigates to availability management
   - Frontend displays weekly/monthly calendar view

2. **Create New Slot**:
   - Doctor selects date, start time, and end time
   - Optional: Add notes for the slot
   - Frontend validates time format and business rules

3. **Backend Validation**:
   - `DoctorController.createAvailabilitySlot()` receives request
   - `DoctorAvailabilityService.createAvailabilitySlot()` processes:
     - Validates doctor ownership
     - Checks for time conflicts with existing slots
     - Ensures slot is in the future
     - Validates business hours

4. **Database Operations**:
   - Creates record in `DoctorAvailabilitySlots` table
   - Sets `IsBooked = false`, `DoctorUserID`, `SlotDate`, `StartTime`, `EndTime`
   - Unique constraint prevents duplicate slots: `(DoctorUserID, SlotDate, StartTime)`

5. **Frontend Update**:
   - Calendar refreshes to show new available slot
   - Slot appears in patient booking interfaces

#### API Endpoints Used:
- `POST /api/doctors/availability` - Create availability slot
- `GET /api/doctors/availability/my-slots` - Get doctor's slots
- `PUT /api/doctors/availability/{slotId}` - Update existing slot
- `DELETE /api/doctors/availability/{slotId}` - Delete slot

---

### 4. Manager Exports Reports

#### Data Flow:
```
Manager → Reports Dashboard → ManagerController → ManagerService → Database Queries
→ Data Aggregation → Report Generation → File Download
```

#### Step-by-Step Process:
1. **Access Reports Dashboard**:
   - Manager logs in with MANAGER role
   - Navigates to reports section
   - Dashboard shows various report options

2. **Select Report Type**:
   - System statistics (patient count, appointments, treatments)
   - Patient data export
   - Doctor performance reports
   - ARV treatment reports

3. **Generate Report**:
   - Manager selects date range and report parameters
   - Frontend sends request to appropriate endpoint

4. **Backend Processing**:
   - `ManagerController` receives request
   - `ManagerService` executes:
     - `getTotalPatients()` - Counts active patients
     - `getTotalDoctors()` - Counts active doctors
     - `getTotalAppointments()` - Counts appointments in date range
     - `getAllPatients()` - Exports patient data
     - `getAllARVTreatmentsWithNames()` - Exports treatment data

5. **Data Aggregation**:
   - Queries join multiple tables:
     - `Users` → `PatientProfiles` → `PatientRecords`
     - `Users` → `DoctorProfiles` → `Specialties`
     - `Appointments` → `Users` (patients/doctors)
     - `ARVTreatments` → `Users` → `Appointments`

6. **Export Formats**:
   - JSON data for frontend processing
   - CSV/Excel export functionality
   - Real-time statistics display

#### API Endpoints Used:
- `GET /api/manager/stats` - System statistics
- `GET /api/manager/patients` - Patient list export
- `GET /api/manager/doctors` - Doctor list export
- `GET /api/manager/arv-treatments` - Treatment data export

---

### 5. Admin Creates New Account (Doctor/Patient)

#### Data Flow:
```
Admin → User Creation Form → AdminController.createUserByAdmin() → AdminService.createUser()
→ Validate Data → Create User & Profile → Hash Password → Return Response
```

#### Step-by-Step Process:
1. **Access Admin Panel**:
   - Admin logs in with ADMIN role
   - Navigates to user management section
   - Selects "Create New User"

2. **Fill User Information**:
   - Select user role (Patient, Doctor, Manager)
   - Enter basic info: username, email, password
   - Enter role-specific information:
     - **Doctor**: First name, last name, specialty, bio
     - **Patient**: First name, last name, date of birth, contact info

3. **Submit Creation Request**:
   - Frontend validates all required fields
   - Sends POST to `/api/admin/users`
   - Request includes `AdminCreateUserRequest` DTO

4. **Backend Processing**:
   - `AdminController.createUserByAdmin()` receives request
   - `AdminService.createUser()` executes:
     - Validates unique username and email
     - Hashes password using Spring Security
     - Creates base `User` record with role
     - Creates role-specific profile:
       - `DoctorProfiles` for doctors
       - `PatientProfiles` for patients
       - `PatientRecords` for patients

5. **Database Transactions**:
   - All operations wrapped in `@Transactional`
   - If any step fails, entire operation rolls back
   - Creates records in multiple tables:
     - `Users` (base user info)
     - `DoctorProfiles` or `PatientProfiles`
     - `PatientRecords` (for patients)

6. **Post-Creation**:
   - New user can immediately log in
   - Account appears in user lists
   - Doctor can start creating availability slots
   - Patient can book appointments

#### API Endpoints Used:
- `POST /api/admin/users` - Create user account
- `GET /api/admin/users` - List all users
- `GET /api/admin/roles` - Get available roles
- `GET /api/admin/specialties` - Get doctor specialties

---

### 6. Doctor Sends Notification to Patient

#### Data Flow:
```
Doctor → Notification Interface → NotificationController → NotificationService
→ Template Processing → Create Notification → Store in Database → Real-time Delivery
```

#### Step-by-Step Process:
1. **Access Notification System**:
   - Doctor navigates to patient management or appointment details
   - Selects "Send Notification" option
   - System shows notification interface

2. **Compose Notification**:
   - Select notification template (appointment reminder, medication reminder, general)
   - Choose recipient patient(s)
   - Customize message content
   - Set priority level (Low, Medium, High)

3. **Send Notification**:
   - Frontend sends POST to `/api/v1/notifications/send`
   - Includes template ID, recipient IDs, and custom message

4. **Backend Processing**:
   - `NotificationController` receives request
   - `DoctorNotificationService.sendNotificationToPatients()` processes:
     - Validates doctor has permission to contact patients
     - Retrieves notification template
     - Processes template variables (patient name, appointment date, etc.)
     - Creates notification records for each recipient

5. **Database Operations**:
   - Creates records in `Notifications` table:
     - `UserID` (recipient patient)
     - `Type` (APPOINTMENT_REMINDER, MEDICATION_REMINDER, etc.)
     - `Title` and `Message` (processed template)
     - `IsRead = false`
     - `Priority` level
     - `RelatedEntityID` (appointment/treatment ID if applicable)

6. **Real-time Delivery**:
   - Frontend polling checks for new notifications
   - `NotificationService.getUnreadNotificationsByUserId()` returns unread notifications
   - Notifications appear in patient's notification panel
   - Badge counter updates automatically

#### API Endpoints Used:
- `GET /api/v1/notifications/templates` - Get available templates
- `POST /api/v1/notifications/send` - Send notification
- `GET /api/v1/notifications?status=unread` - Get unread notifications
- `POST /api/v1/notifications/{id}/read` - Mark notification as read

---

### 7. Patient Updates Information in Medical Records

#### Data Flow:
```
Patient → Medical Record Interface → PatientRecordController.updateMyRecord() → PatientRecordService
→ Data Validation → Privacy Check → Database Update → Audit Trail
```

#### Step-by-Step Process:
1. **Access Medical Records**:
   - Patient logs in and navigates to "My Medical Records"
   - Frontend calls GET `/api/patient-records/my-record`
   - System returns current medical information

2. **Update Information**:
   - Patient can modify:
     - Medical history
     - Current allergies
     - Current medications
     - Emergency contact information
     - Blood type
     - Insurance information
   - Privacy settings (public/private mode)

3. **Frontend Validation**:
   - Required field validation
   - Data format validation (dates, phone numbers)
   - Medical data consistency checks

4. **Submit Updates**:
   - Frontend sends PUT to `/api/patient-records/my-record`
   - Request body contains updated medical information

5. **Backend Processing**:
   - `PatientRecordController.updateMyRecord()` processes request
   - `PatientRecordService.updatePatientRecordWithResponse()` executes:
     - Validates patient ownership of record
     - Sanitizes input data for security
     - Checks for required medical information
     - Applies business rules for medical data

6. **Database Updates**:
   - Updates `PatientRecords` table
   - Updates `PatientProfiles` for basic information
   - Sets `UpdatedAt` timestamp
   - Maintains audit trail of changes

7. **Privacy Application**:
   - If patient enables private mode (`IsPrivate = true`):
     - Doctor access to detailed records is restricted
     - Only essential information shown during appointments
     - Patient name appears as "Anonymous" in some contexts

#### API Endpoints Used:
- `GET /api/patient-records/my-record` - Get current record
- `PUT /api/patient-records/my-record` - Update medical record
- `GET /api/auth/me` - Get user profile information
- `PUT /api/auth/profile` - Update basic profile

---

## 🔐 Security & Authentication

### JWT Token Flow
1. **Login**: User credentials validated, JWT token issued
2. **Token Storage**: Stored in localStorage (frontend)
3. **API Requests**: Token included in Authorization header
4. **Token Validation**: Spring Security validates on each request
5. **Role Authorization**: `@PreAuthorize` annotations enforce role-based access

### Role-Based Permissions
- **Controllers**: Use `@PreAuthorize("hasRole('ROLE_NAME')")`
- **Frontend**: Routes protected by role checking
- **Data Access**: Services validate user permissions before operations

---

## 📊 Database Relationships

### Key Entity Relationships
```
Users (1) → (1) PatientProfiles/DoctorProfiles
Users (1) → (1) PatientRecords
Users (1) → (*) Appointments (as Patient)
Users (1) → (*) Appointments (as Doctor)
Users (1) → (*) DoctorAvailabilitySlots
DoctorAvailabilitySlots (1) → (0..1) Appointments
Users (1) → (*) Notifications
Users (1) → (*) ARVTreatments
Appointments (1) → (*) AppointmentStatusHistory
```

### Data Integrity
- Foreign key constraints ensure referential integrity
- Unique constraints prevent duplicate bookings
- Check constraints validate enum values
- Indexes optimize query performance

---

## 🔄 Real-time Features

### Notification System
- **Frontend Polling**: Regular checks for new notifications
- **Unread Counter**: Updates automatically in navigation
- **Mark as Read**: Individual and bulk mark operations
- **Template System**: Reusable notification templates

### Appointment Updates
- **Status Tracking**: Appointment status history maintained
- **Automatic Notifications**: Status changes trigger notifications
- **Conflict Detection**: Prevents double-booking of time slots

---

## 🎨 Frontend Architecture

### Component Structure
```
App
├── AuthProvider (Context)
├── AppRouter (Routing)
├── Dashboard Components (Role-specific)
├── Feature Components
│   ├── Appointments
│   ├── Medical Records
│   ├── Notifications
│   └── Admin Management
└── Shared Components (UI, Forms, etc.)
```

### State Management
- **React Context**: Global user authentication state
- **Local State**: Component-specific data
- **API Services**: Centralized backend communication

---

## 📈 Performance Considerations

### Backend Optimizations
- **Database Indexing**: Strategic indexes on frequently queried columns
- **Connection Pooling**: HikariCP for efficient database connections
- **Lazy Loading**: JPA lazy loading for related entities
- **Caching**: Spring caching for frequently accessed data

### Frontend Optimizations
- **Lazy Loading**: Route-based code splitting
- **Component Optimization**: React memo for expensive components
- **API Caching**: Axios interceptors for response caching
- **Error Boundaries**: Graceful error handling

---

This HIV Clinic Management System provides a comprehensive, secure, and user-friendly platform for managing HIV patient care, with robust workflows supporting all key stakeholders in the healthcare process.
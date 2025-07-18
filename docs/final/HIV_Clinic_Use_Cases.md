# HIV Clinic Management System - Use Cases

## Final Use Cases List (27 Total)

### Unauthenticated User
**Base actor with public access capabilities. All authenticated users inherit these capabilities.**

| Use Case ID | Use Case Name | Description |
|-------------|---------------|-------------|
| UC-001 | Browse Public Website | View HIV information, educational content, and blog posts |
| UC-002 | User Registration | Patients and doctors can register for new accounts |
| UC-003 | User Login | Authenticate using username/password with JWT tokens |

### Authenticated User (All Roles)
**Common capabilities shared by all authenticated users (Patient, Doctor, Admin, Manager).**

| Use Case ID | Use Case Name | Description |
|-------------|---------------|-------------|
| UC-004 | User Logout | Secure session termination and cleanup |
| UC-005 | Update Profile | Manage personal information, contact details, profile images, and settings including privacy settings |
| UC-006 | Change Password | Password modification with validation and security checks |

### Patient (Authenticated User)
**Inherits all Unauthenticated User and Authenticated User capabilities plus:**

| Use Case ID | Use Case Name | Description |
|-------------|---------------|-------------|
| UC-007 | View Patient Dashboard | Overview of appointments, treatments, and personal statistics |
| UC-008 | Manage Appointments | Book, view, and cancel appointments with available doctors |
| UC-009 | Manage Personal Medical Records | View and update personal medical records and information |
| UC-010 | View ARV Treatments | View HIV antiretroviral treatment regimens and status |
| UC-011 | View Notifications | Receive and view system notifications |

### Doctor (Authenticated User)
**Inherits all Unauthenticated User and Authenticated User capabilities plus:**

| Use Case ID | Use Case Name | Description |
|-------------|---------------|-------------|
| UC-012 | View Doctor Dashboard | Professional dashboard with patient appointments and notifications |
| UC-013 | Manage Appointments | View, manage patient appointments, and update appointment status |
| UC-014 | Manage Availability Slots | Create, update, and delete availability time slots |
| UC-015 | Access Patient Records | View comprehensive patient medical records during consultations |
| UC-016 | Manage ARV Treatments | Prescribe and monitor HIV antiretroviral treatments |
| UC-017 | Manage Patient Notifications | Send notifications, view history, and manage templates |

### Admin (Authenticated User)
**Inherits all Unauthenticated User and Authenticated User capabilities plus:**

| Use Case ID | Use Case Name | Description |
|-------------|---------------|-------------|
| UC-018 | View Admin Dashboard | System-wide administrative dashboard |
| UC-019 | Manage Users | Comprehensive user management including patients, doctors, account creation, status toggling, password resets, and specialty management |
| UC-020 | View All Appointments | System-wide appointment oversight and monitoring |

### Manager (Authenticated User)
**Inherits all Unauthenticated User and Authenticated User capabilities plus:**

| Use Case ID | Use Case Name | Description |
|-------------|---------------|-------------|
| UC-021 | View Manager Dashboard | Operational dashboard with analytics and clinic statistics |
| UC-022 | View Statistics | Comprehensive clinic statistics and performance metrics |
| UC-023 | Manage Patient Records | Oversight of patient records, including search and detailed views |
| UC-024 | Manage Doctor Records | Oversight of doctor records, including search and detailed views |
| UC-025 | Manage ARV Treatments | Monitor ARV treatment programs across the clinic |
| UC-026 | Manage Schedules | Oversee clinic scheduling and appointment distribution |
| UC-027 | Export Data (CSV) | Export clinic data in CSV format for reporting and analysis |

## Actor Inheritance Model

```
Unauthenticated User (Base)
    ├── Patient (inherits UC-001, UC-002, UC-003, UC-004, UC-005, UC-006 + UC-007 to UC-011)
    ├── Doctor (inherits UC-001, UC-002, UC-003, UC-004, UC-005, UC-006 + UC-012 to UC-017)
    ├── Admin (inherits UC-001, UC-002, UC-003, UC-004, UC-005, UC-006 + UC-018 to UC-020)
    └── Manager (inherits UC-001, UC-002, UC-003, UC-004, UC-005, UC-006 + UC-021 to UC-027)
```

## Use Case Relationships

### Include Relationships
- **UC-008 (Manage Appointments)** includes **UC-014 (Manage Availability Slots)** - appointment booking requires checking doctor availability
- **UC-013 (Manage Appointments)** includes **UC-015 (Access Patient Records)** - managing appointments requires patient record access
- **UC-016 (Manage ARV Treatments)** includes **UC-015 (Access Patient Records)** - treatment management requires patient record access
- **UC-017 (Manage Patient Notifications)** includes **UC-015 (Access Patient Records)** - sending notifications requires patient information
- **UC-019 (Manage Users)** includes **UC-020 (View All Appointments)** - user management includes appointment oversight

### Extend Relationships
- **UC-009 (Manage Personal Medical Records)** extends **UC-008 (Manage Appointments)** - medical record updates may occur during appointment management
- **UC-011 (View Notifications)** extends **UC-007 (View Patient Dashboard)** - notifications are displayed as part of dashboard functionality
- **UC-005 (Update Profile)** extends **UC-006 (Change Password)** - profile updates may include password changes

### Generalization Relationships
- **UC-023 (Manage Patient Records)** generalizes **UC-019 (Manage Users)** - patient record management is a specialized form of user management
- **UC-024 (Manage Doctor Records)** generalizes **UC-019 (Manage Users)** - doctor record management is a specialized form of user management
- **UC-008 (Manage Appointments)** generalizes **UC-013 (Manage Appointments)** - patient appointment management is a specialized form of doctor appointment management
- **UC-009 (Manage Personal Medical Records)** generalizes **UC-015 (Access Patient Records)** - personal record management is a specialized form of patient record access

## Business Rules

1. **Authentication Inheritance**: All authenticated users inherit the capabilities of unauthenticated users
2. **Role-Based Access**: Each authenticated role has specific additional capabilities beyond the base set
3. **Password Reset Policy**: Users who forget passwords must contact admin for account recovery (no self-service password reset)
4. **Appointment Booking**: Patients can only book appointments with doctors who have available time slots
5. **Medical Record Access**: Doctors can access patient records only during active consultations or treatment management
6. **Data Export**: Only managers can export clinic data for reporting and analysis purposes
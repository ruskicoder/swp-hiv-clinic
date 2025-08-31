# HIV Clinic Management System - Architecture & Workflow Documentation

## System Overview

The HIV Clinic Management System is a full-stack web application built with:
- **Frontend**: React.js with Vite, using React Router for navigation and Axios for API communication
- **Backend**: Java Spring Boot with Spring Security for authentication/authorization
- **Database**: Relational database with JPA/Hibernate for ORM
- **Architecture**: Layered architecture with Controller-Service-Repository pattern
- **Authentication**: JWT-based stateless authentication

## System Architecture

### Backend Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  - Components, Services, Contexts, Router                   │
└─────────────────────────────────────────────────────────────┘
                              │ HTTP/REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Controller Layer                          │
│  - REST endpoints, HTTP request/response handling           │
│  - Input validation, Authentication checks                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  - Business logic, Transaction management                   │
│  - Data transformation, Validation                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Repository Layer                          │
│  - Data access, Database queries                           │
│  - JPA repositories with custom queries                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database                                │
│  - User data, Appointments, Medical records                 │
│  - Availability slots, Notifications                        │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     App.jsx                                 │
│  - Main app wrapper with routing and error boundaries       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AuthContext                               │
│  - Global authentication state management                   │
│  - User login/logout, Session monitoring                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   AppRouter                                 │
│  - Route protection based on user roles                     │
│  - Lazy loading of dashboard components                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Role-based Dashboards                          │
│  - CustomerDashboard, DoctorDashboard                      │
│  - AdminDashboard, ManagerDashboard                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                            │
│  - apiClient, authService, notificationService             │
└─────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization Flow

### JWT Authentication Process

1. **User Login Request**
   - Frontend calls `authService.login(credentials)`
   - Sends POST to `/api/auth/login` with username/password
   - Backend validates credentials using `AuthController`

2. **JWT Token Generation**
   - `AuthService` validates user credentials
   - `JwtUtils` generates JWT token with user claims
   - Token includes user ID, role, and expiration

3. **Token Storage & Usage**
   - Frontend stores JWT in `localStorage`
   - `apiClient` automatically adds JWT to Authorization header
   - Backend validates JWT on each request using `JwtAuthenticationFilter`

4. **Role-based Authorization**
   - Spring Security uses `@PreAuthorize` annotations
   - Role hierarchy: ADMIN > MANAGER > DOCTOR > PATIENT
   - Different endpoints require different role permissions

### Session Management

- JWT tokens have expiration time
- `useSessionMonitor` tracks session status
- Automatic session extension available
- Session timeout modal warns users before expiration

## Detailed Workflow Analysis

## 1. Patient Books Appointment (Doctor Must Add Availability Slots First)

### Frontend Flow (Patient Side)

**Step 1: Patient Dashboard Initialization**
```javascript
// CustomerDashboard.jsx - Line 74-92
const loadDashboardData = async () => {
  const [appointmentsRes, doctorsRes] = await Promise.all([
    apiClient.get('/appointments/patient/my-appointments'),  // Get existing appointments
    apiClient.get('/doctors')  // Get available doctors
  ]);
  setAppointments(appointmentsRes.data);
  setDoctors(doctorsRes.data);
};
```

**Step 2: Doctor Selection and Slot Viewing**
```javascript
// When patient clicks "Book Appointment" button
const handleBookDoctor = async (doctor) => {
  setSelectedDoctor(doctor);
  // Fetch available slots for selected doctor
  const response = await apiClient.get(`/doctors/${doctor.userId}/available-slots`);
  setDoctorSlots(response.data);
};
```

**Step 3: Appointment Booking**
```javascript
// UnifiedCalendar.jsx - Appointment booking
const handleSlotClick = async (slot) => {
  const bookingData = createBookingData(slot, selectedDoctor.userId);
  const response = await apiClient.post('/appointments/book', bookingData);
};
```

### Backend Flow (Appointment Booking)

**Controller Layer: `AppointmentController.bookAppointment()`**
```java
// Line 38-59 in AppointmentController.java
@PostMapping("/book")
@PreAuthorize("hasRole('PATIENT')")
public ResponseEntity<?> bookAppointment(
    @Valid @RequestBody AppointmentBookingRequest request,
    @AuthenticationPrincipal UserPrincipal userPrincipal) {
    
    MessageResponse response = appointmentService.bookAppointment(request, userPrincipal.getId());
    return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
}
```

**Service Layer: `AppointmentService.bookAppointment()`**
The service layer handles:
1. **Validation**: Checks if availability slot exists and is not booked
2. **Business Logic**: Validates appointment time is in future
3. **Data Creation**: Creates new `Appointment` entity
4. **Slot Update**: Marks availability slot as booked
5. **Transaction Management**: Ensures atomicity

**Repository Layer: `AppointmentRepository`**
```java
// Custom queries for appointment management
@Query("SELECT a FROM Appointment a WHERE a.patientUser = :patientUser ORDER BY a.appointmentDateTime DESC")
List<Appointment> findByPatientUser(@Param("patientUser") User patientUser);
```

**Data Flow Variables:**
- `AppointmentBookingRequest`: Contains doctorId, slotId, appointmentDateTime
- `UserPrincipal`: Contains authenticated patient's ID and role
- `MessageResponse`: Returns success/failure with message
- `Appointment`: Entity stored in database with patient, doctor, slot references

### Doctor Availability Slot Creation (Prerequisite)

**Frontend Flow (Doctor Side)**
```javascript
// DoctorDashboard.jsx - Creating availability slots
const createAvailabilitySlot = async (slotData) => {
  const response = await apiClient.post('/doctors/availability', {
    slotDate: slotData.date,
    startTime: slotData.startTime,
    endTime: slotData.endTime,
    isRecurring: slotData.isRecurring
  });
};
```

**Backend Flow: `DoctorController.createAvailabilitySlot()`**
```java
// Line 87-115 in DoctorController.java
@PostMapping("/availability")
@PreAuthorize("hasRole('DOCTOR')")
public ResponseEntity<?> createAvailabilitySlot(
    @Valid @RequestBody DoctorAvailabilityRequest request,
    @AuthenticationPrincipal UserPrincipal userPrincipal) {
    
    MessageResponse response = availabilityService.createAvailabilitySlot(request, userPrincipal.getId());
    return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
}
```

**Why This Method?**
- **Security**: `@PreAuthorize` ensures only doctors can create slots
- **Validation**: `@Valid` ensures request data integrity
- **User Context**: `UserPrincipal` provides authenticated doctor's ID
- **Response Consistency**: `MessageResponse` provides uniform API responses

## 2. Patient Updates Medical Records

### Frontend Flow (Patient Side)

**Step 1: Load Current Medical Record**
```javascript
// CustomerDashboard.jsx - Line 95-101
const loadPatientRecord = async () => {
  const response = await apiClient.get('/patient-records/my-record');
  setPatientRecord(response.data);
};
```

**Step 2: Update Medical Information**
```javascript
// PatientRecordSection.jsx - Update record
const handleUpdateRecord = async (updatedData) => {
  const response = await apiClient.put('/patient-records/my-record', updatedData);
  if (response.data.success) {
    setPatientRecord(response.data.data);
  }
};
```

### Backend Flow (Medical Record Update)

**Controller Layer: `PatientRecordController.updateMyRecord()`**
```java
// Line 72-90 in PatientRecordController.java
@PutMapping("/my-record")
@PreAuthorize("hasAuthority('ROLE_PATIENT')")
public ResponseEntity<?> updateMyRecord(
    @AuthenticationPrincipal UserPrincipal userPrincipal,
    @RequestBody Map<String, Object> recordData) {
    
    MessageResponse response = patientRecordService.updatePatientRecordWithResponse(
        userPrincipal.getId(), recordData);
    return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
}
```

**Service Layer: `PatientRecordService.updatePatientRecordWithResponse()`**
The service handles:
1. **Record Retrieval**: Gets existing patient record or creates new one
2. **Data Validation**: Validates medical data format and constraints
3. **Update Logic**: Updates only changed fields
4. **Profile Sync**: Updates related PatientProfile if needed
5. **Audit Trail**: Logs record changes for compliance

**Data Flow Variables:**
- `Map<String, Object> recordData`: Flexible structure for medical data
- `UserPrincipal`: Provides patient's authenticated ID
- `PatientRecord`: Entity containing medical history, symptoms, treatments
- `MessageResponse`: Returns success status and updated record

**Why This Approach?**
- **Patient Control**: Patients can only update their own records
- **Flexible Schema**: Map allows dynamic medical fields
- **Data Integrity**: Service layer validates all updates
- **Audit Compliance**: All changes are tracked for medical compliance

## 3. Doctor Creates Appointment Availability Slots

### Frontend Flow (Doctor Side)

**Step 1: Calendar Interface**
```javascript
// UnifiedCalendar.jsx - Slot creation interface
const handleCreateSlot = async (dateTime, duration) => {
  const slotData = {
    slotDate: dateTime.toISOString().split('T')[0],
    startTime: dateTime.toTimeString().split(' ')[0],
    endTime: calculateEndTime(dateTime, duration),
    isRecurring: false
  };
  
  const response = await apiClient.post('/doctors/availability', slotData);
};
```

**Step 2: Bulk Slot Creation**
```javascript
// TimeSlotModal.jsx - Creating multiple slots
const createRecurringSlots = async (slotData) => {
  const slots = generateRecurringSlots(slotData);
  for (const slot of slots) {
    await apiClient.post('/doctors/availability', slot);
  }
};
```

### Backend Flow (Availability Slot Creation)

**Controller Layer: `DoctorController.createAvailabilitySlot()`**
```java
@PostMapping("/availability")
@PreAuthorize("hasRole('DOCTOR')")
public ResponseEntity<?> createAvailabilitySlot(
    @Valid @RequestBody DoctorAvailabilityRequest request,
    @AuthenticationPrincipal UserPrincipal userPrincipal) {
    
    // Validation check
    if (request == null || request.getSlotDate() == null || request.getStartTime() == null) {
        return ResponseEntity.badRequest().body(MessageResponse.error("Invalid request data"));
    }

    MessageResponse response = availabilityService.createAvailabilitySlot(request, userPrincipal.getId());
    return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
}
```

**Service Layer: `DoctorAvailabilityService.createAvailabilitySlot()`**
The service performs:
1. **Conflict Check**: Ensures no overlapping slots exist
2. **Doctor Validation**: Verifies doctor exists and is active
3. **Time Validation**: Checks slot is in future and during business hours
4. **Slot Creation**: Creates `DoctorAvailabilitySlot` entity
5. **Persistence**: Saves to database with transaction management

**Repository Layer: `DoctorAvailabilitySlotRepository`**
```java
// Custom query to check for conflicts
@Query("SELECT s FROM DoctorAvailabilitySlot s WHERE s.doctorUser = :doctor AND s.slotDate = :date AND " +
       "((s.startTime <= :startTime AND s.endTime > :startTime) OR " +
       "(s.startTime < :endTime AND s.endTime >= :endTime))")
List<DoctorAvailabilitySlot> findConflictingSlots(@Param("doctor") User doctor, 
                                                  @Param("date") LocalDate date,
                                                  @Param("startTime") LocalTime startTime, 
                                                  @Param("endTime") LocalTime endTime);
```

**Data Flow Variables:**
- `DoctorAvailabilityRequest`: Contains slotDate, startTime, endTime, isRecurring
- `DoctorAvailabilitySlot`: Entity with doctor reference, date/time, booking status
- `UserPrincipal`: Authenticated doctor's information

**Why This Design?**
- **Conflict Prevention**: Repository queries prevent double-booking
- **Role Security**: Only doctors can create their own availability
- **Data Integrity**: Validation ensures logical time slots
- **Scalability**: Supports both single and recurring slot creation

## 4. Manager Exports Reports

### Frontend Flow (Manager Side)

**Step 1: Export Interface**
```javascript
// ManagerDashboard.jsx - Export functionality
const exportData = async (exportType) => {
  setLoading(true);
  try {
    const response = await apiClient.get(`/export/${exportType}`, {
      responseType: 'blob'  // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${exportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    setError('Export failed: ' + error.message);
  } finally {
    setLoading(false);
  }
};
```

**Step 2: Export Options**
```javascript
// ExportData.jsx component
const exportOptions = [
  { type: 'patient-profiles', label: 'Patient Profiles' },
  { type: 'doctor-slots', label: 'Doctor Availability' },
  { type: 'appointments', label: 'All Appointments' },
  { type: 'arv-treatments', label: 'ARV Treatments' }
];
```

### Backend Flow (Report Export)

**Controller Layer: `ExportController`**
```java
// Line 23-26 in ExportController.java
@GetMapping("/patient-profiles")
@PreAuthorize("hasRole('MANAGER')")
public ResponseEntity<byte[]> exportPatientProfiles() {
    String csv = managerService.generatePatientProfilesCSV();
    return createCSVResponse(csv, "patient_profiles.csv");
}
```

**Utility Method: `createCSVResponse()`**
```java
// Line 53-60 in ExportController.java
private ResponseEntity<byte[]> createCSVResponse(String csv, String filename) {
    byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType("text/csv"));
    headers.setContentLength(bytes.length);
    headers.setContentDispositionFormData("attachment", filename);
    return ResponseEntity.ok().headers(headers).body(bytes);
}
```

**Service Layer: `ManagerService.generatePatientProfilesCSV()`**
The service handles:
1. **Data Retrieval**: Queries all patient profiles from repository
2. **Data Processing**: Converts entities to CSV format
3. **Privacy Compliance**: Excludes sensitive data fields
4. **Format Standardization**: Ensures consistent CSV structure
5. **Performance**: Uses streaming for large datasets

**Data Flow Variables:**
- CSV String: Generated report content
- HTTP Headers: Set proper content type and download disposition
- Byte Array: Binary representation for file download
- ResponseEntity: Spring's HTTP response wrapper

**Why This Method?**
- **Role Security**: Only managers can export reports
- **Format Standardization**: CSV format for Excel compatibility
- **Memory Efficiency**: Streaming approach for large datasets
- **Browser Compatibility**: Proper headers for file downloads

## 5. Admin Creates New Accounts (Doctor/Patient)

### Frontend Flow (Admin Side)

**Step 1: User Creation Form**
```javascript
// AdminDashboard.jsx - CreateUserForm component (Line 12-100)
const CreateUserForm = ({ loadDashboardData, setActiveTab }) => {
  const [formData, setFormData] = useState({
    username: '', password: '', email: '', 
    firstName: '', lastName: '', phoneNumber: '', 
    gender: '', roleName: ''
  });
  const [roles, setRoles] = useState([]);
  
  // Load available roles
  useEffect(() => {
    const fetchRoles = async () => {
      const response = await apiClient.get('/admin/roles');
      // Filter out Admin and Manager roles for security
      setRoles(response.data.filter(role => 
        role.roleName !== 'Admin' && role.roleName !== 'Manager'));
    };
    fetchRoles();
  }, []);
};
```

**Step 2: Form Submission**
```javascript
// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.roleName) {
    setError('Please select a role for the new user.');
    return;
  }
  
  const response = await apiClient.post('/admin/users', formData);
  if (response.data.success) {
    setSuccess(response.data.message);
    loadDashboardData(); // Refresh user lists
  }
};
```

### Backend Flow (User Account Creation)

**Controller Layer: `AdminController.createUserByAdmin()`**
```java
// Line 43-53 in AdminController.java
@PostMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> createUserByAdmin(@Valid @RequestBody AdminCreateUserRequest request) {
    MessageResponse response = adminService.createUser(request);
    return response.isSuccess() ? 
        ResponseEntity.ok(response) : 
        ResponseEntity.badRequest().body(response);
}
```

**Service Layer: `AdminService.createUser()`**
The service handles:
1. **Input Validation**: Validates username/email uniqueness
2. **Password Security**: Encrypts password using BCrypt
3. **Role Assignment**: Assigns proper role to user
4. **Profile Creation**: Creates corresponding PatientProfile or DoctorProfile
5. **Transaction Management**: Ensures atomicity of user creation

**Data Transfer: `AdminCreateUserRequest`**
```java
public class AdminCreateUserRequest {
    private String username;
    private String password;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String gender;
    private String roleName;
    // Validation annotations and getters/setters
}
```

**Repository Layer: Multiple Repositories**
- `UserRepository`: Stores main user account
- `RoleRepository`: Retrieves role by name
- `PatientProfileRepository` / `DoctorProfileRepository`: Creates role-specific profiles

**Data Flow Variables:**
- `AdminCreateUserRequest`: DTO containing all user data
- `User`: Main user entity with authentication details
- `Role`: Entity defining user permissions
- `Profile`: Role-specific profile (Patient/Doctor)
- `MessageResponse`: Success/failure response

**Why This Architecture?**
- **Security**: Only admins can create accounts
- **Data Integrity**: Validation ensures unique usernames/emails
- **Role Isolation**: Profile creation based on role type
- **Transaction Safety**: All-or-nothing user creation

## 6. Doctor Sends Notification to Patient

### Frontend Flow (Doctor Side)

**Step 1: Patient Selection**
```javascript
// NotificationManagerTab.jsx - Patient selection
const loadPatientsWithAppointments = async () => {
  const result = await notificationService.getPatientsWithAppointments(user.id);
  if (result.success) {
    setPatients(result.data);
  }
};
```

**Step 2: Notification Composition**
```javascript
// NotificationSendModal.jsx - Notification sending
const sendNotification = async () => {
  const notificationData = {
    patientIds: selectedPatients,
    templateId: selectedTemplate.id,
    customMessage: message,
    subject: subject,
    priority: priority,
    sendNow: true
  };
  
  const result = await notificationService.sendNotification(notificationData, doctorId);
};
```

### Backend Flow (Notification Sending)

**Controller Layer: `NotificationController.sendNotificationToPatient()`**
```java
// Line 150-184 in NotificationController.java
@PostMapping("/doctor/send")
public ResponseEntity<Map<String, Object>> sendNotificationToPatient(
        @RequestParam Long doctorId,
        @RequestParam Long patientId,
        @RequestParam Long templateId,
        @RequestBody(required = false) Map<String, String> variables) {
    
    boolean success = doctorNotificationService.sendNotificationToPatient(
        doctorId, patientId, templateId, variables);
    
    return success ? 
        ResponseEntity.ok(Map.of("success", true, "message", "Notification sent successfully")) :
        ResponseEntity.badRequest().body(Map.of("success", false, "message", "Failed to send notification"));
}
```

**Service Layer: `DoctorNotificationService.sendNotificationToPatient()`**
The service performs:
1. **Permission Check**: Verifies doctor has relationship with patient
2. **Template Processing**: Retrieves and processes notification template
3. **Variable Substitution**: Replaces template variables with actual data
4. **Notification Creation**: Creates `Notification` entity
5. **Delivery**: Handles immediate or scheduled delivery

**Service Layer: `NotificationService` (Frontend)**
```javascript
// notificationService.js - Line 84-140
async sendNotification(notificationData, doctorId) {
  const { patientIds, templateId, customMessage } = notificationData;
  
  const results = [];
  for (const patientId of patientIds) {
    try {
      const response = await apiClient.post('/v1/notifications/doctor/send', null, {
        params: { doctorId, patientId, templateId },
        data: { customMessage }
      });
      results.push({ patientId, success: true });
    } catch (error) {
      results.push({ patientId, success: false, error: error.message });
    }
  }
  
  return { success: true, results };
}
```

**Data Flow Variables:**
- `NotificationTemplate`: Pre-defined message templates
- `Notification`: Entity storing notification content and status
- `Map<String, String> variables`: Template variable substitutions
- Doctor-Patient relationship validation data

**Why This Design?**
- **Security**: Doctors can only send to their patients
- **Template System**: Standardized messaging with customization
- **Batch Processing**: Send to multiple patients efficiently
- **Audit Trail**: All notifications logged for compliance
- **Status Tracking**: Track delivery and read status

## 7. Patient Updates Information in Medical Records

### Frontend Flow (Patient Side)

**Step 1: Medical Record Form**
```javascript
// PatientRecordSection.jsx - Record editing interface
const PatientRecordSection = ({ user, onRecordUpdate }) => {
  const [recordData, setRecordData] = useState({
    symptoms: '',
    currentMedications: '',
    allergies: '',
    medicalHistory: '',
    emergencyContact: '',
    bloodType: '',
    weight: '',
    height: ''
  });
  
  // Load existing record
  useEffect(() => {
    loadPatientRecord();
  }, []);
};
```

**Step 2: Record Updates**
```javascript
const handleSaveRecord = async () => {
  try {
    const response = await apiClient.put('/patient-records/my-record', recordData);
    if (response.data.success) {
      setSuccessMessage('Medical record updated successfully');
      onRecordUpdate?.(response.data.data);
    }
  } catch (error) {
    setError('Failed to update medical record');
  }
};
```

### Backend Flow (Medical Record Update)

**Controller Layer: `PatientRecordController.updateMyRecord()`**
```java
// Line 72-90 in PatientRecordController.java
@PutMapping("/my-record")
@PreAuthorize("hasAuthority('ROLE_PATIENT')")
public ResponseEntity<?> updateMyRecord(
        @AuthenticationPrincipal UserPrincipal userPrincipal,
        @RequestBody Map<String, Object> recordData) {
    
    MessageResponse response = patientRecordService.updatePatientRecordWithResponse(
        userPrincipal.getId(), recordData);
    
    return response.isSuccess() ? 
        ResponseEntity.ok(response) : 
        ResponseEntity.badRequest().body(response);
}
```

**Service Layer: `PatientRecordService.updatePatientRecordWithResponse()`**
The service handles:
1. **Record Retrieval**: Gets existing record or creates new one
2. **Data Validation**: Validates medical data formats
3. **Selective Update**: Updates only modified fields
4. **Medical Validation**: Ensures medical data consistency
5. **Change Tracking**: Logs what was changed and when
6. **Profile Sync**: Updates patient profile if demographic data changed

**Repository Layer: `PatientRecordRepository`**
```java
@Repository
public interface PatientRecordRepository extends JpaRepository<PatientRecord, Integer> {
    Optional<PatientRecord> findByPatientUser_UserId(Integer userId);
    
    @Query("SELECT pr FROM PatientRecord pr WHERE pr.patientUser = :user")
    Optional<PatientRecord> findByPatientUser(@Param("user") User user);
}
```

**Model Layer: `PatientRecord`**
```java
@Entity
@Table(name = "PatientRecords")
public class PatientRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer recordId;
    
    @OneToOne
    @JoinColumn(name = "PatientUserID")
    private User patientUser;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String symptoms;
    
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String currentMedications;
    
    // Other medical fields...
}
```

**Data Flow Variables:**
- `Map<String, Object> recordData`: Flexible medical data structure
- `PatientRecord`: Entity containing comprehensive medical information
- `UserPrincipal`: Authenticated patient information
- `MessageResponse`: Success/failure response with updated data

**Why This Approach?**
- **Patient Ownership**: Patients control their medical data
- **Flexible Schema**: Map structure accommodates evolving medical fields
- **Data Validation**: Service layer ensures medical data integrity
- **Change Tracking**: All modifications logged for medical compliance
- **Security**: Only authenticated patients can update their records

## Data Transfer Mechanisms

### API Communication Layer

**Frontend API Client Configuration**
```javascript
// apiClient.js - Line 6-12
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Request Interceptor (JWT Injection)**
```javascript
// apiClient.js - Line 15-24
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

**Response Interceptor (Error Handling)**
```javascript
// apiClient.js - Line 27-39
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Backend Security Filter Chain

**JWT Authentication Filter**
```java
// JwtAuthenticationFilter.java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                  HttpServletResponse response, 
                                  FilterChain filterChain) {
        String token = extractTokenFromRequest(request);
        if (token != null && jwtUtils.validateToken(token)) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(
                jwtUtils.getUsernameFromToken(token));
            // Set authentication in SecurityContext
        }
        filterChain.doFilter(request, response);
    }
}
```

**Security Configuration**
```java
// SecurityConfig.java - Line 84-103
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/manager/**").hasRole("MANAGER")
            .requestMatchers("/api/doctors/**").authenticated()
            .anyRequest().authenticated()
        );
    
    http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

## Database Schema Relationships

### Core Entities and Relationships

```
User (Central entity)
├── Role (Many-to-One) - Defines user permissions
├── PatientProfile (One-to-One) - Patient-specific data
├── DoctorProfile (One-to-One) - Doctor-specific data
├── PatientRecord (One-to-One) - Medical records
├── Appointments (One-to-Many) - As patient or doctor
├── DoctorAvailabilitySlots (One-to-Many) - Doctor's availability
├── Notifications (One-to-Many) - Sent or received
└── ARVTreatment (One-to-Many) - Treatment records

Appointment
├── Patient (Many-to-One User)
├── Doctor (Many-to-One User)
├── AvailabilitySlot (Many-to-One)
└── AppointmentStatusHistory (One-to-Many)

Notification
├── Sender (Many-to-One User)
├── Recipient (Many-to-One User)
└── Template (Many-to-One NotificationTemplate)
```

### Repository Query Examples

**Custom JPA Queries**
```java
// AppointmentRepository.java - Line 24-32
@Query("SELECT a FROM Appointment a " +
       "LEFT JOIN FETCH a.patientUser pu " +
       "LEFT JOIN FETCH pu.role " +
       "LEFT JOIN FETCH a.doctorUser du " +
       "LEFT JOIN FETCH du.role " +
       "WHERE a.patientUser = :patientUser " +
       "ORDER BY a.appointmentDateTime DESC")
List<Appointment> findByPatientUser(@Param("patientUser") User patientUser);
```

**Why Custom Queries?**
- **Performance**: Eager loading reduces N+1 query problems
- **Data Completeness**: Ensures all required data is loaded
- **Sorting**: Consistent ordering of results
- **Join Optimization**: Optimized database queries

## Error Handling & Validation

### Frontend Error Handling

**Global Error Boundary**
```javascript
// ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
```

**Service Level Error Handling**
```javascript
// authService.js - Line 30-37
catch (error) {
  console.error('Login service error:', error);
  return {
    success: false,
    message: error.response?.data?.message || 'Login failed. Please check your credentials.'
  };
}
```

### Backend Error Handling

**Global Exception Handler**
```java
// GlobalExceptionHandler.java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<MessageResponse> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest().body(MessageResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<MessageResponse> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(MessageResponse.error(ex.getMessage()));
    }
}
```

**Input Validation**
```java
// Controller validation
@PostMapping("/book")
@PreAuthorize("hasRole('PATIENT')")
public ResponseEntity<?> bookAppointment(
        @Valid @RequestBody AppointmentBookingRequest request,  // @Valid triggers validation
        @AuthenticationPrincipal UserPrincipal userPrincipal) {
    // Validation is handled automatically by Spring
}
```

## Performance Optimizations

### Frontend Optimizations

**Lazy Loading**
```javascript
// AppRouter.jsx - Line 7-16
const Home = React.lazy(() => import('../features/Website/Home'));
const Login = React.lazy(() => import('../features/auth/Login'));
const CustomerDashboard = React.lazy(() => import('../features/Customer/CustomerDashboard'));
```

**Component Memoization**
```javascript
// React.memo for preventing unnecessary re-renders
const PatientRecordSection = React.memo(({ user, onRecordUpdate }) => {
  // Component logic
});
```

### Backend Optimizations

**Database Connection Pooling**
```java
// Application properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=20000
```

**JPA Optimizations**
```java
// Eager loading with JOIN FETCH to avoid N+1 queries
@Query("SELECT a FROM Appointment a " +
       "LEFT JOIN FETCH a.patientUser " +
       "LEFT JOIN FETCH a.doctorUser " +
       "WHERE a.doctorUser = :doctorUser")
List<Appointment> findByDoctorUser(@Param("doctorUser") User doctorUser);
```

**Caching Configuration**
```java
// CacheConfig.java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        cacheManager.setCacheNames(Arrays.asList("users", "appointments", "notifications"));
        return cacheManager;
    }
}
```

## Security Measures

### Authentication Security

**Password Encryption**
```java
// SecurityConfig.java - Line 42-45
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();  // Strong password hashing
}
```

**JWT Security**
```java
// JwtUtils.java
public String generateToken(UserDetails userDetails) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("role", userDetails.getAuthorities().iterator().next().getAuthority());
    return createToken(claims, userDetails.getUsername());
}
```

### Authorization Security

**Role-based Access Control**
```java
// Method-level security
@PreAuthorize("hasRole('DOCTOR')")  // Only doctors can access
@PreAuthorize("hasRole('PATIENT')")  // Only patients can access
@PreAuthorize("hasRole('ADMIN')")   // Only admins can access
```

**Resource-level Security**
```java
// Ensuring users can only access their own data
public ResponseEntity<?> getMyRecord(@AuthenticationPrincipal UserPrincipal userPrincipal) {
    // userPrincipal.getId() ensures user can only access their own record
    Map<String, Object> record = patientRecordService.getPatientRecordAsMap(userPrincipal.getId());
}
```

### Data Protection

**SQL Injection Prevention**
```java
// Parameterized queries prevent SQL injection
@Query("SELECT a FROM Appointment a WHERE a.patientUser = :patientUser")
List<Appointment> findByPatientUser(@Param("patientUser") User patientUser);
```

**XSS Prevention**
```javascript
// Frontend input sanitization
const safeRender = (value) => {
  if (!value) return '';
  return String(value).replace(/[<>]/g, ''); // Basic XSS prevention
};
```

## Conclusion

This HIV Clinic Management System demonstrates a robust, secure, and scalable architecture using modern web technologies. The layered approach ensures:

1. **Separation of Concerns**: Each layer has distinct responsibilities
2. **Security**: Comprehensive authentication and authorization
3. **Scalability**: Modular design supports growth
4. **Maintainability**: Clean code structure and documentation
5. **User Experience**: Role-based interfaces and responsive design
6. **Data Integrity**: Comprehensive validation and error handling
7. **Compliance**: Audit trails and secure medical data handling

The system successfully handles all seven key scenarios with proper data flow, security measures, and user-friendly interfaces while maintaining medical data privacy and compliance standards.
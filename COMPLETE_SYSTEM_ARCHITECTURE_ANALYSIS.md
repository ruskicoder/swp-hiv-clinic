# Complete System Architecture Analysis - HIV Clinic Management System

## 🏗️ Application Bootstrap and Configuration Layer

### Main Application Entry Point
**File**: `HivClinicBackendApplication.java`
- **Purpose**: Spring Boot application entry point
- **Key Features**:
  - `@SpringBootApplication`: Enables auto-configuration, component scanning, and configuration properties
  - `@EnableScheduling`: Enables scheduled task execution for notification processing
  - **Dependencies**: Starts entire Spring application context

### Configuration Layer Components

#### 1. Security Configuration (`SecurityConfig.java`)
**Purpose**: Defines application-wide security policies and authentication mechanisms

**Key Components**:
- **Password Encoder**: `BCryptPasswordEncoder` for secure password hashing
- **Authentication Provider**: `DaoAuthenticationProvider` with custom user details service
- **JWT Authentication Filter**: Intercepts requests to validate JWT tokens
- **CORS Configuration**: Allows cross-origin requests from frontend
- **Role Hierarchy**: Admin > Manager > Doctor > Patient
- **Security Filter Chain**: Defines URL-based access control

**Dependencies Injection**:
```java
@Autowired CustomUserDetailsService userDetailsService
@Autowired JwtAuthenticationFilter jwtAuthenticationFilter
```

**Communication Flow**:
1. HTTP Request → JWT Filter → Authentication Provider → User Details Service → Database
2. Successful auth → Security Context → Controller access granted

#### 2. JWT Infrastructure

##### JWT Utils (`JwtUtils.java`)
**Purpose**: Centralized JWT token management
- **Token Generation**: Creates tokens with username, userId, and role claims
- **Token Validation**: Verifies signature and expiration
- **Claim Extraction**: Retrieves user information from tokens
- **Security**: Uses HMAC-SHA256 with configurable secret

##### JWT Authentication Filter (`JwtAuthenticationFilter.java`)
**Purpose**: Request-level authentication interceptor
```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
```

**Process Flow**:
1. Extract JWT from Authorization header
2. Validate token using `JwtUtils`
3. Check session validity via `UserSessionService`
4. Load user details via `CustomUserDetailsService`
5. Set authentication in `SecurityContextHolder`
6. Update session activity
7. Continue filter chain

**Dependencies**:
- `JwtUtils`: Token validation
- `CustomUserDetailsService`: User loading
- `UserSessionService`: Session management

#### 3. Custom User Details Service (`CustomUserDetailsService.java`)
**Purpose**: Bridge between Spring Security and application user model

**Key Components**:
- **UserPrincipal Inner Class**: Implements `UserDetails` interface
- **User Loading**: Converts database User to Spring Security UserDetails
- **Role Mapping**: Ensures consistent ROLE_ prefix

**Communication**:
```java
UserRepository → User Entity → UserPrincipal → Spring Security Context
```

#### 4. Data Initialization (`DataInitializer.java`)
**Purpose**: Bootstrap system with essential data
- **Roles**: Patient, Doctor, Admin, Manager
- **Specialties**: HIV/AIDS Specialist, Infectious Disease, Internal Medicine
- **System Settings**: Appointment duration, booking lead time
- **Default Users**: Admin, test patient, test doctor

**Dependencies**: All repository interfaces for initial data creation

#### 5. Global Exception Handler (`GlobalExceptionHandler.java`)
**Purpose**: Centralized error handling and response formatting
- **Validation Errors**: Field-level validation failures
- **Type Mismatches**: Invalid parameter types
- **Authentication Errors**: Bad credentials, access denied
- **Runtime Exceptions**: Unexpected application errors

---

## 📊 Data Layer (Model and Repository)

### Entity Model Architecture

#### Core Entity: User (`User.java`)
**Purpose**: Central user entity implementing Spring Security's `UserDetails`

**Key Features**:
- **Identity**: Primary key `userId`, unique `username` and `email`
- **Security**: Password hash, role association, active status
- **Audit**: Created/updated timestamps, last login tracking
- **Profile**: Basic information that can be extended by profile entities

**Relationships**:
```java
User (1) ←→ (1) Role (Many-to-One, EAGER)
User (1) ←→ (0..1) PatientProfile (One-to-One)
User (1) ←→ (0..1) DoctorProfile (One-to-One)
User (1) ←→ (*) Appointments (as Patient/Doctor)
User (1) ←→ (*) DoctorAvailabilitySlots
User (1) ←→ (*) Notifications
User (1) ←→ (*) UserSessions
```

#### Profile Extensions

##### Patient Profile (`PatientProfile.java`)
**Purpose**: Patient-specific information and medical metadata
- **Personal Info**: Names, contact, demographics
- **Medical Context**: Blood type, emergency contacts, insurance
- **Privacy**: `isPrivate` flag for anonymous mode
- **Relationship**: One-to-One with User

##### Doctor Profile (`DoctorProfile.java`)
**Purpose**: Doctor-specific professional information
- **Professional Info**: Names, specialty, bio
- **Contact**: Phone number
- **Specialty Relationship**: Many-to-One with Specialty entity

#### Medical Data Models

##### Patient Record (`PatientRecord.java`)
**Purpose**: Comprehensive medical record storage
- **Medical History**: Conditions, allergies, current medications
- **Emergency Info**: Contacts and blood type
- **Clinical Notes**: Doctor observations and notes
- **Audit Trail**: Creation and update timestamps

##### Appointment (`Appointment.java`)
**Purpose**: Core scheduling entity with complex relationships
```java
@ManyToOne Patient User
@ManyToOne Doctor User  
@ManyToOne DoctorAvailabilitySlot
```
- **Temporal Data**: Date/time with flexible formatting
- **Status Management**: Scheduled, Completed, Cancelled with reasons
- **Notes**: Clinical observations and instructions

##### Doctor Availability Slot (`DoctorAvailabilitySlot.java`)
**Purpose**: Time slot management for appointments
- **Temporal**: Date, start time, end time
- **Booking State**: `isBooked` flag
- **Unique Constraint**: `(DoctorUserID, SlotDate, StartTime)`

#### Notification System

##### Notification (`Notification.java`)
**Purpose**: Multi-type notification management
- **Types**: Appointment reminders, medication alerts, general, system notifications
- **Delivery**: Scheduled and immediate notifications
- **Status Tracking**: Read/unread, sent status
- **Related Entities**: Links to appointments, treatments, etc.

### Repository Layer Architecture

#### Base Repository Pattern
All repositories extend `JpaRepository<Entity, ID>` providing:
- **CRUD Operations**: Save, find, delete operations
- **Query Methods**: Auto-generated from method names
- **Custom Queries**: `@Query` annotations for complex operations

#### User Repository (`UserRepository.java`)
**Purpose**: User entity data access with role-based queries

**Key Methods**:
```java
Optional<User> findByUsername(String username)
@Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.userId = :userId")
Optional<User> findByUserIdWithRole(@Param("userId") Integer userId)

@Query("SELECT u FROM User u WHERE u.username NOT LIKE 'dummy_%'")
List<User> findAllNonDummyUsers()
```

**Communication Pattern**:
- Eager loading for roles to avoid N+1 queries
- Filtering dummy users from business operations
- Role-based counting for statistics

#### Appointment Repository (`AppointmentRepository.java`)
**Purpose**: Complex appointment queries with eager loading

**Query Optimization**:
```java
@Query("SELECT a FROM Appointment a " +
       "LEFT JOIN FETCH a.patientUser pu " +
       "LEFT JOIN FETCH pu.role " +
       "LEFT JOIN FETCH a.doctorUser du " +
       "LEFT JOIN FETCH du.role " +
       "LEFT JOIN FETCH a.availabilitySlot " +
       "WHERE a.patientUser = :patientUser")
```

**Features**:
- **Eager Loading**: Prevents N+1 query problems
- **Date Range Queries**: Efficient temporal filtering
- **User-based Filtering**: Patient and doctor specific queries

#### Doctor Availability Repository (`DoctorAvailabilitySlotRepository.java`)
**Purpose**: Complex scheduling queries and conflict detection

**Advanced Features**:
```java
@Query("SELECT s FROM DoctorAvailabilitySlot s " +
       "WHERE s.doctorUser = :doctor " +
       "AND s.slotDate = :date " +
       "AND CAST(s.startTime AS time) < CAST(:endTime AS time) " +
       "AND CAST(:startTime AS time) < CAST(s.endTime AS time)")
List<DoctorAvailabilitySlot> findOverlappingSlots(...)
```

**Implements**: Custom repository interface for complex time-based queries

#### Notification Repository (`NotificationRepository.java`)
**Purpose**: Notification lifecycle management

**Key Features**:
- **Status Filtering**: Excludes cancelled notifications from patient view
- **Bulk Operations**: Mark all as read functionality
- **Scheduled Queries**: Find notifications due for delivery
- **Cleanup Queries**: Old notification removal

---

## 🔧 Business Logic Layer (Services)

### Service Architecture Patterns

#### Authentication Service (`AuthService.java`)
**Purpose**: Core authentication and user management business logic

**Key Dependencies**:
```java
@Autowired UserRepository userRepository
@Autowired RoleRepository roleRepository
@Autowired PatientProfileRepository patientProfileRepository
@Autowired DoctorProfileRepository doctorProfileRepository
@Autowired PasswordEncoder passwordEncoder
@Autowired AuthenticationManager authenticationManager
@Autowired JwtUtils jwtUtils
@Autowired LoginActivityService loginActivityService
@Autowired UserSessionService userSessionService
```

**Business Operations**:

##### User Registration Flow
```java
@Transactional
public MessageResponse registerUser(RegisterRequest registerRequest)
```
1. **Validation**: Username/email uniqueness checking
2. **Role Assignment**: Default Patient role assignment
3. **Password Security**: BCrypt encoding
4. **Profile Creation**: Patient profile initialization
5. **Transaction**: All-or-nothing operation

##### Authentication Flow
```java
public AuthResponse authenticateUser(LoginRequest loginRequest, String ipAddress, String userAgent)
```
1. **Spring Security**: Authentication manager validation
2. **JWT Generation**: Token creation with user claims
3. **Activity Logging**: Login attempt tracking
4. **Session Creation**: User session initialization
5. **Audit Trail**: IP and user agent logging

##### Profile Management
- **Role-based Profiles**: Different profile types for users
- **Gender Validation**: Business rules for gender assignment
- **Image Handling**: Base64 profile image storage

#### Doctor Availability Service (`DoctorAvailabilityService.java`)
**Purpose**: Complex scheduling business logic

**Key Features**:

##### Slot Creation Logic
```java
@Transactional
public MessageResponse createAvailabilitySlot(DoctorAvailabilityRequest request, Integer doctorUserId)
```
1. **User Validation**: Verify doctor role
2. **Time Calculation**: End time computation
3. **Business Hours**: 8 AM - 6 PM validation
4. **Overlap Detection**: Complex time overlap checking
5. **Persistence**: Atomic slot creation

##### Conflict Detection Algorithm
```java
private boolean isTimeOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
    return start1.isBefore(end2) && start2.isBefore(end1);
}
```

##### Safe Data Population
- **Circular Reference Prevention**: Safe appointment detail population
- **N+1 Query Optimization**: Batch loading strategies

#### Appointment Service (`AppointmentService.java`)
**Purpose**: Core appointment management with complex business rules

**Key Dependencies**: Multiple repositories for cross-entity operations

**Business Logic**:

##### Date/Time Parsing
```java
private static final DateTimeFormatter[] SUPPORTED_FORMATTERS = {
    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
    // ... multiple format support
};
```

##### Privacy Integration
```java
private User sanitizePatientData(User patient) {
    if (patientPrivacyService.getPrivacySettings(patient.getUserId())) {
        // Create anonymous user representation
    }
    return patient;
}
```

##### Booking Workflow
1. **Slot Validation**: Availability checking
2. **Business Rules**: Time constraints validation
3. **State Management**: Slot booking status update
4. **Notification Triggers**: Automatic notification creation
5. **Audit Trail**: Status history tracking

#### Notification Service (`NotificationService.java`)
**Purpose**: Comprehensive notification lifecycle management

**Key Features**:

##### Status-based Filtering
```java
public List<NotificationDto> getNotificationsByUserId(Integer userId) {
    // Filter out CANCELLED notifications for patient privacy
    List<Notification> visibleNotifications = 
        notificationRepository.findByUserIdExcludingCancelledOrderByCreatedAtDesc(userId);
}
```

##### Atomic Read Operations
```java
@Transactional(rollbackFor = Exception.class)
public NotificationDto markAsRead(Integer notificationId, Integer userId) {
    // Atomic update with verification
    notification.setIsRead(true);
    notification.setStatus("READ");
    // Database verification for consistency
}
```

---

## 🌐 Presentation Layer (Controllers)

### REST API Architecture

#### Base Controller Patterns
All controllers follow consistent patterns:
- **Cross-Origin**: `@CrossOrigin(origins = "*", maxAge = 3600)`
- **Exception Handling**: Try-catch with proper HTTP status codes
- **Logging**: Comprehensive operation logging
- **Authentication**: `@PreAuthorize` for role-based access

#### Authentication Controller (`AuthController.java`)
**Purpose**: Authentication and user profile management endpoints

**Endpoint Architecture**:
```java
@RestController
@RequestMapping("/api/auth")
```

**Key Endpoints**:

##### Registration Endpoint
```java
@PostMapping("/register")
public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest)
```
- **Validation**: Bean validation with custom password confirmation
- **Service Delegation**: Calls `AuthService.registerUser()`
- **Response Handling**: Success/error response formatting

##### Login Endpoint
```java
@PostMapping("/login")
public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request)
```
- **IP Extraction**: Complex proxy-aware IP detection
- **Activity Tracking**: IP and user agent logging
- **JWT Response**: Token and user information

##### Profile Management
- **Profile Retrieval**: `/me` and `/profile` endpoints
- **Profile Updates**: PUT operations with validation
- **Image Upload**: Base64 image handling

##### Session Management
- **Status Checking**: `/session/status` for session monitoring
- **Session Extension**: `/session/extend` for timeout management
- **Logout**: `/session/invalidate` for clean session termination

#### Appointment Controller (`AppointmentController.java`)
**Purpose**: Appointment lifecycle management API

**Role-based Endpoints**:
- **Patient Operations**: Booking, viewing own appointments
- **Doctor Operations**: Viewing patient appointments, status updates
- **Shared Operations**: Cancellation with role-specific logic

**Key Features**:
```java
@PreAuthorize("hasRole('PATIENT')")
@PostMapping("/book")
public ResponseEntity<?> bookAppointment(@Valid @RequestBody AppointmentBookingRequest request,
                                        @AuthenticationPrincipal UserPrincipal userPrincipal)
```

#### Doctor Controller (`DoctorController.java`)
**Purpose**: Doctor-specific operations and availability management

**Availability Management**:
```java
@PostMapping("/availability")
@PreAuthorize("hasRole('DOCTOR')")
public ResponseEntity<?> createAvailabilitySlot(@Valid @RequestBody DoctorAvailabilityRequest request,
                                               @AuthenticationPrincipal UserPrincipal userPrincipal)
```

#### Admin Controller (`AdminController.java`)
**Purpose**: Administrative operations with elevated privileges

**User Creation**:
```java
@PostMapping("/users")
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> createUserByAdmin(@Valid @RequestBody AdminCreateUserRequest request)
```

**Features**:
- **Unified User Creation**: Single endpoint for all user types
- **Role-based Lists**: Different user type retrievals
- **System Management**: Administrative oversight operations

---

## 🔄 Inter-Layer Communication Patterns

### Dependency Injection Flow
```
Configuration Layer → Service Layer → Repository Layer → Database
     ↑                    ↑               ↑
Controller Layer ←  Security Filter ←  JWT Utils
```

### Request Processing Flow

#### Typical HTTP Request Flow
1. **Client Request** → HTTP Request with JWT
2. **CORS Filter** → Cross-origin validation
3. **JWT Filter** → Token extraction and validation
4. **Security Context** → User authentication establishment
5. **Controller** → Endpoint routing and parameter binding
6. **Service Layer** → Business logic execution
7. **Repository Layer** → Database operations
8. **Response Formation** → JSON serialization
9. **Client Response** → HTTP response with data

### Transaction Management

#### Service Layer Transactions
```java
@Transactional // Class-level or method-level
@Transactional(readOnly = true) // For query operations
@Transactional(rollbackFor = Exception.class) // For critical operations
```

#### Cross-Service Communication
Services communicate through:
- **Direct Injection**: `@Autowired` dependencies
- **Interface Contracts**: Well-defined service interfaces
- **Event-driven**: Notification triggers from appointment changes

### Data Transformation Layers

#### DTO Pattern Implementation
```java
// Request DTOs
RegisterRequest → User Entity
AppointmentBookingRequest → Appointment Entity

// Response DTOs  
User Entity → UserProfileResponse
Notification Entity → NotificationDto
```

#### Repository to Service Communication
```java
Repository: List<Entity> findByMethod()
Service: Entity validation and business logic
Controller: Entity to DTO transformation
```

### Error Handling Flow
```
Service Layer Exception → Global Exception Handler → Formatted Error Response
Repository Exception → Service Exception Handling → Controller Error Response
Validation Errors → Bean Validation → Exception Handler → Client Error
```

### Security Integration Points

#### Authentication Flow
```
JWT Token → JWT Filter → Custom User Details Service → User Repository → Database
Security Context → Controller Method → @PreAuthorize → Role Validation
```

#### Session Management Integration
```
Login → Session Creation → JWT Token → Session Validation → Session Extension → Logout
```

### Notification System Integration

#### Cross-Service Notification Triggers
```java
// Appointment Service triggers notification
appointmentService.bookAppointment() → notificationSchedulingService.scheduleNotification()

// Doctor Service sends notification
doctorNotificationService.sendNotificationToPatients() → notificationService.createNotification()
```

### Database Connection Management

#### Connection Lifecycle
```
Spring Boot Application → HikariCP Connection Pool → Database Connection
Service @Transactional → Repository Operation → Connection Usage → Connection Return
```

#### Query Optimization Strategies
- **Eager Loading**: `@Query` with `JOIN FETCH`
- **Lazy Loading**: Default JPA behavior with careful initialization
- **Batch Processing**: Multiple entity operations in single transaction
- **Custom Queries**: Complex business logic in repository layer

---

## 🎯 System Integration Points

### Frontend-Backend Integration
```
React Frontend → Axios HTTP Client → Spring Boot REST API → Business Logic → Database
JWT Storage → API Headers → Security Filter → Authentication Context
```

### External System Integration Points
- **Email System**: (Configurable for notification delivery)
- **File Storage**: Base64 embedded image storage
- **Audit Systems**: Login activity and system monitoring
- **Session Management**: JWT-based with server-side validation

### Configuration Management
```
application.properties → Spring Configuration → Bean Creation → Dependency Injection
Environment Variables → Configuration Properties → Service Configuration
```

This architecture provides a robust, scalable, and maintainable system with clear separation of concerns, comprehensive security, and efficient data management patterns. Each layer has specific responsibilities and communicates through well-defined interfaces, ensuring system reliability and extensibility.
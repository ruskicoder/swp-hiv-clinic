# Phân tích luồng dữ liệu chính của HIV Clinic Booking System

## Tổng quan hệ thống

HIV Clinic Booking System là một ứng dụng web quản lý phòng khám HIV với kiến trúc microservice sử dụng:
- **Frontend**: React.js với Context API và hooks
- **Backend**: Spring Boot với RESTful API
- **Database**: Microsoft SQL Server
- **Security**: JWT-based authentication với Spring Security

## 1. Luồng Authentication & Authorization

### 1.1 Đăng nhập (Login Flow)

```mermaid
sequenceDiagram
    participant U as User
    participant L as Login.jsx
    participant AC as AuthContext.jsx
    participant AS as authService.js
    participant API as apiClient.js
    participant AuthC as AuthController.java
    participant AuthS as AuthService.java
    participant AM as AuthenticationManager
    participant UR as UserRepository
    participant JWT as JwtUtils.java
    participant USS as UserSessionService.java
    participant LAS as LoginActivityService.java
    participant DB as Database

    U->>L: Nhập username/password
    L->>L: validateForm()
    L->>AC: login(formData)
    AC->>AS: authService.login(credentials)
    AS->>API: POST /api/auth/login
    API->>AuthC: authenticateUser(@RequestBody LoginRequest)
    AuthC->>AuthC: Extract IP address & User-Agent
    AuthC->>AuthS: authenticateUser(loginRequest, ipAddress, userAgent)
    
    AuthS->>AM: authenticate(UsernamePasswordAuthenticationToken)
    AM->>UR: loadUserByUsername()
    UR->>DB: SELECT user WHERE username = ?
    DB-->>UR: User data
    UR-->>AM: UserPrincipal
    AM-->>AuthS: Authentication object
    
    AuthS->>JWT: generateJwtToken(userPrincipal)
    JWT-->>AuthS: JWT token
    
    AuthS->>LAS: logLoginAttempt(username, true, ip, userAgent)
    LAS->>DB: INSERT INTO LoginActivity
    
    AuthS->>USS: createSession(user, jwt, ip, userAgent)
    USS->>DB: INSERT INTO UserSession
    
    AuthS-->>AuthC: AuthResponse(success, token, userDTO)
    AuthC-->>API: ResponseEntity.ok(response)
    API-->>AS: HTTP 200 + response.data
    AS-->>AC: {success: true, token, userData}
    
    AC->>AC: sessionStorage.setItem('token', response.token)
    AC->>AC: setUser(initialUser)
    AC->>AS: getUserProfile() [async]
    AC->>AC: setIsFirstLogin(true)
    
    AC-->>L: {success: true}
    L->>L: Navigate to dashboard based on role
```

**Key Methods:**
- Frontend: `AuthContext.login()` → `authService.login()`
- Backend: `AuthController.authenticateUser()` → `AuthService.authenticateUser()`

**Database Operations:**
- Validate user credentials
- Log login activity
- Create user session
- Store JWT token mapping

### 1.2 Session Management & Monitoring

```mermaid
sequenceDiagram
    participant U as User
    participant USM as useSessionMonitor.js
    participant AC as AuthContext.jsx
    participant API as apiClient.js
    participant AuthC as AuthController.java
    participant USS as UserSessionService.java
    participant DB as Database

    U->>USM: User activity detected
    USM->>API: GET /api/auth/session/status
    API->>AuthC: checkSessionStatus()
    AuthC->>USS: isSessionValid(token)
    USS->>DB: SELECT session WHERE token = ?
    DB-->>USS: Session data
    USS-->>AuthC: session status
    AuthC-->>API: ResponseEntity
    API-->>USM: session status
    
    alt Session near expiry
        USM->>USM: show timeout modal
        U->>USM: extend session
        USM->>API: POST /api/auth/session/extend
        API->>AuthC: extendSession()
        AuthC->>USS: extendUserSession(token)
        USS->>DB: UPDATE UserSession SET expiryTime = ?
        USS-->>AuthC: extended session
    else Session expired
        USM->>AC: logout()
        AC->>API: POST /api/auth/logout
        API->>AuthC: logout()
        AuthC->>USS: invalidateUserSessions()
        USS->>DB: UPDATE UserSession SET isActive = false
    end
```

## 2. Luồng Appointment Management

### 2.1 Đặt lịch hẹn (Book Appointment)

```mermaid
sequenceDiagram
    participant P as Patient
    participant CD as CustomerDashboard.jsx
    participant UC as UnifiedCalendar.jsx
    participant API as apiClient.js
    participant AC as AppointmentController.java
    participant AS as AppointmentService.java
    participant UR as UserRepository
    participant ASR as AvailabilitySlotRepository
    parameter AR as AppointmentRepository
    participant NS as NotificationSchedulingService.java
    participant DB as Database

    P->>CD: Select doctor from list
    CD->>API: GET /api/doctors/available-slots?doctorId={id}
    API->>AC: getDoctorAvailableSlots()
    AC->>AS: getDoctorAvailableSlots(doctorId)
    AS->>ASR: findByDoctorUserAndIsBookedFalse()
    ASR->>DB: SELECT slots WHERE doctorId = ? AND isBooked = false
    DB-->>ASR: Available slots
    ASR-->>AS: List<DoctorAvailabilitySlot>
    AS-->>AC: Available slots
    AC-->>API: ResponseEntity.ok(slots)
    API-->>CD: available slots data
    
    CD->>UC: display calendar with available slots
    P->>UC: select date/time slot
    UC->>CD: booking request data
    CD->>API: POST /api/appointments/book
    API->>AC: bookAppointment(@RequestBody AppointmentBookingRequest)
    AC->>AS: bookAppointment(request, patientId)
    
    AS->>UR: validate patient exists
    AS->>UR: validate doctor exists
    AS->>ASR: validate slot availability
    AS->>ASR: findById(availabilitySlotId)
    AS->>AS: check for scheduling conflicts
    
    AS->>ASR: UPDATE slot SET isBooked = true
    AS->>AR: INSERT appointment
    AS->>DB: CREATE appointment record
    AS->>AS: createStatusHistory(appointment, "Scheduled")
    
    AS->>NS: scheduleAppointmentReminders(appointment)
    NS->>DB: INSERT reminder notifications
    
    AS-->>AC: MessageResponse.success()
    AC-->>API: ResponseEntity.ok()
    API-->>CD: booking success response
    CD->>CD: refresh appointments list
    CD->>CD: show success notification
```

**Key Validation Steps:**
1. Patient/Doctor role verification
2. Slot availability check
3. Time conflict detection
4. Business hours validation
5. Advance booking limits

### 2.2 Hủy lịch hẹn (Cancel Appointment)

```mermaid
sequenceDiagram
    participant P as Patient/Doctor
    participant CD as Dashboard
    participant API as apiClient.js
    participant AC as AppointmentController.java
    parameter AS as AppointmentService.java
    participant AR as AppointmentRepository
    participant ASR as AvailabilitySlotRepository
    participant AHS as AppointmentStatusHistory
    participant NS as NotificationService.java
    participant DB as Database

    P->>CD: Click cancel appointment
    CD->>CD: prompt for cancellation reason
    P->>CD: provide reason
    CD->>API: PUT /api/appointments/{id}/cancel?reason={reason}
    API->>AC: cancelAppointment(appointmentId, reason, userId)
    AC->>AS: cancelAppointment(appointmentId, userId, reason)
    
    AS->>AR: findById(appointmentId)
    AS->>AS: validate user permission
    AS->>AS: validate cancellation rules
    
    AS->>AR: UPDATE appointment SET status = 'Cancelled'
    AS->>AHS: INSERT status change history
    AS->>ASR: UPDATE slot SET isBooked = false
    AS->>NS: sendCancellationNotification()
    
    AS-->>AC: MessageResponse.success()
    AC-->>API: ResponseEntity.ok()
    API-->>CD: cancellation success
    CD->>CD: refresh appointments
    CD->>CD: show confirmation message
```

### 2.3 Quản lý lịch trình bác sĩ (Doctor Schedule Management)

```mermaid
sequenceDiagram
    participant D as Doctor
    participant DD as DoctorDashboard.jsx
    participant WS as WeeklySchedule.jsx
    participant API as apiClient.js
    participant DC as DoctorController.java
    participant DAS as DoctorAvailabilityService.java
    participant ASR as AvailabilitySlotRepository
    participant DB as Database

    D->>DD: Navigate to schedule management
    DD->>API: GET /api/doctors/my-availability
    API->>DC: getMyAvailability()
    DC->>DAS: getDoctorAvailability(doctorId)
    DAS->>ASR: findByDoctorUserOrderBySlotDateAsc()
    ASR->>DB: SELECT slots WHERE doctorId = ?
    DB-->>ASR: Current schedule
    ASR-->>DAS: List<DoctorAvailabilitySlot>
    DAS-->>DC: Schedule data
    DC-->>API: ResponseEntity.ok(schedule)
    API-->>DD: current availability
    
    DD->>WS: display weekly schedule
    D->>WS: modify time slots (add/edit/delete)
    WS->>DD: schedule changes
    DD->>API: POST /api/doctors/availability/bulk-update
    API->>DC: bulkUpdateAvailability()
    DC->>DAS: updateDoctorAvailability(doctorId, slots)
    
    DAS->>DAS: validate business hours (8AM-6PM)
    DAS->>DAS: check for overlapping slots
    DAS->>DAS: ensure minimum duration (15 min)
    
    DAS->>ASR: save/update availability slots
    ASR->>DB: INSERT/UPDATE availability slots
    
    DAS-->>DC: MessageResponse.success()
    DC-->>API: ResponseEntity.ok()
    API-->>DD: update success
    DD->>DD: refresh schedule display
```

## 3. Luồng Patient Record Management

### 3.1 Xem hồ sơ bệnh án (View Medical Record)

```mermaid
sequenceDiagram
    participant P as Patient
    participant CD as CustomerDashboard.jsx
    participant PRS as PatientRecordSection.jsx
    participant API as apiClient.js
    participant PRC as PatientRecordController.java
    participant PRCS as PatientRecordService.java
    participant PRR as PatientRecordRepository
    participant UR as UserRepository
    participant DB as Database

    P->>CD: Click medical record tab
    CD->>PRS: render patient record section
    PRS->>API: GET /api/patient-records/my-record
    API->>PRC: getMyRecord(@AuthenticationPrincipal UserPrincipal)
    PRC->>PRCS: getPatientRecordAsMap(userId)
    
    PRCS->>PRR: findByPatientUserID(userId)
    PRR->>DB: SELECT record WHERE patientUserId = ?
    
    alt Record exists
        DB-->>PRR: Patient record data
        PRR-->>PRCS: PatientRecord
        PRCS->>PRCS: mapRecordToResponse(record)
        PRCS->>UR: findById(userId) [for patient details]
        UR->>DB: SELECT user WHERE id = ?
        DB-->>UR: User data
        UR-->>PRCS: User details
    else No record exists
        PRCS->>PRR: save(new PatientRecord)
        PRR->>DB: INSERT new empty record
        DB-->>PRR: Created record
        PRR-->>PRCS: New PatientRecord
    end
    
    PRCS-->>PRC: Map<String, Object> record data
    PRC-->>API: ResponseEntity.ok(record)
    API-->>PRS: record data
    PRS->>PRS: populate form fields
    PRS->>PRS: display medical information
```

### 3.2 Cập nhật hồ sơ bệnh án (Update Medical Record)

```mermaid
sequenceDiagram
    participant P as Patient
    participant PRS as PatientRecordSection.jsx
    participant API as apiClient.js
    participant PRC as PatientRecordController.java
    participant PRCS as PatientRecordService.java
    participant PRR as PatientRecordRepository
    participant DB as Database

    P->>PRS: Edit record fields (medical history, allergies, etc.)
    PRS->>PRS: validate input data
    PRS->>API: PUT /api/patient-records/my-record
    API->>PRC: updateMyRecord(@RequestBody Map<String, Object>)
    PRC->>PRCS: updatePatientRecordWithResponse(userId, recordData)
    
    PRCS->>PRR: findByPatientUserID(userId)
    PRR->>DB: SELECT record WHERE patientUserId = ?
    
    alt Record exists
        DB-->>PRR: Existing record
        PRR-->>PRCS: PatientRecord
        PRCS->>PRCS: update record fields
    else No record exists
        PRCS->>PRCS: create new PatientRecord
    end
    
    PRCS->>PRCS: setMedicalHistory(), setAllergies(), etc.
    PRCS->>PRR: save(updatedRecord)
    PRR->>DB: UPDATE PatientRecords SET ... WHERE id = ?
    DB-->>PRR: Update confirmation
    PRR-->>PRCS: Saved record
    
    PRCS-->>PRC: MessageResponse.success()
    PRC-->>API: ResponseEntity.ok()
    API-->>PRS: update success
    PRS->>PRS: show success message
    PRS->>PRS: refresh display
```

**Updateable Fields:**
- Medical History
- Known Allergies  
- Current Medications
- Clinical Notes
- Blood Type
- Emergency Contact Info
- Profile Image (Base64)

### 3.3 Truy cập hồ sơ bệnh nhân (Doctor Access to Patient Records)

```mermaid
sequenceDiagram
    participant D as Doctor
    participant DD as DoctorDashboard.jsx
    participant API as apiClient.js
    participant PRC as PatientRecordController.java
    participant PRCS as PatientRecordService.java
    participant AR as AppointmentRepository
    participant PPS as PatientPrivacyService.java
    participant DB as Database

    D->>DD: Select patient appointment
    DD->>API: GET /api/patient-records/appointment/{appointmentId}
    API->>PRC: getPatientRecordByAppointment(appointmentId, doctorId)
    PRC->>PRCS: getPatientRecordForAppointment(appointmentId, doctorId)
    
    PRCS->>AR: findByIdWithPatient(appointmentId)
    AR->>DB: SELECT appointment WITH patient details
    DB-->>AR: Appointment + Patient data
    AR-->>PRCS: Appointment object
    
    PRCS->>PRCS: validate doctor has access to appointment
    PRCS->>PPS: getPrivacySettings(patientId)
    PPS->>DB: SELECT privacy settings
    DB-->>PPS: Privacy status
    PPS-->>PRCS: isPrivate boolean
    
    alt Patient privacy enabled
        PRCS->>PRCS: mask sensitive information
        PRCS-->>PRC: Limited record data
    else Full access allowed
        PRCS->>PRCS: return complete record
        PRCS-->>PRC: Complete record data
    end
    
    PRC-->>API: ResponseEntity.ok(recordData)
    API-->>DD: patient record
    DD->>DD: display patient information
    DD->>DD: enable record editing (if permitted)
```

## 4. Luồng Notification System

### 4.1 Gửi thông báo (Send Notification)

```mermaid
sequenceDiagram
    participant D as Doctor
    participant NMD as NotificationManagementDashboard.jsx
    participant NSM as NotificationSendModal.jsx
    participant API as apiClient.js
    participant NC as NotificationController.java
    participant DNS as DoctorNotificationService.java
    participant NTS as NotificationTemplateService.java
    participant NR as NotificationRepository
    participant DB as Database

    D->>NMD: Click send notification
    NMD->>NSM: open send modal
    NSM->>API: GET /v1/notifications/templates
    API->>NC: getAllTemplates()
    NC->>NTS: getAllActiveTemplates()
    NTS->>DB: SELECT templates WHERE isActive = true
    DB-->>NTS: Template list
    NTS-->>NC: Templates
    NC-->>API: ResponseEntity.ok(templates)
    API-->>NSM: template options
    
    NSM->>API: GET /v1/notifications/doctor/patients-with-appointments
    API->>NC: getPatientsWithAppointments(doctorId)
    NC->>DNS: getPatientsWithAppointments(doctorId)
    DNS->>DB: SELECT patients WITH appointments
    DB-->>DNS: Patient list
    DNS-->>NC: Patients data
    NC-->>API: ResponseEntity.ok(patients)
    API-->>NSM: patient options
    
    D->>NSM: select patients + template + custom message
    NSM->>API: POST /v1/notifications/doctor/send
    API->>NC: sendNotificationToPatient()
    NC->>DNS: sendNotificationToPatient(doctorId, patientId, templateId, variables)
    
    DNS->>DNS: validate doctor-patient relationship
    DNS->>NTS: getTemplateById(templateId)
    DNS->>DNS: processTemplate(template, variables)
    
    DNS->>NR: save(notification)
    NR->>DB: INSERT notification
    DB-->>NR: Created notification
    NR-->>DNS: Notification object
    
    DNS-->>NC: Success response
    NC-->>API: ResponseEntity.ok()
    API-->>NSM: send success
    NSM->>NSM: close modal
    NMD->>NMD: refresh notification history
```

### 4.2 Lấy thông báo người dùng (Get User Notifications)

```mermaid
sequenceDiagram
    participant U as User
    participant NI as NotificationIcon.jsx
    participant NS as notificationService.js
    participant API as apiClient.js
    participant NC as NotificationController.java
    participant NSS as NotificationService.java
    participant NR as NotificationRepository
    participant DB as Database

    U->>NI: Component mounts
    NI->>NS: startPolling()
    NS->>NS: _startPolling() [every 30 seconds]
    
    loop Polling cycle
        NS->>API: GET /v1/notifications?status=unread
        API->>NC: getNotifications(status="unread")
        NC->>NSS: getUnreadNotificationsByUserId(userId)
        
        NSS->>NR: findByUserIdAndIsReadExcludingCancelled(userId, false)
        NR->>DB: SELECT notifications WHERE userId = ? AND isRead = false AND status != 'CANCELLED'
        DB-->>NR: Unread notifications
        NR-->>NSS: List<Notification>
        
        NSS->>NSS: filter out cancelled notifications
        NSS->>NSS: convert to DTOs
        NSS-->>NC: List<NotificationDto>
        NC-->>API: ResponseEntity.ok(notifications)
        API-->>NS: notification data
        
        NS->>NS: _filterNewNotifications()
        alt New notifications found
            NS->>NS: update internal state
            NS->>NI: callback with new notifications
            NI->>NI: update notification badge count
            NI->>NI: show notification indicators
        end
    end
    
    U->>NI: Click notification
    NI->>API: POST /v1/notifications/{id}/read
    API->>NC: markAsRead(notificationId)
    NC->>NSS: markAsRead(notificationId, userId)
    NSS->>NR: update notification set isRead = true
    NR->>DB: UPDATE notifications SET isRead = true WHERE id = ?
    DB-->>NR: Update confirmation
    NR-->>NSS: Updated notification
    NSS-->>NC: NotificationDto
    NC-->>API: ResponseEntity.ok()
    API-->>NI: mark read success
```

### 4.3 Quản lý lịch sử thông báo (Notification History Management)

```mermaid
sequenceDiagram
    participant D as Doctor
    participant NMD as NotificationManagementDashboard.jsx
    participant NHT as NotificationHistoryTable.jsx
    participant API as apiClient.js
    participant NC as NotificationController.java
    participant DNS as DoctorNotificationService.java
    participant NR as NotificationRepository
    participant DB as Database

    D->>NMD: View notification history
    NMD->>API: GET /v1/notifications/doctor/history?doctorId={id}
    API->>NC: getNotificationHistoryForDoctor(doctorId)
    NC->>DNS: getNotificationHistoryForDoctor(doctorId)
    
    DNS->>NR: findAll()
    NR->>DB: SELECT all notifications
    DB-->>NR: All notifications
    NR-->>DNS: List<Notification>
    
    DNS->>DNS: filter for doctor's patients only
    DNS->>DNS: build notification history with patient info
    DNS-->>NC: List<Map<String, Object>>
    NC-->>API: ResponseEntity.ok(history)
    API-->>NMD: notification history
    
    NMD->>NHT: render history table
    NHT->>NHT: display notifications with:
    Note right of NHT: - Patient name<br/>- Notification title<br/>- Status (SENT/PENDING/CANCELLED)<br/>- Send time<br/>- Actions (Cancel if pending)
    
    alt Doctor cancels notification
        D->>NHT: Click cancel on pending notification
        NHT->>API: POST /v1/notifications/doctor/{id}/unsend
        API->>NC: unsendNotification(notificationId, doctorId)
        NC->>DNS: unsendNotification(notificationId, doctorId)
        
        DNS->>NR: findById(notificationId)
        DNS->>DNS: validate notification not yet sent
        DNS->>NR: update(notification) [set status = 'CANCELLED']
        NR->>DB: UPDATE notifications SET status = 'CANCELLED'
        
        DNS-->>NC: Success response
        NC-->>API: ResponseEntity.ok()
        API-->>NHT: cancel success
        NHT->>NMD: refresh history
    end
```

## 5. Luồng ARV Treatment Management

### 5.1 Tạo phác đồ điều trị ARV (Create ARV Treatment)

```mermaid
sequenceDiagram
    participant D as Doctor
    participant DD as DoctorDashboard.jsx
    participant ATM as ARVTreatmentModal.jsx
    participant API as apiClient.js
    participant ATC as ARVTreatmentController.java
    participant ATS as ARVTreatmentService.java
    participant ATVR as ARVTreatmentRepository
    participant MRR as MedicationRoutineRepository
    participant NSS as NotificationSchedulingService.java
    participant DB as Database

    D->>DD: Select patient for ARV treatment
    DD->>ATM: open treatment modal
    D->>ATM: fill treatment form (regimen, dosage, schedule)
    ATM->>API: POST /api/arv-treatments/add
    API->>ATC: addTreatment(@RequestBody treatmentData, doctorId)
    ATC->>ATS: createARVTreatment(request, doctorId)
    
    ATS->>ATS: validate doctor-patient relationship
    ATS->>ATS: validate treatment data
    
    ATS->>ATVR: save(new ARVTreatment)
    ATVR->>DB: INSERT ARV treatment record
    DB-->>ATVR: Created treatment
    ATVR-->>ATS: ARVTreatment object
    
    ATS->>MRR: save(new MedicationRoutine)
    MRR->>DB: INSERT medication routines
    DB-->>MRR: Created routines
    MRR-->>ATS: MedicationRoutine objects
    
    ATS->>NSS: scheduleRecurringMedicationReminders(routines)
    NSS->>DB: INSERT scheduled notifications
    
    ATS-->>ATC: MessageResponse.success()
    ATC-->>API: ResponseEntity.ok()
    API-->>ATM: creation success
    ATM->>ATM: close modal
    DD->>DD: refresh treatment list
```

### 5.2 Theo dõi tuân thủ điều trị (Treatment Adherence Monitoring)

```mermaid
sequenceDiagram
    participant P as Patient
    participant CD as CustomerDashboard.jsx
    participant API as apiClient.js
    participant ATC as ARVTreatmentController.java
    participant ATS as ARVTreatmentService.java
    participant ATVR as ARVTreatmentRepository
    participant MRR as MedicationRoutineRepository
    participant DB as Database

    P->>CD: View ARV treatments section
    CD->>API: GET /api/arv-treatments/my-treatments
    API->>ATC: getMyTreatments(patientId)
    ATC->>ATS: getPatientTreatments(patientId)
    
    ATS->>ATVR: findByPatientUserOrderByStartDateDesc(patient)
    ATVR->>DB: SELECT treatments WHERE patientId = ?
    DB-->>ATVR: Treatment records
    ATVR-->>ATS: List<ARVTreatment>
    
    ATS->>MRR: findByTreatmentId(treatmentIds)
    MRR->>DB: SELECT routines WHERE treatmentId IN (?)
    DB-->>MRR: Medication routines
    MRR-->>ATS: List<MedicationRoutine>
    
    ATS->>ATS: calculate adherence statistics
    ATS->>ATS: prepare treatment summary
    ATS-->>ATC: Treatment data with adherence info
    ATC-->>API: ResponseEntity.ok(treatments)
    API-->>CD: treatment data
    CD->>CD: display adherence charts and medication schedules
```

## 6. Luồng User Management (Admin)

### 6.1 Tạo tài khoản người dùng (Create User Account)

```mermaid
sequenceDiagram
    participant A as Admin
    participant AD as AdminDashboard.jsx
    participant CUF as CreateUserForm.jsx
    participant API as apiClient.js
    participant AC as AdminController.java
    participant AS as AdminService.java
    participant UR as UserRepository
    participant RR as RoleRepository
    participant PE as PasswordEncoder
    participant DB as Database

    A->>AD: Navigate to user management
    AD->>CUF: render create user form
    CUF->>API: GET /api/admin/roles
    API->>AC: getAllRoles()
    AC->>RR: findAll()
    RR->>DB: SELECT roles
    DB-->>RR: Available roles
    RR-->>AC: List<Role>
    AC-->>API: ResponseEntity.ok(roles)
    API-->>CUF: role options
    
    A->>CUF: fill user form (username, email, role, etc.)
    CUF->>API: POST /api/admin/users
    API->>AC: createUserByAdmin(@RequestBody AdminCreateUserRequest)
    AC->>AS: createUserAccount(request)
    
    AS->>UR: existsByUsername(username)
    AS->>UR: existsByEmail(email)
    AS->>AS: validate unique constraints
    
    AS->>PE: encode(password)
    PE-->>AS: Encoded password hash
    
    AS->>UR: save(new User)
    UR->>DB: INSERT user record
    DB-->>UR: Created user
    UR-->>AS: User object
    
    alt Role is DOCTOR
        AS->>AS: createDoctorProfile(user)
        AS->>DB: INSERT doctor profile
    else Role is PATIENT  
        AS->>AS: createPatientProfile(user)
        AS->>DB: INSERT patient profile
    end
    
    AS-->>AC: MessageResponse.success()
    AC-->>API: ResponseEntity.ok()
    API-->>CUF: creation success
    CUF->>AD: refresh user list
```

### 6.2 Quản lý danh sách người dùng (User List Management)

```mermaid
sequenceDiagram
    participant A as Admin
    participant AD as AdminDashboard.jsx
    participant PT as PaginatedTable.jsx
    participant API as apiClient.js
    participant AC as AdminController.java
    participant AS as AdminService.java
    participant UR as UserRepository
    participant DB as Database

    A->>AD: View users section
    AD->>API: GET /api/admin/users
    API->>AC: getAllUsers()
    AC->>AS: getAllUsersWithProfiles()
    
    AS->>UR: findAllWithRoles()
    UR->>DB: SELECT users WITH roles
    DB-->>UR: User data with roles
    UR-->>AS: List<User>
    
    AS->>AS: attachProfileData(users)
    AS->>DB: JOIN with PatientProfiles, DoctorProfiles
    DB-->>AS: Enhanced user data
    
    AS-->>AC: List<UserDTO>
    AC-->>API: ResponseEntity.ok(users)
    API-->>AD: user list data
    
    AD->>PT: render paginated table
    PT->>PT: display users with:
    Note right of PT: - Username/Email<br/>- Full Name<br/>- Role<br/>- Status<br/>- Actions
    
    A->>PT: Search/filter users
    PT->>AD: filter criteria
    AD->>API: GET /api/admin/users?search={term}&role={role}
    API->>AC: searchUsers(criteria)
    AC->>AS: searchUsersWithCriteria(criteria)
    AS->>DB: SELECT users WHERE conditions
    DB-->>AS: Filtered results
    AS-->>AC: Filtered user list
    AC-->>API: ResponseEntity.ok()
    API-->>PT: updated user list
```

## 7. Luồng Data Export (Manager)

### 7.1 Xuất báo cáo CSV (CSV Export)

```mermaid
sequenceDiagram
    participant M as Manager
    participant MD as ManagerDashboard.jsx
    participant API as apiClient.js
    participant EC as ExportController.java
    participant MS as ManagerService.java
    participant Repos as Various Repositories
    participant DB as Database

    M->>MD: Click export button (patients/doctors/appointments)
    MD->>API: GET /api/export/{entityType}
    API->>EC: export{EntityType}()
    EC->>MS: generate{EntityType}CSV()
    
    MS->>Repos: findAll{EntityType}WithDetails()
    Repos->>DB: SELECT entity data WITH related info
    DB-->>Repos: Complete entity records
    Repos-->>MS: List<Entity>
    
    MS->>MS: buildCSVHeader()
    MS->>MS: convertToCSVRows(entities)
    MS->>MS: formatCSVContent()
    MS-->>EC: CSV string content
    
    EC->>EC: createCSVResponse(csv, filename)
    EC-->>API: ResponseEntity with CSV file
    API-->>MD: File download response
    MD->>MD: trigger browser download
```

## 8. Common Patterns và Best Practices

### 8.1 Frontend Patterns

#### State Management
```javascript
// Context + Reducer pattern
const AuthContext = createContext();
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);

// Custom hooks for reusable logic
const useAuth = () => useContext(AuthContext);
const useSessionMonitor = (isAuthenticated, logout) => {
  // Session monitoring logic
};
```

#### API Integration
```javascript
// Centralized API client với interceptors
const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  timeout: 30000
});

// Request interceptor cho JWT
apiClient.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor cho error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### Form Validation
```javascript
const validateForm = () => {
  const errors = {};
  
  if (!formData.username) errors.username = 'Username is required';
  if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Valid email is required';
  }
  
  setValidationErrors(errors);
  return Object.keys(errors).length === 0;
};
```

### 8.2 Backend Patterns

#### Controller Layer
```java
@RestController
@RequestMapping("/api/entity")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasRole('ROLE')")
public class EntityController {
    
    @Autowired
    private EntityService entityService;
    
    @PostMapping("/create")
    public ResponseEntity<?> createEntity(
            @Valid @RequestBody EntityRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            MessageResponse response = entityService.createEntity(request, userPrincipal.getId());
            return response.isSuccess() 
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Error creating entity: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse.error("Failed to create entity"));
        }
    }
}
```

#### Service Layer
```java
@Service
@Transactional
public class EntityService {
    
    @Autowired
    private EntityRepository entityRepository;
    
    public MessageResponse createEntity(EntityRequest request, Integer userId) {
        try {
            // Validation
            validateRequest(request);
            
            // Business logic
            Entity entity = new Entity();
            mapRequestToEntity(request, entity);
            
            // Save
            Entity savedEntity = entityRepository.save(entity);
            
            // Post-processing
            handlePostCreation(savedEntity);
            
            logger.info("Entity created successfully: {}", savedEntity.getId());
            return MessageResponse.success("Entity created successfully");
            
        } catch (Exception e) {
            logger.error("Error creating entity: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to create entity: " + e.getMessage());
        }
    }
}
```

#### Security Configuration
```java
// JWT-based authentication
@PreAuthorize("hasRole('PATIENT')")
@PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")

// Role-based access control
if (!hasPermission(userPrincipal.getId(), resourceId)) {
    throw new SecurityException("Access denied");
}
```

### 8.3 Data Flow Security

#### Privacy Controls
```java
// Patient privacy filtering
if (patientPrivacyService.isPrivate(patientId)) {
    record.setEmergencyContact("Private");
    record.setEmergencyPhone("Private");
    record.setProfileImage(null);
}
```

#### Audit Logging
```java
// Activity logging
loginActivityService.logLoginAttempt(username, success, ipAddress, userAgent);

// Status change tracking
createStatusHistory(appointment, oldStatus, newStatus, reason, user);
```

#### Session Management
```java
// Session validation
public boolean isSessionValid(String token) {
    Optional<UserSession> session = userSessionRepository.findBySessionToken(token);
    return session.isPresent() && 
           session.get().getIsActive() && 
           session.get().getExpiryTime().isAfter(LocalDateTime.now());
}
```

### 8.4 Error Handling Patterns

#### Frontend Error Boundaries
```javascript
try {
  const response = await apiCall();
  if (response.success) {
    // Handle success
  } else {
    setError(response.message || 'Operation failed');
  }
} catch (error) {
  console.error('API Error:', error);
  setError(error.response?.data?.message || 'Network error occurred');
}
```

#### Backend Exception Handling
```java
try {
    // Business logic
    return processRequest(request);
} catch (ValidationException e) {
    logger.warn("Validation error: {}", e.getMessage());
    return ResponseEntity.badRequest().body(MessageResponse.error(e.getMessage()));
} catch (SecurityException e) {
    logger.error("Security violation: {}", e.getMessage());
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(MessageResponse.error("Access denied"));
} catch (Exception e) {
    logger.error("Unexpected error: {}", e.getMessage(), e);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(MessageResponse.error("Internal server error"));
}
```

## 9. Performance Optimization

### 9.1 Database Optimization
- **Lazy Loading**: `@ManyToOne(fetch = FetchType.LAZY)`
- **Query Optimization**: Custom repository methods với JPQL
- **Index Usage**: Database indexes cho frequent queries
- **Connection Pooling**: HikariCP configuration

### 9.2 Frontend Optimization  
- **Code Splitting**: Dynamic imports cho large components
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: Cho large data lists
- **Debounced Search**: Reduce API calls

### 9.3 API Optimization
- **Pagination**: Limit results với Pageable
- **Field Selection**: Chỉ return required fields
- **Caching**: Redis cho frequently accessed data
- **Compression**: GZIP response compression

## 10. Monitoring và Analytics

### 10.1 Application Metrics
- Response times cho mỗi endpoint
- Error rates và exception tracking  
- User activity patterns
- Database query performance

### 10.2 Business Metrics
- Appointment booking rates
- Treatment adherence statistics
- User engagement metrics
- System usage analytics

Hệ thống HIV Clinic được thiết kế theo kiến trúc microservice với clear separation of concerns, robust security measures, và comprehensive audit trails để đảm bảo data integrity và patient privacy.

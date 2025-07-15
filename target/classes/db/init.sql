-- Create database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'hiv_clinic')
BEGIN
    CREATE DATABASE hiv_clinic;
END
GO

USE hiv_clinic;
GO

-- Create tables if not exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Roles' AND xtype='U')
CREATE TABLE Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,    Username NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    FirstName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    Specialty NVARCHAR(255) NULL,
    RoleID INT NOT NULL FOREIGN KEY REFERENCES Roles(RoleID),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Specialties' AND xtype='U')
CREATE TABLE Specialties (
    SpecialtyID INT IDENTITY(1,1) PRIMARY KEY,
    SpecialtyName NVARCHAR(255) NOT NULL UNIQUE,
    Description NVARCHAR(MAX),
    IsActive BIT DEFAULT 1
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DoctorProfiles' AND xtype='U')
CREATE TABLE DoctorProfiles (
    DoctorProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    SpecialtyID INT FOREIGN KEY REFERENCES Specialties(SpecialtyID),
    PhoneNumber NVARCHAR(20),
    Bio NVARCHAR(MAX),
    Gender NVARCHAR(10),
    ProfileImageBase64 NVARCHAR(MAX)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PatientProfiles' AND xtype='U')
CREATE TABLE PatientProfiles (
    PatientProfileID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES Users(UserID),
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE,
    PhoneNumber NVARCHAR(20),
    Address NVARCHAR(MAX),
    Gender NVARCHAR(10),
    ProfileImageBase64 NVARCHAR(MAX),
    IsPrivate BIT NOT NULL DEFAULT 0
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DoctorAvailabilitySlots' AND xtype='U')
CREATE TABLE DoctorAvailabilitySlots (
    AvailabilitySlotID INT IDENTITY(1,1) PRIMARY KEY,
    DoctorUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    SlotDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsBooked BIT DEFAULT 0,
    Notes NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT UQ_DoctorSlot UNIQUE (DoctorUserID, SlotDate, StartTime)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' AND xtype='U')
CREATE TABLE Appointments (
    AppointmentID INT IDENTITY(1,1) PRIMARY KEY,
    PatientUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    DoctorUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    AvailabilitySlotID INT FOREIGN KEY REFERENCES DoctorAvailabilitySlots(AvailabilitySlotID),
    AppointmentDateTime DATETIME2 NOT NULL,
    DurationMinutes INT DEFAULT 30,
    Status VARCHAR(50) DEFAULT 'Scheduled',
    PatientCancellationReason NVARCHAR(MAX),
    DoctorCancellationReason NVARCHAR(MAX),
    AppointmentNotes NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemSettings' AND xtype='U')
CREATE TABLE SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue NVARCHAR(MAX) NOT NULL,
    Description NVARCHAR(MAX),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedByUserID INT FOREIGN KEY REFERENCES Users(UserID)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PasswordResetTokens' AND xtype='U')
CREATE TABLE PasswordResetTokens (
    TokenID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    Token NVARCHAR(255) NOT NULL UNIQUE,
    ExpiryDateTime DATETIME2 NOT NULL,
    IsUsed BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AppointmentStatusHistory' AND xtype='U')
CREATE TABLE AppointmentStatusHistory (
    StatusHistoryID INT IDENTITY(1,1) PRIMARY KEY,
    AppointmentID INT NOT NULL FOREIGN KEY REFERENCES Appointments(AppointmentID),
    OldStatus NVARCHAR(50),
    NewStatus NVARCHAR(50) NOT NULL,
    ChangeReason NVARCHAR(MAX),
    ChangedAt DATETIME2 DEFAULT GETDATE(),
    ChangedByUserID INT FOREIGN KEY REFERENCES Users(UserID)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LoginActivity' AND xtype='U')
CREATE TABLE LoginActivity (
    LogID BIGINT IDENTITY(1,1) PRIMARY KEY,
    UserID INT FOREIGN KEY REFERENCES Users(UserID),
    UsernameAttempted NVARCHAR(255) NOT NULL,
    AttemptTime DATETIME2 DEFAULT GETDATE(),
    IsSuccess BIT NOT NULL,
    IPAddress NVARCHAR(45),
    UserAgent NVARCHAR(MAX)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PatientRecords' AND xtype='U')
CREATE TABLE PatientRecords (
    RecordID INT IDENTITY(1,1) PRIMARY KEY,
    PatientUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    MedicalHistory NVARCHAR(MAX),
    Allergies NVARCHAR(MAX), 
    CurrentMedications NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    BloodType NVARCHAR(10),
    EmergencyContact NVARCHAR(255),
    EmergencyPhone NVARCHAR(20),
    ProfileImageBase64 NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    INDEX IX_PatientRecords_PatientUserID (PatientUserID)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ARVTreatments' AND xtype='U')
CREATE TABLE ARVTreatments (
    ARVTreatmentID INT IDENTITY(1,1) PRIMARY KEY,
    PatientUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    DoctorUserID INT FOREIGN KEY REFERENCES Users(UserID),
    AppointmentID INT FOREIGN KEY REFERENCES Appointments(AppointmentID),
    Regimen NVARCHAR(255) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    Adherence NVARCHAR(255),
    SideEffects NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);



-- Notifications Table: Stores all types of notifications
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
CREATE TABLE Notifications (
    NotificationID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- 'APPOINTMENT_REMINDER', 'MEDICATION_REMINDER', 'SYSTEM_NOTIFICATION'
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    IsRead BIT DEFAULT 0,
    Priority NVARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH'
    RelatedEntityID INT NULL, -- Could be AppointmentID, MedicationRoutineID, etc.
    RelatedEntityType NVARCHAR(50) NULL, -- 'APPOINTMENT', 'MEDICATION', 'SYSTEM'
    ScheduledFor DATETIME2 NULL, -- When the notification should be sent
    SentAt DATETIME2 NULL, -- When the notification was actually sent
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT CHK_NotificationType CHECK (Type IN ('APPOINTMENT_REMINDER', 'MEDICATION_REMINDER', 'GENERAL_ALERT', 'SYSTEM_NOTIFICATION'))
);

-- MedicationRoutines Table: Defines daily medication schedules for patients
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MedicationRoutines' AND xtype='U')
CREATE TABLE MedicationRoutines (
    RoutineID INT PRIMARY KEY IDENTITY(1,1),
    PatientUserID INT NOT NULL,
    DoctorUserID INT NOT NULL,
    ARVTreatmentID INT NULL,
    MedicationName NVARCHAR(255) NOT NULL,
    Dosage NVARCHAR(100) NOT NULL,
    Instructions NVARCHAR(MAX) NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NULL,
    TimeOfDay TIME NOT NULL, -- When to take the medication daily
    IsActive BIT DEFAULT 1,
    ReminderEnabled BIT DEFAULT 1,
    ReminderMinutesBefore INT DEFAULT 30, -- Minutes before medication time to send reminder
    LastReminderSentAt DATETIME2 NULL, -- Tracks when the last reminder was sent for this routine
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientUserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (DoctorUserID) REFERENCES Users(UserID) ON DELETE NO ACTION,
    FOREIGN KEY (ARVTreatmentID) REFERENCES ARVTreatments(ARVTreatmentID) ON DELETE SET NULL
);

-- MedicationReminders Table: Tracks individual medication reminder instances
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='MedicationReminders' AND xtype='U')
CREATE TABLE MedicationReminders (
    ReminderID INT PRIMARY KEY IDENTITY(1,1),
    RoutineID INT NOT NULL,
    PatientUserID INT NOT NULL,
    ReminderDate DATE NOT NULL,
    ReminderTime TIME NOT NULL,
    Status NVARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'ACKNOWLEDGED', 'MISSED'
    SentAt DATETIME2 NULL,
    AcknowledgedAt DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (RoutineID) REFERENCES MedicationRoutines(RoutineID) ON DELETE CASCADE,
    FOREIGN KEY (PatientUserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- AppointmentReminders Table: Tracks appointment reminder instances
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AppointmentReminders' AND xtype='U')
CREATE TABLE AppointmentReminders (
    ReminderID INT PRIMARY KEY IDENTITY(1,1),
    AppointmentID INT NOT NULL,
    PatientUserID INT NOT NULL,
    ReminderType NVARCHAR(50) NOT NULL, -- '24_HOUR', '1_HOUR', '30_MINUTE'
    ReminderDateTime DATETIME2 NOT NULL,
    Status NVARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'ACKNOWLEDGED'
    SentAt DATETIME2 NULL,
    AcknowledgedAt DATETIME2 NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE CASCADE,
    FOREIGN KEY (PatientUserID) REFERENCES Users(UserID) ON DELETE CASCADE
);
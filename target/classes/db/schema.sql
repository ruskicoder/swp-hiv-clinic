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
    ProfileImageBase64 NVARCHAR(MAX),
    IsPrivate BIT NOT NULL DEFAULT 0,
    PreferredChannel NVARCHAR(20) DEFAULT 'In-App',
    CONSTRAINT CHK_PreferredChannel CHECK (PreferredChannel IN ('In-App', 'SMS', 'Email'))
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



-- Drop deprecated notification tables
IF EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
    DROP TABLE Notifications;
GO
IF EXISTS (SELECT * FROM sysobjects WHERE name='NotificationTemplates' AND xtype='U')
    DROP TABLE NotificationTemplates;
GO

-- Doctor-facing notifications table
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    DoctorUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE CASCADE,
    PatientUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID) ON DELETE NO ACTION,
    AppointmentID INT NULL FOREIGN KEY REFERENCES Appointments(AppointmentID) ON DELETE SET NULL,
    MedicationRoutineID INT NULL FOREIGN KEY REFERENCES MedicationRoutines(RoutineID) ON DELETE SET NULL,
    Type NVARCHAR(50) NOT NULL,
    Status NVARCHAR(20) NOT NULL DEFAULT 'Sent',
    Message NVARCHAR(MAX) NOT NULL,
    Payload NVARCHAR(MAX) NULL, -- JSON for action-specific data
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    DeliveredAt DATETIME2 NULL,
    SeenAt DATETIME2 NULL,
    ReadAt DATETIME2 NULL,
    RetractedAt DATETIME2 NULL,
    RetractionReason NVARCHAR(MAX) NULL, -- Reason why notification was retracted
    FailureReason NVARCHAR(MAX) NULL,
    CONSTRAINT CHK_NotificationType_V2 CHECK (Type IN ('APPOINTMENT_REMINDER', 'FOLLOW_UP_REQUIRED', 'TEST_RESULTS_AVAILABLE', 'MEDICATION_REMINDER', 'CUSTOM')),
    CONSTRAINT CHK_NotificationStatus_V2 CHECK (Status IN ('Sent', 'Delivered', 'Failed', 'Seen', 'Read', 'Retracted'))
);

-- Notification Templates table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NotificationTemplates' AND xtype='U')
CREATE TABLE NotificationTemplates (
    TemplateID INT IDENTITY(1,1) PRIMARY KEY,
    TemplateName NVARCHAR(255) NOT NULL UNIQUE,
    TemplateContent NVARCHAR(MAX) NOT NULL,
    CreatedByUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- LabResults table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LabResults' AND xtype='U')
CREATE TABLE LabResults (
    LabResultID INT IDENTITY(1,1) PRIMARY KEY,
    PatientUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    DoctorUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    AppointmentID INT NULL FOREIGN KEY REFERENCES Appointments(AppointmentID),
    TestName NVARCHAR(255) NOT NULL,
    ResultValue NVARCHAR(255) NOT NULL,
    ReferenceRange NVARCHAR(255),
    Notes NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'Pending Review',
    ResultDate DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- MedicationRoutines Table: Defines medication schedules for patients with flexible scheduling
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
    
    -- Flexible scheduling options
    FrequencyType NVARCHAR(20) NOT NULL DEFAULT 'Daily', -- Daily, Weekly, Monthly, As-Needed
    TimeOfDay TIME NOT NULL, -- Primary time to take medication
    SecondaryTimes NVARCHAR(500) NULL, -- JSON array of additional times for multiple daily doses
    WeekDays NVARCHAR(20) NULL, -- For weekly schedules: comma-separated days (Mon,Wed,Fri)
    MonthDays NVARCHAR(100) NULL, -- For monthly schedules: comma-separated days (1,15,30)
    
    -- Reminder and tracking
    IsActive BIT DEFAULT 1,
    ReminderEnabled BIT DEFAULT 1,
    ReminderMinutesBefore INT DEFAULT 30, -- Minutes before medication time to send reminder
    LastReminderSentAt DATETIME2 NULL, -- Tracks when the last reminder was sent for this routine
    NextReminderDue DATETIME2 NULL, -- Calculated next reminder time for efficient querying
    
    -- Additional medication details
    MedicationCategory NVARCHAR(100) NULL, -- ARV, Supplement, Pain Management, etc.
    SideEffectsToMonitor NVARCHAR(MAX) NULL, -- What side effects to watch for
    FoodRequirement NVARCHAR(50) NULL, -- Take with food, empty stomach, etc.
    
    -- Audit fields
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    
    FOREIGN KEY (PatientUserID) REFERENCES Users(UserID) ON DELETE NO ACTION,
    FOREIGN KEY (DoctorUserID) REFERENCES Users(UserID) ON DELETE NO ACTION,
    FOREIGN KEY (ARVTreatmentID) REFERENCES ARVTreatments(ARVTreatmentID) ON DELETE SET NULL,
    
    CONSTRAINT CHK_FrequencyType CHECK (FrequencyType IN ('Daily', 'Weekly', 'Monthly', 'As-Needed')),
    CONSTRAINT CHK_FoodRequirement CHECK (FoodRequirement IN ('With Food', 'Empty Stomach', 'No Restriction', NULL))
);

-- Drop deprecated reminder tables
IF EXISTS (SELECT * FROM sysobjects WHERE name='MedicationReminders' AND xtype='U')
    DROP TABLE MedicationReminders;
GO

IF EXISTS (SELECT * FROM sysobjects WHERE name='AppointmentReminders' AND xtype='U')
    DROP TABLE AppointmentReminders;
GO

-- Create indexes for optimal notification and medication routine performance
-- Notifications table indexes
CREATE INDEX IX_Notifications_DoctorUserID ON Notifications(DoctorUserID);
CREATE INDEX IX_Notifications_PatientUserID ON Notifications(PatientUserID);
CREATE INDEX IX_Notifications_Type ON Notifications(Type);
CREATE INDEX IX_Notifications_Status ON Notifications(Status);
CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt);
CREATE INDEX IX_Notifications_TypeStatus ON Notifications(Type, Status);
CREATE INDEX IX_Notifications_PatientType ON Notifications(PatientUserID, Type);

-- MedicationRoutines table indexes
CREATE INDEX IX_MedicationRoutines_PatientUserID ON MedicationRoutines(PatientUserID);
CREATE INDEX IX_MedicationRoutines_IsActive ON MedicationRoutines(IsActive);
CREATE INDEX IX_MedicationRoutines_ReminderEnabled ON MedicationRoutines(ReminderEnabled);
CREATE INDEX IX_MedicationRoutines_NextReminderDue ON MedicationRoutines(NextReminderDue);
CREATE INDEX IX_MedicationRoutines_ActiveReminders ON MedicationRoutines(IsActive, ReminderEnabled, NextReminderDue);
CREATE INDEX IX_MedicationRoutines_PatientActive ON MedicationRoutines(PatientUserID, IsActive);
CREATE INDEX IX_MedicationRoutines_ARVTreatmentID ON MedicationRoutines(ARVTreatmentID);
GO
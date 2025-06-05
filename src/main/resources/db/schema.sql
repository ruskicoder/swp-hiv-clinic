-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'hiv_clinic')
BEGIN
    CREATE DATABASE hiv_clinic;
END
GO

USE hiv_clinic;
GO

-- Roles Table: Defines the types of users in the system
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Roles' AND xtype='U')
CREATE TABLE Roles (
    RoleID INT PRIMARY KEY IDENTITY(1,1),
    RoleName VARCHAR(50) NOT NULL UNIQUE -- e.g., 'Patient', 'Doctor', 'Admin'
);

-- Users Table: Stores common information for all authenticated users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
CREATE TABLE Users (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    RoleID INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (RoleID) REFERENCES Roles(RoleID) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Specialties Table: Lookup table for Doctor's specialties (Admin managed)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Specialties' AND xtype='U')
CREATE TABLE Specialties (
    SpecialtyID INT PRIMARY KEY IDENTITY(1,1),
    SpecialtyName NVARCHAR(255) NOT NULL UNIQUE,
    Description NVARCHAR(MAX) NULL,
    IsActive BIT DEFAULT 1
);

-- DoctorProfiles Table: Stores additional information specific to Doctors
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DoctorProfiles' AND xtype='U')
CREATE TABLE DoctorProfiles (
    DoctorProfileID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL UNIQUE,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    SpecialtyID INT NULL,
    PhoneNumber NVARCHAR(20) NULL,
    Bio NVARCHAR(MAX) NULL,
    ProfileImageBase64 NVARCHAR(MAX) NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (SpecialtyID) REFERENCES Specialties(SpecialtyID) ON DELETE SET NULL ON UPDATE NO ACTION
);

-- PatientProfiles Table: Stores additional information specific to Patients
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PatientProfiles' AND xtype='U')
CREATE TABLE PatientProfiles (
    PatientProfileID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL UNIQUE,
    FirstName NVARCHAR(100) NOT NULL,
    LastName NVARCHAR(100) NOT NULL,
    DateOfBirth DATE NULL,
    PhoneNumber NVARCHAR(20) NULL,
    Address NVARCHAR(MAX) NULL,
    ProfileImageBase64 NVARCHAR(MAX) NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- PatientRecords Table: Enhanced for better medical record management
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PatientRecords' AND xtype='U')
CREATE TABLE PatientRecords (
    RecordID INT PRIMARY KEY IDENTITY(1,1),
    PatientUserID INT NOT NULL,
    MedicalHistory NVARCHAR(MAX) NULL,
    Allergies NVARCHAR(MAX) NULL,
    CurrentMedications NVARCHAR(MAX) NULL,
    Notes NVARCHAR(MAX) NULL,
    BloodType NVARCHAR(10) NULL,
    EmergencyContact NVARCHAR(255) NULL,
    EmergencyPhone NVARCHAR(20) NULL,
    ProfileImageBase64 NVARCHAR(MAX) NULL, -- for base64 image upload
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientUserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

-- DoctorAvailabilitySlots Table: Doctors define their work slots
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DoctorAvailabilitySlots' AND xtype='U')
CREATE TABLE DoctorAvailabilitySlots (
    AvailabilitySlotID INT PRIMARY KEY IDENTITY(1,1),
    DoctorUserID INT NOT NULL, -- Refers to the UserID of a Doctor
    SlotDate DATE NOT NULL,
    StartTime TIME NOT NULL,
    EndTime TIME NOT NULL,
    IsBooked BIT DEFAULT 0, -- Flag to indicate if an appointment has taken this slot
    Notes NVARCHAR(MAX) NULL, -- Doctor's notes for this slot, e.g., "Reserved for follow-ups"
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT UQ_DoctorSlot UNIQUE (DoctorUserID, SlotDate, StartTime), -- A doctor cannot have overlapping start times for slots on the same day
    FOREIGN KEY (DoctorUserID) REFERENCES Users(UserID) ON DELETE CASCADE -- If Doctor user is deleted, their slots are deleted
);

-- Appointments Table: Core table for booking appointments
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Appointments' AND xtype='U')
CREATE TABLE Appointments (
    AppointmentID INT PRIMARY KEY IDENTITY(1,1),
    PatientUserID INT NOT NULL, -- Refers to the UserID of a Patient
    DoctorUserID INT NOT NULL, -- Refers to the UserID of a Doctor
    AvailabilitySlotID INT NULL, -- Optional: links to the specific slot that was booked
    AppointmentDateTime DATETIME2 NOT NULL, -- The confirmed date and time of the appointment
    DurationMinutes INT DEFAULT 30, -- MVP: Assume a default, could be a system setting
    Status VARCHAR(50) NOT NULL DEFAULT 'Scheduled', -- e.g., 'Scheduled', 'Completed', 'CancelledByPatient', 'CancelledByDoctor', 'NoShow'
    PatientCancellationReason NVARCHAR(MAX) NULL,
    DoctorCancellationReason NVARCHAR(MAX) NULL,
    AppointmentNotes NVARCHAR(MAX) NULL, -- Doctor's notes during/after appointment
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientUserID) REFERENCES Users(UserID) ON DELETE NO ACTION ON UPDATE NO ACTION, -- Don't delete appointments if patient is deleted without review
    FOREIGN KEY (DoctorUserID) REFERENCES Users(UserID) ON DELETE NO ACTION ON UPDATE NO ACTION, -- Don't delete appointments if doctor is deleted without review
    FOREIGN KEY (AvailabilitySlotID) REFERENCES DoctorAvailabilitySlots(AvailabilitySlotID) ON DELETE SET NULL ON UPDATE NO ACTION -- If slot is deleted, keep appointment but unlink slot
);

-- AppointmentStatusHistory Table: Logs status changes for an appointment
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AppointmentStatusHistory' AND xtype='U')
CREATE TABLE AppointmentStatusHistory (
    StatusHistoryID INT PRIMARY KEY IDENTITY(1,1),
    AppointmentID INT NOT NULL,
    OldStatus VARCHAR(50) NULL,
    NewStatus VARCHAR(50) NOT NULL,
    ChangeReason NVARCHAR(MAX) NULL,
    ChangedAt DATETIME2 DEFAULT GETDATE(),
    ChangedByUserID INT NULL, -- User who made the change (Patient, Doctor, Admin, or System)
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE CASCADE, -- If appointment is deleted, its history is deleted
    FOREIGN KEY (ChangedByUserID) REFERENCES Users(UserID) ON DELETE SET NULL ON UPDATE NO ACTION -- If user who changed status is deleted, keep log but nullify user
);

-- SystemSettings Table: Admin-configurable global parameters
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemSettings' AND xtype='U')
CREATE TABLE SystemSettings (
    SettingID INT PRIMARY KEY IDENTITY(1,1),
    SettingKey VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'DefaultAppointmentDurationMinutes', 'MaxBookingLeadDays'
    SettingValue NVARCHAR(MAX) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedByUserID INT NULL, -- Admin who last updated
    FOREIGN KEY (UpdatedByUserID) REFERENCES Users(UserID) ON DELETE SET NULL ON UPDATE NO ACTION
);

-- LoginActivity Table: Logs login attempts for basic security monitoring
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LoginActivity' AND xtype='U')
CREATE TABLE LoginActivity (
    LogID BIGINT PRIMARY KEY IDENTITY(1,1),
    UserID INT NULL, -- Null if username was not found
    UsernameAttempted VARCHAR(255) NOT NULL,
    AttemptTime DATETIME2 DEFAULT GETDATE(),
    IsSuccess BIT NOT NULL,
    IPAddress VARCHAR(45) NULL,
    UserAgent NVARCHAR(MAX) NULL,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL ON UPDATE NO ACTION -- If user is deleted, keep log but nullify user
);

-- PasswordResetTokens Table: Stores tokens for password reset functionality
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PasswordResetTokens' AND xtype='U')
CREATE TABLE PasswordResetTokens (
    TokenID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT NOT NULL,
    Token NVARCHAR(255) NOT NULL UNIQUE,
    ExpiryDateTime DATETIME2 NOT NULL,
    IsUsed BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE -- If user is deleted, their reset tokens are also deleted
);

-- ARVTreatments Table: Enhanced for better treatment management
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ARVTreatments' AND xtype='U')
CREATE TABLE ARVTreatments (
    ARVTreatmentID INT PRIMARY KEY IDENTITY(1,1),
    PatientUserID INT NOT NULL,
    DoctorUserID INT NULL,
    AppointmentID INT NULL, -- Link to the appointment where this treatment was prescribed
    Regimen NVARCHAR(255) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE NULL, -- NULL means ongoing treatment
    Adherence NVARCHAR(255) NULL, -- e.g., 'Good', 'Fair', 'Poor'
    SideEffects NVARCHAR(MAX) NULL,
    Notes NVARCHAR(MAX) NULL,
    IsActive BIT DEFAULT 1, -- Whether this treatment is currently active
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (PatientUserID) REFERENCES Users(UserID) ON DELETE NO ACTION ON UPDATE NO ACTION,
    FOREIGN KEY (DoctorUserID) REFERENCES Users(UserID) ON DELETE SET NULL ON UPDATE NO ACTION,
    FOREIGN KEY (AppointmentID) REFERENCES Appointments(AppointmentID) ON DELETE SET NULL ON UPDATE NO ACTION
);

-- Add AppointmentNotes column to Appointments table if not exists
IF COL_LENGTH('Appointments', 'AppointmentNotes') IS NULL
    ALTER TABLE Appointments ADD AppointmentNotes NVARCHAR(MAX) NULL;
PRINT 'Database schema created successfully!';
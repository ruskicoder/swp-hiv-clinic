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
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
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
    ProfileImageBase64 NVARCHAR(MAX)
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
    ProfileImageBase64 NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ARVTreatments' AND xtype='U')
CREATE TABLE ARVTreatments (
    ARVTreatmentID INT IDENTITY(1,1) PRIMARY KEY,
    PatientUserID INT NOT NULL FOREIGN KEY REFERENCES Users(UserID),
    DoctorUserID INT FOREIGN KEY REFERENCES Users(UserID),
    Regimen NVARCHAR(255) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    Adherence NVARCHAR(255),
    SideEffects NVARCHAR(MAX),
    Notes NVARCHAR(MAX),
    ProfileImageBase64 NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Insert initial roles if they don't exist
IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Patient')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Patient');
END

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Doctor')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Doctor');
END

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Admin');
END

-- Insert initial specialties
IF NOT EXISTS (SELECT * FROM Specialties WHERE SpecialtyName = 'HIV/AIDS Specialist')
BEGIN
    INSERT INTO Specialties (SpecialtyName, Description, IsActive) 
    VALUES ('HIV/AIDS Specialist', 'Specialist in HIV/AIDS treatment and care', 1);
END

IF NOT EXISTS (SELECT * FROM Specialties WHERE SpecialtyName = 'Infectious Disease')
BEGIN
    INSERT INTO Specialties (SpecialtyName, Description, IsActive) 
    VALUES ('Infectious Disease', 'Specialist in infectious diseases', 1);
END

IF NOT EXISTS (SELECT * FROM Specialties WHERE SpecialtyName = 'Internal Medicine')
BEGIN
    INSERT INTO Specialties (SpecialtyName, Description, IsActive) 
    VALUES ('Internal Medicine', 'Internal medicine physician', 1);
END

-- Insert default admin user (password: admin123)
DECLARE @AdminRoleId INT;
SELECT @AdminRoleId = RoleID FROM Roles WHERE RoleName = 'Admin';

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
    VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin@hivclinic.com', @AdminRoleId, 1);
END

-- Insert sample doctor user (password: doctor123)
DECLARE @DoctorRoleId INT;
DECLARE @SpecialtyId INT;
DECLARE @DoctorUserId INT;

SELECT @DoctorRoleId = RoleID FROM Roles WHERE RoleName = 'Doctor';
SELECT @SpecialtyId = SpecialtyID FROM Specialties WHERE SpecialtyName = 'HIV/AIDS Specialist';

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'doctor1')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
    VALUES ('doctor1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor1@hivclinic.com', @DoctorRoleId, 1);
    
    SELECT @DoctorUserId = SCOPE_IDENTITY();
    
    INSERT INTO DoctorProfiles (UserID, FirstName, LastName, SpecialtyID, PhoneNumber, Bio)
    VALUES (@DoctorUserId, 'Dr. John', 'Smith', @SpecialtyId, '+1234567890', 'Experienced HIV/AIDS specialist with 10+ years of practice.');
END

-- Insert system settings
IF NOT EXISTS (SELECT * FROM SystemSettings WHERE SettingKey = 'DefaultAppointmentDurationMinutes')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
    VALUES ('DefaultAppointmentDurationMinutes', '30', 'Default duration for appointments in minutes');
END

IF NOT EXISTS (SELECT * FROM SystemSettings WHERE SettingKey = 'MaxBookingLeadDays')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
    VALUES ('MaxBookingLeadDays', '30', 'Maximum number of days in advance that appointments can be booked');
END

GO
USE hiv_clinic;
GO

-- Insert initial roles if they don't exist
IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Patient')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Patient');
    PRINT 'Patient role created';
END

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Doctor')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Doctor');
    PRINT 'Doctor role created';
END

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Admin')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Admin');
    PRINT 'Admin role created';
END

IF NOT EXISTS (SELECT * FROM Roles WHERE RoleName = 'Manager')
BEGIN
    INSERT INTO Roles (RoleName) VALUES ('Manager');
    PRINT 'Manager role created';
END

-- Insert initial specialties
IF NOT EXISTS (SELECT * FROM Specialties WHERE SpecialtyName = 'HIV/AIDS Specialist')
BEGIN
    INSERT INTO Specialties (SpecialtyName, Description, IsActive) 
    VALUES ('HIV/AIDS Specialist', 'Specialist in HIV/AIDS treatment and care', 1);
    PRINT 'HIV/AIDS Specialist specialty created';
END

IF NOT EXISTS (SELECT * FROM Specialties WHERE SpecialtyName = 'Infectious Disease')
BEGIN
    INSERT INTO Specialties (SpecialtyName, Description, IsActive) 
    VALUES ('Infectious Disease', 'Specialist in infectious diseases', 1);
    PRINT 'Infectious Disease specialty created';
END

IF NOT EXISTS (SELECT * FROM Specialties WHERE SpecialtyName = 'Internal Medicine')
BEGIN
    INSERT INTO Specialties (SpecialtyName, Description, IsActive) 
    VALUES ('Internal Medicine', 'Internal medicine physician', 1);
    PRINT 'Internal Medicine specialty created';
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

-- Insert default manager user (password: manager123)
DECLARE @ManagerRoleId INT;
SELECT @ManagerRoleId = RoleID FROM Roles WHERE RoleName = 'Manager';

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'manager')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
    VALUES ('manager', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager@hivclinic.com', @ManagerRoleId, 1);
END

-- Insert system settings
IF NOT EXISTS (SELECT * FROM SystemSettings WHERE SettingKey = 'DefaultAppointmentDurationMinutes')
BEGIN
INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
    VALUES ('DefaultAppointmentDurationMinutes', '30', 'Default duration for appointments in minutes');
    PRINT 'Default appointment duration setting created';
END

IF NOT EXISTS (SELECT * FROM SystemSettings WHERE SettingKey = 'MaxBookingLeadDays')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description)
    VALUES ('MaxBookingLeadDays', '30', 'Maximum number of days in advance that appointments can be booked');
    PRINT 'Max booking lead days setting created';
END


-- DEMO DATA: Additional Doctors
DECLARE @DoctorRoleId2 INT, @SpecialtyId2 INT, @DoctorUserId2 INT;
SELECT @DoctorRoleId2 = RoleID FROM Roles WHERE RoleName = 'Doctor';
SELECT @SpecialtyId2 = SpecialtyID FROM Specialties WHERE SpecialtyName = 'Infectious Disease';
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'drjones')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName, Specialty)
    VALUES ('drjones', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'drjones@demo.com', @DoctorRoleId2, 1, 'Emily', 'Jones', 'Infectious Disease');
    SELECT @DoctorUserId2 = SCOPE_IDENTITY();
    INSERT INTO DoctorProfiles (UserID, FirstName, LastName, SpecialtyID, PhoneNumber, Bio)
    VALUES (@DoctorUserId2, 'Emily', 'Jones', @SpecialtyId2, '+1987654321', 'Expert in infectious diseases.');
END

-- DEMO DATA: Patients
DECLARE @PatientRoleId INT, @PatientUserId1 INT, @PatientUserId2 INT;
SELECT @PatientRoleId = RoleID FROM Roles WHERE RoleName = 'Patient';
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'patient1')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('patient1', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient1@demo.com', @PatientRoleId, 1, 'Alice', 'Brown');
    SELECT @PatientUserId1 = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientUserId1, 'Alice', 'Brown', '1990-01-01', '555-111-2222', '123 Main St', NULL, 0);
END
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'patient2')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('patient2', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'patient2@demo.com', @PatientRoleId, 1, 'Bob', 'Green');
    SELECT @PatientUserId2 = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientUserId2, 'Bob', 'Green', '1985-05-15', '555-333-4444', '456 Oak Ave', NULL, 1);
END

-- DEMO DATA: Appointments
DECLARE @DoctorSmithId INT, @DoctorJonesId INT, @Patient1Id INT, @Patient2Id INT, @Appt1Id INT, @Appt2Id INT;
SELECT @DoctorSmithId = UserID FROM Users WHERE Username = 'doctor1';
SELECT @DoctorJonesId = UserID FROM Users WHERE Username = 'drjones';
SELECT @Patient1Id = UserID FROM Users WHERE Username = 'patient1';
SELECT @Patient2Id = UserID FROM Users WHERE Username = 'patient2';
IF NOT EXISTS (SELECT * FROM Appointments WHERE PatientUserID = @Patient1Id AND DoctorUserID = @DoctorSmithId)
BEGIN
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes, CreatedAt)
    VALUES (@Patient1Id, @DoctorSmithId, '2025-07-03T09:00:00', 'Scheduled', 'Routine checkup', GETDATE());
    SELECT @Appt1Id = SCOPE_IDENTITY();
END
IF NOT EXISTS (SELECT * FROM Appointments WHERE PatientUserID = @Patient2Id AND DoctorUserID = @DoctorJonesId)
BEGIN
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes, CreatedAt)
    VALUES (@Patient2Id, @DoctorJonesId, '2025-07-04T10:30:00', 'Scheduled', 'Follow-up', GETDATE());
    SELECT @Appt2Id = SCOPE_IDENTITY();
END


-- DEMO DATA: ARV Regimens (with PatientUserID and DoctorUserID)
IF NOT EXISTS (SELECT * FROM ARVTreatments WHERE AppointmentID = @Appt1Id)
BEGIN
    INSERT INTO ARVTreatments (PatientUserID, DoctorUserID, AppointmentID, Regimen, StartDate, EndDate, Adherence, SideEffects, Notes, IsActive)
    VALUES (@Patient1Id, @DoctorSmithId, @Appt1Id, 'TDF/3TC/EFV', '2025-07-03', NULL, 'Good', NULL, 'Initial ARV regimen', 1);
END
IF NOT EXISTS (SELECT * FROM ARVTreatments WHERE AppointmentID = @Appt2Id)
BEGIN
    INSERT INTO ARVTreatments (PatientUserID, DoctorUserID, AppointmentID, Regimen, StartDate, EndDate, Adherence, SideEffects, Notes, IsActive)
    VALUES (@Patient2Id, @DoctorJonesId, @Appt2Id, 'AZT/3TC/NVP', '2025-07-04', NULL, 'Fair', 'Mild rash', 'Changed regimen due to side effects', 1);
END


-- DEMO DATA: Doctor Availability Slots (Schedules)

DECLARE @SlotId1 INT, @SlotId2 INT;
-- Dr. John Smith: July 3, 2025, 09:00-09:30
IF @DoctorSmithId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorSmithId AND SlotDate = '2025-07-03' AND StartTime = '09:00:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes)
    VALUES (@DoctorSmithId, '2025-07-03', '09:00:00', '09:30:00', 1, 'Routine checkup slot');
    SELECT @SlotId1 = SCOPE_IDENTITY();
END
-- Dr. Emily Jones: July 4, 2025, 10:30-11:00
IF @DoctorUserId2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorUserId2 AND SlotDate = '2025-07-04' AND StartTime = '10:30:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes)
    VALUES (@DoctorUserId2, '2025-07-04', '10:30:00', '11:00:00', 1, 'Follow-up slot');
    SELECT @SlotId2 = SCOPE_IDENTITY();
END

PRINT 'Initial data setup completed!';

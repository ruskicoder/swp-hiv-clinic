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

PRINT 'Initial data setup completed!';

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

-- Insert default admin user (password: 123456)
DECLARE @AdminRoleId INT;
SELECT @AdminRoleId = RoleID FROM Roles WHERE RoleName = 'Admin';

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
VALUES ('admin', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'admin@hivclinic.com', @AdminRoleId, 1);
END

-- Insert sample doctor user (password: 123456)
DECLARE @DoctorRoleId INT;
DECLARE @SpecialtyId INT;
DECLARE @DoctorUserId INT;

SELECT @DoctorRoleId = RoleID FROM Roles WHERE RoleName = 'Doctor';
SELECT @SpecialtyId = SpecialtyID FROM Specialties WHERE SpecialtyName = 'HIV/AIDS Specialist';

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'doctor1')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
VALUES ('doctor1', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'doctor1@hivclinic.com', @DoctorRoleId, 1);

SELECT @DoctorUserId = SCOPE_IDENTITY();

INSERT INTO DoctorProfiles (UserID, FirstName, LastName, SpecialtyID, PhoneNumber, Bio)
VALUES (@DoctorUserId, 'Dr. John', 'Smith', @SpecialtyId, '+1234567890', 'Experienced HIV/AIDS specialist with 10+ years of practice.');
END

-- Insert default manager user (password: 123456)
DECLARE @ManagerRoleId INT;
SELECT @ManagerRoleId = RoleID FROM Roles WHERE RoleName = 'Manager';

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'manager')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
    VALUES ('manager', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'manager@hivclinic.com', @ManagerRoleId, 1);
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


-- Insert default ARV templates (default templates cannot be edited/deleted)
-- Example templates for common HIV types

-- Ensure there is a dummy patient and doctor for default templates
DECLARE @DummyPatientId INT, @DummyDoctorId INT;
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'dummy_patient')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
    VALUES ('dummy_patient', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dummy_patient@hivclinic.com', (SELECT RoleID FROM Roles WHERE RoleName = 'Patient'), 1);
END
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'dummy_doctor')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive) 
    VALUES ('dummy_doctor', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dummy_doctor@hivclinic.com', (SELECT RoleID FROM Roles WHERE RoleName = 'Doctor'), 1);
END
SELECT @DummyPatientId = UserID FROM Users WHERE Username = 'dummy_patient';
SELECT @DummyDoctorId = UserID FROM Users WHERE Username = 'dummy_doctor';

IF NOT EXISTS (SELECT * FROM ARVTreatments WHERE Notes = 'default template')
BEGIN
    INSERT INTO ARVTreatments 
        (PatientUserID, DoctorUserID, AppointmentID, Regimen, StartDate, EndDate, Adherence, SideEffects, Notes, IsActive, CreatedAt, UpdatedAt)
    VALUES
        (@DummyPatientId, @DummyDoctorId, NULL, 'TDF + 3TC + EFV', '2020-01-01', NULL, 'Excellent', 'Minimal', 'default template', 1, GETDATE(), GETDATE()),
        (@DummyPatientId, @DummyDoctorId, NULL, 'AZT + 3TC + NVP', '2020-01-01', NULL, 'Excellent', 'Rash, anemia', 'default template', 1, GETDATE(), GETDATE()),
        (@DummyPatientId, @DummyDoctorId, NULL, 'ABC + 3TC + LPV/r', '2020-01-01', NULL, 'Excellent', 'GI upset', 'default template', 1, GETDATE(), GETDATE());
END



-- DEMO DATA: Additional Doctors (password: 123456)
DECLARE @DoctorRoleId2 INT, @SpecialtyId2 INT, @DoctorUserId2 INT;
SELECT @DoctorRoleId2 = RoleID FROM Roles WHERE RoleName = 'Doctor';
SELECT @SpecialtyId2 = SpecialtyID FROM Specialties WHERE SpecialtyName = 'Infectious Disease';
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'drjones')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName, Specialty)
    VALUES ('drjones', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'drjones@demo.com', @DoctorRoleId2, 1, 'Emily', 'Jones', 'Infectious Disease');
    SELECT @DoctorUserId2 = SCOPE_IDENTITY();
    INSERT INTO DoctorProfiles (UserID, FirstName, LastName, SpecialtyID, PhoneNumber, Bio)
    VALUES (@DoctorUserId2, 'Emily', 'Jones', @SpecialtyId2, '+1987654321', 'Expert in infectious diseases.');
END

-- DEMO DATA: Patients (password: 123456)
DECLARE @PatientRoleId INT, @PatientUserId1 INT, @PatientUserId2 INT;
SELECT @PatientRoleId = RoleID FROM Roles WHERE RoleName = 'Patient';
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'patient1')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('patient1', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'patient1@demo.com', @PatientRoleId, 1, 'Alice', 'Brown');
    SELECT @PatientUserId1 = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientUserId1, 'Alice', 'Brown', '1990-01-01', '555-111-2222', '123 Main St', NULL, 0);
END
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'patient2')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('patient2', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'patient2@demo.com', @PatientRoleId, 1, 'Bob', 'Green');
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

-- Insert default notification templates
IF NOT EXISTS (SELECT * FROM NotificationTemplates WHERE name = '24-Hour Appointment Reminder')
BEGIN
    INSERT INTO NotificationTemplates (name, type, subject, body, Priority, isActive) VALUES
    -- Appointment reminder templates
    ('24-Hour Appointment Reminder', 'APPOINTMENT_REMINDER', 'Appointment Reminder - {{patientName}}', 'Dear {{patientName}}, you have an appointment tomorrow at {{appointmentTime}} with Dr. {{doctorName}}. Please arrive 15 minutes early.', 'MEDIUM', 1),
    ('1-Hour Appointment Reminder', 'APPOINTMENT_REMINDER', 'Appointment Starting Soon - {{patientName}}', 'Dear {{patientName}}, your appointment with Dr. {{doctorName}} is starting in 1 hour at {{appointmentTime}}.', 'HIGH', 1),
    ('30-Minute Appointment Reminder', 'APPOINTMENT_REMINDER', 'Appointment in 30 Minutes - {{patientName}}', 'Dear {{patientName}}, your appointment with Dr. {{doctorName}} is starting in 30 minutes at {{appointmentTime}}. Please head to the clinic now.', 'URGENT', 1),
    
    -- Medication reminder templates
    ('Daily ARV Medication Reminder', 'MEDICATION_REMINDER', 'Time for Your ARV Medication - {{patientName}}', 'Dear {{patientName}}, it''s time to take your ARV medication: {{medicationName}}. Please take it as prescribed by Dr. {{doctorName}}.', 'HIGH', 1),
    ('Medication Adherence Reminder', 'MEDICATION_REMINDER', 'Important: Medication Adherence - {{patientName}}', 'Dear {{patientName}}, maintaining consistent medication adherence is crucial for your treatment success. Please take your prescribed ARV medication: {{medicationName}}.', 'URGENT', 1),
    ('Missed Dose Follow-up', 'MEDICATION_REMINDER', 'Missed Dose Notification - {{patientName}}', 'Dear {{patientName}}, you may have missed your scheduled medication dose. Please contact Dr. {{doctorName}} if you need guidance on missed doses.', 'HIGH', 1),
    
    -- General templates
    ('General Health Reminder', 'GENERAL', 'Health Reminder - {{patientName}}', 'Dear {{patientName}}, this is a reminder from Dr. {{doctorName}} about: {{customMessage}}', 'MEDIUM', 1),
    ('Lab Results Available', 'GENERAL', 'Lab Results Ready - {{patientName}}', 'Dear {{patientName}}, your lab results are ready for review. Please contact Dr. {{doctorName}} to discuss your results.', 'MEDIUM', 1),
    ('Treatment Plan Update', 'GENERAL', 'Treatment Plan Update - {{patientName}}', 'Dear {{patientName}}, Dr. {{doctorName}} has updated your treatment plan. Please review the changes and contact us if you have questions.', 'HIGH', 1);
    
    PRINT 'Default notification templates created';
END

-- Insert sample notifications for testing
DECLARE @Patient1Id_Data INT, @Patient2Id_Data INT;
SELECT @Patient1Id_Data = UserID FROM Users WHERE Username = 'patient1';
SELECT @Patient2Id_Data = UserID FROM Users WHERE Username = 'patient2';

IF @Patient1Id_Data IS NOT NULL AND NOT EXISTS (SELECT * FROM Notifications WHERE UserID = @Patient1Id_Data)
BEGIN
    INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt) VALUES
    (@Patient1Id_Data, 'APPOINTMENT_REMINDER', 'Upcoming Appointment Reminder', 'You have an appointment with Dr. Smith tomorrow at 9:00 AM. Please arrive 15 minutes early.', 0, 'HIGH', 'APPOINTMENT', GETDATE()),
    (@Patient1Id_Data, 'MEDICATION_REMINDER', 'Time for ARV Medication', 'It''s time to take your daily ARV medication. Please take as prescribed.', 0, 'URGENT', 'MEDICATION', GETDATE()),
    (@Patient1Id_Data, 'GENERAL', 'Lab Results Available', 'Your recent lab results are now available. Please contact your doctor to review.', 1, 'MEDIUM', 'SYSTEM', DATEADD(DAY, -1, GETDATE())),
    (@Patient1Id_Data, 'SYSTEM_NOTIFICATION', 'Welcome to HIV Clinic', 'Welcome to our medical system. Please update your profile information.', 1, 'LOW', 'SYSTEM', DATEADD(DAY, -7, GETDATE()));
    
    PRINT 'Sample notifications created for patient1';
END

IF @Patient2Id_Data IS NOT NULL AND NOT EXISTS (SELECT * FROM Notifications WHERE UserID = @Patient2Id_Data)
BEGIN
    INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt) VALUES
    (@Patient2Id_Data, 'APPOINTMENT_REMINDER', 'Appointment in 1 Hour', 'Your appointment with Dr. Jones is in 1 hour. Please head to the clinic.', 0, 'URGENT', 'APPOINTMENT', GETDATE()),
    (@Patient2Id_Data, 'MEDICATION_REMINDER', 'Missed Dose Alert', 'You may have missed your medication dose. Please contact your doctor if needed.', 0, 'HIGH', 'MEDICATION', DATEADD(HOUR, -2, GETDATE()));
    
    PRINT 'Sample notifications created for patient2';
END

PRINT 'Initial data setup completed!';

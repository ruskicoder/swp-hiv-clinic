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
VALUES (@DoctorUserId, 'John', 'Smith', @SpecialtyId, '+1234567890', 'Experienced HIV/AIDS specialist with 10+ years of practice.');
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
GO

--------------------------------------------------------------------------------
-- ========================================================================== --
--                  ADDITIONAL REALISTIC MOCK DATA (20+ Entries)              --
-- ========================================================================== --
--------------------------------------------------------------------------------
PRINT 'Starting insertion of additional realistic mock data...';
GO

-- This entire section is one batch. All variables are declared at the top
-- and will remain in scope until the final 'GO'.
DECLARE
    -- Role & Doctor IDs
    @PatientRoleId_New INT,
    @DoctorSmithId_New INT,
    @DoctorJonesId_New INT,

    -- Patient IDs
    @PatientLiamId INT,
    @PatientOliviaId INT,
    @PatientNoahId INT,
    @PatientEmmaId INT,
    @PatientWilliamId INT,
    
    -- Appointment IDs
    @ApptId_Liam INT,
    @ApptId_Noah INT;

-- Get Role & Doctor IDs
SELECT @PatientRoleId_New = RoleID FROM Roles WHERE RoleName = 'Patient';
SELECT @DoctorSmithId_New = UserID FROM Users WHERE Username = 'doctor1';
SELECT @DoctorJonesId_New = UserID FROM Users WHERE Username = 'drjones';


-- === MORE PATIENTS (password: 123456) ===
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'LiamGarcia')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('LiamGarcia', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'liam.garcia@example.com', @PatientRoleId_New, 1, 'Liam', 'Garcia');
    SELECT @PatientLiamId = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientLiamId, 'Liam', 'Garcia', '1992-08-21', '555-0101-2020', '789 Pine Rd, Springfield', NULL, 0);
END
ELSE
BEGIN
    SELECT @PatientLiamId = UserID FROM Users WHERE Username = 'LiamGarcia';
END

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'OliviaMartinez')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('OliviaMartinez', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'olivia.martinez@example.com', @PatientRoleId_New, 1, 'Olivia', 'Martinez');
    SELECT @PatientOliviaId = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientOliviaId, 'Olivia', 'Martinez', '1988-11-30', '555-0202-3030', '101 Maple Ln, Shelbyville', NULL, 1);
END
ELSE
BEGIN
    SELECT @PatientOliviaId = UserID FROM Users WHERE Username = 'OliviaMartinez';
END

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'NoahRodriguez')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('NoahRodriguez', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'noah.rodriguez@example.com', @PatientRoleId_New, 1, 'Noah', 'Rodriguez');
    SELECT @PatientNoahId = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientNoahId, 'Noah', 'Rodriguez', '2000-04-15', '555-0303-4040', '212 Birch St, Capital City', NULL, 0);
END
ELSE
BEGIN
    SELECT @PatientNoahId = UserID FROM Users WHERE Username = 'NoahRodriguez';
END

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'EmmaHernandez')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('EmmaHernandez', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'emma.hernandez@example.com', @PatientRoleId_New, 1, 'Emma', 'Hernandez');
    SELECT @PatientEmmaId = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientEmmaId, 'Emma', 'Hernandez', '1995-02-10', '555-0404-5050', '333 Cedar Ave, Ogdenville', NULL, 0);
END
ELSE
BEGIN
    SELECT @PatientEmmaId = UserID FROM Users WHERE Username = 'EmmaHernandez';
END

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'WilliamLopez')
BEGIN
    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES ('WilliamLopez', '$2a$10$v.dQO4SQPJjqXLis7VgdceEaMbTb7ImtzDlVeIGMmDCB69RO9LhXK', 'william.lopez@example.com', @PatientRoleId_New, 1, 'William', 'Lopez');
    SELECT @PatientWilliamId = SCOPE_IDENTITY();
    INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, ProfileImageBase64, IsPrivate)
    VALUES (@PatientWilliamId, 'William', 'Lopez', '1983-06-25', '555-0505-6060', '444 Willow Dr, North Haverbrook', NULL, 1);
END
ELSE
BEGIN
    SELECT @PatientWilliamId = UserID FROM Users WHERE Username = 'WilliamLopez';
END

PRINT 'Added 5 new patients and their profiles.';


-- === MORE DOCTOR AVAILABILITY SLOTS AND APPOINTMENTS ===
-- Doctor Smith's Schedule: July & August 2025
IF @DoctorSmithId_New IS NOT NULL AND @PatientLiamId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorSmithId_New AND SlotDate = '2025-07-29' AND StartTime = '10:00:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes) VALUES (@DoctorSmithId_New, '2025-07-29', '10:00:00', '10:30:00', 1, 'Follow-up on lab results');
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes) VALUES (@PatientLiamId, @DoctorSmithId_New, '2025-07-29T10:00:00', 'Scheduled', 'Follow-up on recent lab results.');
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorSmithId_New, '2025-07-29', '10:30:00', '11:00:00', 0);
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorSmithId_New, '2025-07-29', '11:00:00', '11:30:00', 0);
END

IF @DoctorSmithId_New IS NOT NULL AND @PatientNoahId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorSmithId_New AND SlotDate = '2025-07-31' AND StartTime = '14:00:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes) VALUES (@DoctorSmithId_New, '2025-07-31', '14:00:00', '14:30:00', 1, 'Annual check-up.');
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes) VALUES (@PatientNoahId, @DoctorSmithId_New, '2025-07-31T14:00:00', 'Scheduled', 'Annual check-up and prescription renewal.');
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorSmithId_New, '2025-07-31', '14:30:00', '15:00:00', 0);
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorSmithId_New, '2025-07-31', '15:00:00', '15:30:00', 0);
END

IF @DoctorSmithId_New IS NOT NULL AND @PatientEmmaId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorSmithId_New AND SlotDate = '2025-08-05' AND StartTime = '09:30:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorSmithId_New, '2025-08-05', '09:00:00', '09:30:00', 0);
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes) VALUES (@DoctorSmithId_New, '2025-08-05', '09:30:00', '10:00:00', 1, 'Discuss medication side effects.');
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes) VALUES (@PatientEmmaId, @DoctorSmithId_New, '2025-08-05T09:30:00', 'Scheduled', 'Patient experiencing new side effects from medication.');
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorSmithId_New, '2025-08-05', '10:00:00', '10:30:00', 0);
END

-- Doctor Jones's Schedule: July & August 2025
IF @DoctorJonesId_New IS NOT NULL AND @PatientOliviaId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorJonesId_New AND SlotDate = '2025-07-30' AND StartTime = '13:00:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorJonesId_New, '2025-07-30', '13:00:00', '13:30:00', 0);
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes) VALUES (@DoctorJonesId_New, '2025-07-30', '13:30:00', '14:00:00', 1, 'Initial consultation.');
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes) VALUES (@PatientOliviaId, @DoctorJonesId_New, '2025-07-30T13:30:00', 'Scheduled', 'New patient initial consultation.');
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorJonesId_New, '2025-07-30', '14:00:00', '14:30:00', 0);
END

IF @DoctorJonesId_New IS NOT NULL AND @PatientWilliamId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorJonesId_New AND SlotDate = '2025-08-01' AND StartTime = '11:00:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorJonesId_New, '2025-08-01', '10:30:00', '11:00:00', 0);
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes) VALUES (@DoctorJonesId_New, '2025-08-01', '11:00:00', '11:30:00', 1, 'Follow-up visit.');
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes) VALUES (@PatientWilliamId, @DoctorJonesId_New, '2025-08-01T11:00:00', 'Scheduled', '6-month follow-up visit.');
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorJonesId_New, '2025-08-01', '11:30:00', '12:00:00', 0);
END

IF @DoctorJonesId_New IS NOT NULL AND @PatientLiamId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM DoctorAvailabilitySlots WHERE DoctorUserID = @DoctorJonesId_New AND SlotDate = '2025-08-06' AND StartTime = '15:00:00')
BEGIN
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorJonesId_New, '2025-08-06', '14:30:00', '15:00:00', 0);
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked, Notes) VALUES (@DoctorJonesId_New, '2025-08-06', '15:00:00', '15:30:00', 1, 'Consultation.');
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AppointmentDateTime, Status, AppointmentNotes) VALUES (@PatientLiamId, @DoctorJonesId_New, '2025-08-06T15:00:00', 'Scheduled', 'Consultation about travel vaccinations.');
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked) VALUES (@DoctorJonesId_New, '2025-08-06', '15:30:00', '16:00:00', 0);
END

PRINT 'Added 18 new availability slots and 6 new appointments.';


-- === MORE ARV TREATMENTS ===
SELECT @ApptId_Liam = AppointmentID FROM Appointments WHERE PatientUserID = @PatientLiamId AND DoctorUserID = @DoctorSmithId_New;
SELECT @ApptId_Noah = AppointmentID FROM Appointments WHERE PatientUserID = @PatientNoahId AND DoctorUserID = @DoctorSmithId_New;

IF @ApptId_Liam IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ARVTreatments WHERE AppointmentID = @ApptId_Liam)
BEGIN
    INSERT INTO ARVTreatments (PatientUserID, DoctorUserID, AppointmentID, Regimen, StartDate, EndDate, Adherence, SideEffects, Notes, IsActive)
    VALUES (@PatientLiamId, @DoctorSmithId_New, @ApptId_Liam, 'BIC/FTC/TAF', '2025-07-29', NULL, 'Excellent', 'None reported', 'Starting new single-tablet regimen.', 1);
END

IF @ApptId_Noah IS NOT NULL AND NOT EXISTS (SELECT 1 FROM ARVTreatments WHERE AppointmentID = @ApptId_Noah)
BEGIN
    INSERT INTO ARVTreatments (PatientUserID, DoctorUserID, AppointmentID, Regimen, StartDate, EndDate, Adherence, SideEffects, Notes, IsActive)
    VALUES (@PatientNoahId, @DoctorSmithId_New, @ApptId_Noah, 'DRV/c + TDF/FTC', '2025-07-31', NULL, 'Good', 'Mild fatigue', 'Continuing current regimen, monitoring fatigue.', 1);
END
PRINT 'Added 2 new ARV Treatment records.';


-- === MORE NOTIFICATIONS ===
IF @PatientLiamId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Notifications WHERE UserID = @PatientLiamId AND Title LIKE 'Appointment Reminder%')
BEGIN
    INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt) VALUES
    (@PatientLiamId, 'APPOINTMENT_REMINDER', 'Appointment Reminder: Jul 29 @ 10:00 AM', 'Reminder: You have an appointment with Dr. John Smith on July 29, 2025 at 10:00 AM.', 1, 'MEDIUM', 'APPOINTMENT', '2025-07-28T10:00:00'),
    (@PatientLiamId, 'MEDICATION_REMINDER', 'Daily Medication Time', 'Time to take your BIC/FTC/TAF for today.', 0, 'HIGH', 'MEDICATION', GETDATE()),
    (@PatientLiamId, 'GENERAL', 'Welcome to the Patient Portal', 'Welcome, Liam! You can use this portal to manage your appointments and view your health records.', 1, 'LOW', 'SYSTEM', '2025-07-25T16:00:00');
END

IF @PatientOliviaId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Notifications WHERE UserID = @PatientOliviaId AND Title LIKE 'Welcome%')
BEGIN
    INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt) VALUES
    (@PatientOliviaId, 'SYSTEM_NOTIFICATION', 'Welcome and Complete Your Profile', 'Welcome, Olivia! Please take a moment to complete your patient profile information.', 0, 'MEDIUM', 'SYSTEM', '2025-07-30T09:00:00'),
    (@PatientOliviaId, 'APPOINTMENT_REMINDER', 'Upcoming Appointment Confirmation', 'Your initial consultation with Dr. Emily Jones is confirmed for July 30, 2025 at 1:30 PM.', 0, 'HIGH', 'APPOINTMENT', '2025-07-29T18:00:00');
END

IF @PatientNoahId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Notifications WHERE UserID = @PatientNoahId AND Title LIKE '%Lab Results%')
BEGIN
    INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt) VALUES
    (@PatientNoahId, 'GENERAL', 'Your Lab Results are Available', 'New lab results have been added to your file. Please review them before your next appointment.', 0, 'MEDIUM', 'SYSTEM', GETDATE()),
    (@PatientNoahId, 'APPOINTMENT_REMINDER', 'Appointment in 1 Hour', 'Your appointment with Dr. John Smith is in 1 hour.', 0, 'URGENT', 'APPOINTMENT', '2025-07-31T13:00:00'),
    (@PatientNoahId, 'MEDICATION_REMINDER', 'Reminder: Take Evening Dose', 'This is a reminder to take your evening medication dose.', 1, 'HIGH', 'MEDICATION', DATEADD(day, -1, GETDATE()));
END

IF @PatientEmmaId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Notifications WHERE UserID = @PatientEmmaId AND Title LIKE '%Treatment Plan%')
BEGIN
    INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt) VALUES
    (@PatientEmmaId, 'GENERAL', 'Updated Treatment Plan', 'Dr. Smith has updated your treatment plan. Please review the changes in your health record.', 1, 'HIGH', 'SYSTEM', '2025-07-28T11:00:00'),
    (@PatientEmmaId, 'APPOINTMENT_REMINDER', 'Appointment Reminder: Aug 05', 'Reminder for your appointment with Dr. Smith on August 5, 2025.', 0, 'MEDIUM', 'APPOINTMENT', GETDATE());
END

IF @PatientWilliamId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Notifications WHERE UserID = @PatientWilliamId AND Title LIKE '%Prescription%')
BEGIN
    INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt) VALUES
    (@PatientWilliamId, 'GENERAL', 'Prescription Ready for Pickup', 'Your prescription renewal has been sent to the pharmacy and is ready for pickup.', 0, 'MEDIUM', 'SYSTEM', GETDATE()),
    (@PatientWilliamId, 'APPOINTMENT_REMINDER', 'Appointment Follow-up', 'Thank you for visiting Dr. Jones. Your next recommended follow-up is in 6 months.', 1, 'LOW', 'APPOINTMENT', '2025-08-01T12:00:00');
END

PRINT 'Added 12 new notification records.';
PRINT 'Additional realistic mock data insertion completed successfully!';
GO
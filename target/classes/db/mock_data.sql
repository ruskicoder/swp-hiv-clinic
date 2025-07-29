-- Create temporary tables for realistic data generation
DECLARE @MaleFirstNames TABLE (Name NVARCHAR(50));
INSERT INTO @MaleFirstNames VALUES ('James'), ('John'), ('Robert'), ('Michael'), ('William'), ('David'), ('Richard'), ('Joseph'), ('Thomas'), ('Charles'), ('Christopher'), ('Daniel'), ('Matthew'), ('Anthony'), ('Mark');
DECLARE @FemaleFirstNames TABLE (Name NVARCHAR(50));
INSERT INTO @FemaleFirstNames VALUES ('Mary'), ('Patricia'), ('Jennifer'), ('Linda'), ('Elizabeth'), ('Barbara'), ('Susan'), ('Jessica'), ('Sarah'), ('Karen'), ('Nancy'), ('Lisa'), ('Margaret'), ('Betty'), ('Sandra');
DECLARE @LastNames TABLE (Name NVARCHAR(50));
INSERT INTO @LastNames VALUES ('Smith'), ('Johnson'), ('Williams'), ('Brown'), ('Jones'), ('Garcia'), ('Miller'), ('Davis'), ('Rodriguez'), ('Martinez'), ('Hernandez'), ('Lopez'), ('Gonzalez'), ('Wilson'), ('Anderson'), ('Thomas'), ('Taylor'), ('Moore'), ('Jackson'), ('Martin');
DECLARE @StreetNames TABLE (Name NVARCHAR(100));
INSERT INTO @StreetNames VALUES ('Maple Avenue'), ('Oak Street'), ('Pine Lane'), ('Cedar Drive'), ('Elm Court'), ('Birch Road'), ('Willow Way'), ('Creek Bend'), ('River Road'), ('Sunset Boulevard');
DECLARE @Cities TABLE (Name NVARCHAR(50));
INSERT INTO @Cities VALUES ('Springfield'), ('Fairview'), ('Greenville'), ('Madison'), ('Franklin'), ('Clinton'), ('Bristol'), ('Georgetown');
DECLARE @States TABLE (Abbr CHAR(2), Code CHAR(5));
INSERT INTO @States VALUES ('CA', '90210'), ('NY', '10001'), ('TX', '75001'), ('FL', '33101'), ('IL', '60601'), ('PA', '19102'), ('OH', '44101');
DECLARE @BioSnippets TABLE (Snippet NVARCHAR(255));
INSERT INTO @BioSnippets VALUES
('Passionate about patient education and preventive care.'),
('Specializes in managing complex, multi-drug resistant HIV cases.'),
('Actively involved in clinical research for new ARV therapies.'),
('Committed to providing compassionate and non-judgmental care.'),
('Focuses on the holistic well-being of individuals living with HIV.'),
('Experienced in co-managing HIV with other chronic conditions.'),
('A strong advocate for mental health support in HIV treatment.');
GO

-- Insert Specialties (5 entries)
INSERT INTO Specialties (SpecialtyName, Description, IsActive) VALUES
('HIV/AIDS Specialist', 'Expert in HIV/AIDS treatment and management', 1),
('Infectious Disease', 'Specialist in infectious diseases including HIV', 1),
('Internal Medicine', 'Primary care with HIV management experience', 1),
('Immunology', 'Focus on immune system and HIV impacts', 1),
('Preventive Medicine', 'Specializing in HIV prevention and management', 1);
GO

-- Insert Doctors (20 entries)
DECLARE @DoctorRoleId INT;
SELECT @DoctorRoleId = RoleID FROM Roles WHERE RoleName = 'Doctor';
DECLARE @i INT = 1;

WHILE @i <= 20
BEGIN
    DECLARE @isMaleDoc BIT = CASE WHEN RAND() > 0.5 THEN 1 ELSE 0 END;
    DECLARE @docFirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM (SELECT Name FROM @MaleFirstNames WHERE @isMaleDoc = 1 UNION ALL SELECT Name FROM @FemaleFirstNames WHERE @isMaleDoc = 0) AS fn ORDER BY NEWID());
    DECLARE @docLastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @docUsername NVARCHAR(100) = LOWER(LEFT(@docFirstName, 1) + '.' + @docLastName) + CAST(FLOOR(RAND()*100) AS NVARCHAR(3));

    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES (@docUsername, '$2a$10$YEZoEcQwUYQHTBcqvHTOo.t3UEFOXg3zPXhEhVLvhhXSNjy7ZnQjC', @docUsername + '@clinic.com', @DoctorRoleId, 1, @docFirstName, @docLastName);

    SET @i = @i + 1;
END;
GO

-- Insert corresponding DoctorProfiles
INSERT INTO DoctorProfiles (UserID, FirstName, LastName, SpecialtyID, PhoneNumber, Bio, Gender)
SELECT
    u.UserID,
    u.FirstName,
    u.LastName,
    (SELECT TOP 1 SpecialtyID FROM Specialties ORDER BY NEWID()),
    '+1' + CAST(FLOOR(RAND()*(9999999999-1000000000+1)+1000000000) AS VARCHAR(10)),
    (SELECT STRING_AGG(Snippet, ' ') FROM (SELECT TOP 2 Snippet FROM @BioSnippets ORDER BY NEWID()) AS bs),
    CASE WHEN u.FirstName IN (SELECT Name FROM @MaleFirstNames) THEN 'Male' ELSE 'Female' END
FROM Users u
WHERE u.RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'Doctor');
GO

-- Insert Patients (50 entries)
DECLARE @PatientRoleId INT;
SELECT @PatientRoleId = RoleID FROM Roles WHERE RoleName = 'Patient';
DECLARE @j INT = 1;

WHILE @j <= 50
BEGIN
    DECLARE @isMalePatient BIT = CASE WHEN RAND() > 0.5 THEN 1 ELSE 0 END;
    DECLARE @patientFirstName NVARCHAR(50) = (SELECT TOP 1 Name FROM (SELECT Name FROM @MaleFirstNames WHERE @isMalePatient = 1 UNION ALL SELECT Name FROM @FemaleFirstNames WHERE @isMalePatient = 0) AS fn ORDER BY NEWID());
    DECLARE @patientLastName NVARCHAR(50) = (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID());
    DECLARE @patientUsername NVARCHAR(100) = LOWER(LEFT(@patientFirstName, 1) + '.' + @patientLastName) + CAST(FLOOR(RAND()*100) AS NVARCHAR(3));

    INSERT INTO Users (Username, PasswordHash, Email, RoleID, IsActive, FirstName, LastName)
    VALUES (@patientUsername, '$2a$10$YEZoEcQwUYQHTBcqvHTOo.t3UEFOXg3zPXhEhVLvhhXSNjy7ZnQjC', @patientUsername + '@email.com', @PatientRoleId, 1, @patientFirstName, @patientLastName);

    SET @j = @j + 1;
END;
GO

-- Insert PatientProfiles
INSERT INTO PatientProfiles (UserID, FirstName, LastName, DateOfBirth, PhoneNumber, Address, Gender, BloodType, EmergencyContact, EmergencyPhone)
SELECT
    u.UserID,
    u.FirstName,
    u.LastName,
    DATEADD(DAY, -FLOOR(RAND()*(20000-7300+1)+7300), GETDATE()),  -- Random birth date between 20-55 years ago
    '+1' + CAST(FLOOR(RAND()*(9999999999-1000000000+1)+1000000000) AS VARCHAR(10)),
    CONCAT(FLOOR(RAND()*999 + 1), ' ', (SELECT TOP 1 Name FROM @StreetNames ORDER BY NEWID()), ', ', (SELECT TOP 1 Name FROM @Cities ORDER BY NEWID()), ', ', (SELECT TOP 1 Abbr FROM @States ORDER BY NEWID()), ' ', (SELECT TOP 1 Code FROM @States ORDER BY NEWID())),
    CASE WHEN u.FirstName IN (SELECT Name FROM @MaleFirstNames) THEN 'Male' ELSE 'Female' END,
    (SELECT TOP 1 bt FROM (VALUES('A+'),('A-'),('B+'),('B-'),('O+'),('O-'),('AB+'),('AB-')) AS blood(bt) ORDER BY NEWID()),
    (SELECT TOP 1 Name FROM @MaleFirstNames ORDER BY NEWID()) + ' ' + (SELECT TOP 1 Name FROM @LastNames ORDER BY NEWID()),
    '+1' + CAST(FLOOR(RAND()*(9999999999-1000000000+1)+1000000000) AS VARCHAR(10))
FROM Users u
WHERE u.RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'Patient');
GO


-- Insert Doctor Availability Slots (3 slots for each of 30 days = 90 slots)
DECLARE @k INT = -5; -- Start 5 days ago
DECLARE @DoctorRoleIdForSlots INT;
SELECT @DoctorRoleIdForSlots = RoleID FROM Roles WHERE RoleName = 'Doctor';

WHILE @k < 25 -- Loop for 30 days (from -5 to 24)
BEGIN
    DECLARE @currentDate DATE = DATEADD(DAY, @k, GETDATE());

    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked)
    SELECT TOP 1 UserID, @currentDate, '09:00:00', '09:30:00', 0 FROM Users WHERE RoleID = @DoctorRoleIdForSlots ORDER BY NEWID();
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked)
    SELECT TOP 1 UserID, @currentDate, '11:00:00', '11:30:00', 0 FROM Users WHERE RoleID = @DoctorRoleIdForSlots ORDER BY NEWID();
    INSERT INTO DoctorAvailabilitySlots (DoctorUserID, SlotDate, StartTime, EndTime, IsBooked)
    SELECT TOP 1 UserID, @currentDate, '14:00:00', '14:30:00', 0 FROM Users WHERE RoleID = @DoctorRoleIdForSlots ORDER BY NEWID();

    SET @k = @k + 1;
END;
GO

-- Insert Appointments (50 entries)
DECLARE @PatientRoleIdForAppt INT;
SELECT @PatientRoleIdForAppt = RoleID FROM Roles WHERE RoleName = 'Patient';
DECLARE @AvailableSlots TABLE (SlotID INT, DoctorUserID INT, SlotDateTime DATETIME2);

INSERT INTO @AvailableSlots (SlotID, DoctorUserID, SlotDateTime)
SELECT TOP 50 AvailabilitySlotID, DoctorUserID, CAST(SlotDate AS DATETIME) + CAST(StartTime AS DATETIME)
FROM DoctorAvailabilitySlots
WHERE IsBooked = 0 AND SlotDate <= DATEADD(DAY, 20, GETDATE())
ORDER BY NEWID();

DECLARE @slotIdToBook INT;
DECLARE cur CURSOR FOR SELECT SlotID FROM @AvailableSlots;
OPEN cur;
FETCH NEXT FROM cur INTO @slotIdToBook;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO Appointments (PatientUserID, DoctorUserID, AvailabilitySlotID, AppointmentDateTime, Status, AppointmentNotes)
    SELECT
        (SELECT TOP 1 UserID FROM Users WHERE RoleID = @PatientRoleIdForAppt ORDER BY NEWID()),
        s.DoctorUserID, s.SlotID, s.SlotDateTime,
        CASE WHEN s.SlotDateTime < GETDATE() THEN (CASE FLOOR(RAND()*3) WHEN 0 THEN 'Completed' WHEN 1 THEN 'Cancelled' ELSE 'No-Show' END) ELSE 'Scheduled' END,
        'Routine checkup. Discussed adherence and overall health.'
    FROM @AvailableSlots s WHERE s.SlotID = @slotIdToBook;

    UPDATE DoctorAvailabilitySlots SET IsBooked = 1 WHERE AvailabilitySlotID = @slotIdToBook;
    FETCH NEXT FROM cur INTO @slotIdToBook;
END;
CLOSE cur;
DEALLOCATE cur;
GO


-- Insert ARV Treatments (60 entries based on 'Completed' appointments)
INSERT INTO ARVTreatments (PatientUserID, DoctorUserID, AppointmentID, Regimen, StartDate, EndDate, Adherence, SideEffects, Notes, IsActive)
SELECT TOP 60
    a.PatientUserID, a.DoctorUserID, a.AppointmentID,
    (SELECT TOP 1 regimen FROM (VALUES
        ('Biktarvy (BIC/FTC/TAF)'), ('Triumeq (ABC/3TC/DTG)'), ('Genvoya (EVG/c/FTC/TAF)'),
        ('Atripla (TDF/FTC/EFV)'), ('Descovy (FTC/TAF) + Tivicay (DTG)')) AS r(regimen) ORDER BY NEWID()),
    a.AppointmentDateTime, NULL,
    (SELECT TOP 1 adh FROM (VALUES('Excellent'),('Good'),('Fair'),('Poor')) AS ad(adh) ORDER BY NEWID()),
    CASE WHEN RAND() > 0.7 THEN 'Patient reported mild, transient nausea for the first week.' ELSE NULL END,
    'Standard first-line ARV treatment protocol initiated.', 1
FROM Appointments a WHERE a.Status = 'Completed' ORDER BY NEWID();
GO

-- Insert Medication Routines (80 entries)
INSERT INTO MedicationRoutines (PatientUserID, DoctorUserID, ARVTreatmentID, MedicationName, Dosage, TimeOfDay, StartDate, EndDate, IsActive)
SELECT TOP 80
    art.PatientUserID, art.DoctorUserID, art.ARVTreatmentID, art.Regimen, 'One tablet daily',
    (CASE FLOOR(RAND()*3) WHEN 0 THEN '08:00:00' WHEN 1 THEN '10:00:00' ELSE '20:00:00' END),
    art.StartDate, art.EndDate, 1
FROM ARVTreatments art WHERE art.IsActive = 1 ORDER BY NEWID();
GO

-- Insert Notifications (100 entries)
INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, RelatedEntityType, CreatedAt)
SELECT TOP 100
    u.UserID,
    CASE FLOOR(RAND()*3) WHEN 0 THEN 'APPOINTMENT_REMINDER' WHEN 1 THEN 'MEDICATION_REMINDER' ELSE 'SYSTEM_NOTIFICATION' END,
    CASE FLOOR(RAND()*3)
        WHEN 0 THEN 'Upcoming Appointment Reminder'
        WHEN 1 THEN 'Time to Take Your Medication'
        ELSE 'Clinic Policy Update'
    END,
    CASE FLOOR(RAND()*3)
        WHEN 0 THEN 'Just a friendly reminder about your upcoming appointment.'
        WHEN 1 THEN 'This is your reminder to take your daily medication. Staying adherent is key to your health.'
        ELSE 'Please review the updated clinic policies in the patient portal.'
    END,
    CASE WHEN RAND() > 0.5 THEN 1 ELSE 0 END,
    CASE FLOOR(RAND()*3) WHEN 0 THEN 'LOW' WHEN 1 THEN 'MEDIUM' ELSE 'HIGH' END,
    CASE FLOOR(RAND()*3) WHEN 0 THEN 'APPOINTMENT' WHEN 1 THEN 'MEDICATION' ELSE 'SYSTEM' END,
    DATEADD(DAY, -FLOOR(RAND()*30), GETDATE())
FROM Users u
WHERE u.RoleID = (SELECT RoleID FROM Roles WHERE RoleName = 'Patient')
ORDER BY NEWID();
GO

PRINT 'Mock data generation with realistic names completed successfully!';
GO
-- Insert test notifications for debugging
USE hiv_clinic;
GO

-- Get the patient user ID
DECLARE @PatientUserId INT;
SELECT @PatientUserId = UserID FROM Users WHERE Username = 'patient1';

-- Clean up any existing test notifications
DELETE FROM Notifications WHERE UserID = @PatientUserId AND Title LIKE 'DEBUG%';

-- Insert test notifications
INSERT INTO Notifications (UserID, Type, Title, Message, IsRead, Priority, CreatedAt, UpdatedAt)
VALUES 
    (@PatientUserId, 'SYSTEM_NOTIFICATION', 'DEBUG: Test Notification 1', 'This is the first debug notification', 0, 'MEDIUM', GETDATE(), GETDATE()),
    (@PatientUserId, 'SYSTEM_NOTIFICATION', 'DEBUG: Test Notification 2', 'This is the second debug notification', 0, 'HIGH', GETDATE(), GETDATE()),
    (@PatientUserId, 'SYSTEM_NOTIFICATION', 'DEBUG: Test Notification 3', 'This is the third debug notification', 0, 'LOW', GETDATE(), GETDATE());

-- Show the inserted notifications
SELECT NotificationID, UserID, Type, Title, Message, IsRead, CreatedAt 
FROM Notifications 
WHERE UserID = @PatientUserId 
AND Title LIKE 'DEBUG%'
ORDER BY CreatedAt DESC;

PRINT 'Debug notifications inserted for patient1';
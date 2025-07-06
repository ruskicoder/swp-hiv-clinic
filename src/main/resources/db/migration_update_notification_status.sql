-- Migration script to update existing notifications with null status
-- This should be run once after the schema updates

USE hiv_clinic;
GO

-- Update existing notifications with null status to have proper status values
UPDATE Notifications 
SET status = CASE 
    WHEN IsRead = 1 THEN 'READ'
    WHEN SentAt IS NOT NULL THEN 'SENT'
    ELSE 'PENDING'
END
WHERE status IS NULL;

-- Set default status for any remaining null values
UPDATE Notifications 
SET status = 'PENDING'
WHERE status IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as TotalNotifications,
    SUM(CASE WHEN IsRead = 1 THEN 1 ELSE 0 END) as ReadNotifications,
    SUM(CASE WHEN status = 'READ' THEN 1 ELSE 0 END) as StatusReadNotifications,
    SUM(CASE WHEN status = 'SENT' THEN 1 ELSE 0 END) as StatusSentNotifications,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as StatusPendingNotifications
FROM Notifications;
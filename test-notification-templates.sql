-- Test notification templates with template variables
USE hiv_clinic;
GO

-- Clean up existing test templates
DELETE FROM NotificationTemplates WHERE Name LIKE 'TEST_%';

-- Insert test notification templates with various template variables
INSERT INTO NotificationTemplates (Name, Type, Subject, Body, Priority, IsActive, CreatedAt, UpdatedAt)
VALUES 
-- Test template with basic patient and doctor variables
('TEST_BASIC_TEMPLATE', 'GENERAL', 
 'Hello {{patientName}}', 
 'Dear {{patientName}},\n\nThis is a message from {{doctorName}} at {{clinicName}}.\n\nBest regards,\n{{doctorName}}', 
 'MEDIUM', 1, GETDATE(), GETDATE()),

-- Test template with appointment variables
('TEST_APPOINTMENT_REMINDER', 'APPOINTMENT_REMINDER', 
 'Appointment Reminder for {{patientName}}', 
 'Dear {{patientFirstName}},\n\nThis is a reminder that you have an appointment with {{doctorName}} scheduled for {{appointmentDate}} at {{appointmentTime}}.\n\nPlease arrive 15 minutes early.\n\nLocation: {{clinicName}}\nAddress: {{clinicAddress}}\nPhone: {{clinicPhone}}\n\nIf you need to reschedule, please contact us as soon as possible.\n\nThank you,\n{{doctorName}}', 
 'HIGH', 1, GETDATE(), GETDATE()),

-- Test template with custom message variable
('TEST_CUSTOM_MESSAGE', 'GENERAL', 
 'Important Message from {{doctorName}}', 
 'Dear {{patientName}},\n\n{{message}}\n\nFor any questions, please contact {{clinicName}} at {{clinicPhone}}.\n\nBest regards,\n{{doctorName}}\n{{clinicName}}', 
 'MEDIUM', 1, GETDATE(), GETDATE()),

-- Test template with all available variables
('TEST_ALL_VARIABLES', 'GENERAL', 
 'Complete Information for {{patientName}}', 
 'Dear {{patientFirstName}} {{patientLastName}},\n\nFrom: {{doctorFirstName}} {{doctorLastName}} ({{doctorName}})\nClinic: {{clinicName}}\nAddress: {{clinicAddress}}\nPhone: {{clinicPhone}}\nEmail: {{clinicEmail}}\n\nAppointment Details:\n- Date: {{appointmentDate}} ({{appointmentDateReadable}})\n- Time: {{appointmentTime}} ({{appointmentTimeReadable}})\n- Status: {{appointmentStatus}}\n\nMessage:\n{{message}}\n\nGenerated on: {{todayDate}}\nCurrent time: {{currentTime}}\nYear: {{currentYear}}\n\nBest regards,\n{{doctorName}}', 
 'MEDIUM', 1, GETDATE(), GETDATE()),

-- Test template with mixed bracket formats
('TEST_MIXED_BRACKETS', 'GENERAL', 
 'Mixed Format Test for {{patientName}}', 
 'Dear {{patientName}},\n\nThis template tests mixed bracket formats:\n- Double brackets: {{doctorName}}\n- Single brackets: {clinicName}\n- Mixed: {{patientFirstName}} from {clinicPhone}\n\nCurrent date: {{currentDate}}\nToday: {todayDate}\n\nBest regards,\n{{doctorName}}', 
 'LOW', 1, GETDATE(), GETDATE());

-- Show the inserted templates
SELECT TemplateId, Name, Type, Subject, LEFT(Body, 100) + '...' AS BodyPreview, Priority, IsActive
FROM NotificationTemplates 
WHERE Name LIKE 'TEST_%'
ORDER BY Name;

PRINT 'Test notification templates inserted successfully';
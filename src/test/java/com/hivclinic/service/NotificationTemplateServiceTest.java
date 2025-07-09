package com.hivclinic.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class NotificationTemplateServiceTest {

    private NotificationTemplateService notificationTemplateService;

    @BeforeEach
    void setUp() {
        notificationTemplateService = new NotificationTemplateService();
    }

    @Test
    void testBasicTemplateProcessing() {
        // Test template with basic variables
        String template = "Dear {{patientName}}, your appointment with {{doctorName}} is confirmed.";
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "John Doe");
        variables.put("doctorName", "Dr. Smith");

        String result = notificationTemplateService.processTemplate(template, variables);
        
        assertEquals("Dear John Doe, your appointment with Dr. Smith is confirmed.", result);
    }

    @Test
    void testAppointmentTemplateProcessing() {
        // Test template with appointment variables
        String template = "Dear {{patientFirstName}}, your appointment is scheduled for {{appointmentDate}} at {{appointmentTime}}.";
        Map<String, String> variables = new HashMap<>();
        variables.put("patientFirstName", "John");
        variables.put("appointmentDate", "2025-07-08");
        variables.put("appointmentTime", "14:00");

        String result = notificationTemplateService.processTemplate(template, variables);
        
        assertEquals("Dear John, your appointment is scheduled for 2025-07-08 at 14:00.", result);
    }

    @Test
    void testMixedBracketFormats() {
        // Test template with both {{}} and {} formats
        String template = "Hello {{patientName}}, welcome to {clinicName}. Your doctor is {{doctorName}}.";
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "Jane Smith");
        variables.put("clinicName", "HIV Clinic");
        variables.put("doctorName", "Dr. Johnson");

        String result = notificationTemplateService.processTemplate(template, variables);
        
        assertEquals("Hello Jane Smith, welcome to HIV Clinic. Your doctor is Dr. Johnson.", result);
    }

    @Test
    void testCustomMessageVariable() {
        // Test template with custom message variable
        String template = "Dear {{patientName}}, {{message}} Best regards, {{doctorName}}";
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "Alice Johnson");
        variables.put("message", "Please remember to take your medication as prescribed.");
        variables.put("doctorName", "Dr. Brown");

        String result = notificationTemplateService.processTemplate(template, variables);
        
        assertEquals("Dear Alice Johnson, Please remember to take your medication as prescribed. Best regards, Dr. Brown", result);
    }

    @Test
    void testAllVariableTypes() {
        // Test template with all common variable types
        String template = "Patient: {{patientName}} ({{patientFirstName}} {{patientLastName}})\n" +
                         "Doctor: {{doctorName}} ({{doctorFirstName}} {{doctorLastName}})\n" +
                         "Clinic: {{clinicName}}\n" +
                         "Appointment: {{appointmentDate}} at {{appointmentTime}}\n" +
                         "Status: {{appointmentStatus}}\n" +
                         "Message: {{message}}\n" +
                         "Generated: {{todayDate}}";
        
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "John Doe");
        variables.put("patientFirstName", "John");
        variables.put("patientLastName", "Doe");
        variables.put("doctorName", "Dr. Smith");
        variables.put("doctorFirstName", "Dr.");
        variables.put("doctorLastName", "Smith");
        variables.put("clinicName", "HIV Clinic");
        variables.put("appointmentDate", "2025-07-08");
        variables.put("appointmentTime", "14:00");
        variables.put("appointmentStatus", "CONFIRMED");
        variables.put("message", "Please arrive 15 minutes early.");
        variables.put("todayDate", "July 7, 2025");

        String result = notificationTemplateService.processTemplate(template, variables);
        
        String expected = "Patient: John Doe (John Doe)\n" +
                         "Doctor: Dr. Smith (Dr. Smith)\n" +
                         "Clinic: HIV Clinic\n" +
                         "Appointment: 2025-07-08 at 14:00\n" +
                         "Status: CONFIRMED\n" +
                         "Message: Please arrive 15 minutes early.\n" +
                         "Generated: July 7, 2025";
        
        assertEquals(expected, result);
    }

    @Test
    void testMissingVariables() {
        // Test template with missing variables (should remain unprocessed)
        String template = "Dear {{patientName}}, your appointment with {{doctorName}} is at {{missingVariable}}.";
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "John Doe");
        variables.put("doctorName", "Dr. Smith");

        String result = notificationTemplateService.processTemplate(template, variables);
        
        assertEquals("Dear John Doe, your appointment with Dr. Smith is at {{missingVariable}}.", result);
    }

    @Test
    void testEmptyVariables() {
        // Test template with empty variables
        String template = "Dear {{patientName}}, message: {{message}}";
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "John Doe");
        variables.put("message", ""); // Empty message

        String result = notificationTemplateService.processTemplate(template, variables);
        
        assertEquals("Dear John Doe, message: ", result);
    }

    @Test
    void testNullTemplate() {
        // Test null template
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "John Doe");

        String result = notificationTemplateService.processTemplate(null, variables);
        
        assertEquals("", result);
    }

    @Test
    void testEmptyTemplate() {
        // Test empty template
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "John Doe");

        String result = notificationTemplateService.processTemplate("", variables);
        
        assertEquals("", result);
    }

    @Test
    void testNoVariables() {
        // Test template with no variables provided
        String template = "Dear {{patientName}}, your appointment is confirmed.";
        
        String result = notificationTemplateService.processTemplate(template, null);
        
        assertEquals("Dear {{patientName}}, your appointment is confirmed.", result);
    }
}
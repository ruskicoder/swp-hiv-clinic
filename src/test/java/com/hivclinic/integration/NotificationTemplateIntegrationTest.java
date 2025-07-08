package com.hivclinic.integration;

import com.hivclinic.model.NotificationTemplate;
import com.hivclinic.repository.NotificationTemplateRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class NotificationTemplateIntegrationTest {

    @Autowired
    private NotificationTemplateRepository notificationTemplateRepository;

    @Test
    void testTemplateCreationWithVariables() {
        // Create test template with template variables
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Integration Test Template");
        template.setType(NotificationTemplate.NotificationType.GENERAL);
        template.setSubject("Hello {{patientName}}");
        template.setBody("Dear {{patientFirstName}},\n\nThis is a message from {{doctorName}} at {{clinicName}}.\n\nYour appointment is scheduled for {{appointmentDate}} at {{appointmentTime}}.\n\nCustom message: {{message}}\n\nBest regards,\n{{doctorName}}");
        template.setPriority(NotificationTemplate.Priority.MEDIUM);
        template.setIsActive(true);

        NotificationTemplate savedTemplate = notificationTemplateRepository.save(template);
        assertNotNull(savedTemplate.getTemplateId());

        // Verify template was saved with variables intact
        Optional<NotificationTemplate> retrievedTemplate = notificationTemplateRepository.findById(savedTemplate.getTemplateId());
        assertTrue(retrievedTemplate.isPresent());
        
        String subject = retrievedTemplate.get().getSubject();
        String body = retrievedTemplate.get().getBody();
        
        // Verify subject contains template variables
        assertTrue(subject.contains("{{patientName}}"));
        
        // Verify body contains all expected template variables
        assertTrue(body.contains("{{patientFirstName}}"));
        assertTrue(body.contains("{{doctorName}}"));
        assertTrue(body.contains("{{clinicName}}"));
        assertTrue(body.contains("{{appointmentDate}}"));
        assertTrue(body.contains("{{appointmentTime}}"));
        assertTrue(body.contains("{{message}}"));
        
        System.out.println("Template integration test passed - template saved successfully with variables");
    }

    @Test
    void testTemplateVariableStorage() {
        // Test that focuses on template variable storage and retrieval
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Variable Storage Test Template");
        template.setType(NotificationTemplate.NotificationType.GENERAL);
        template.setSubject("Test for {{patientName}}");
        template.setBody("Dear {{patientFirstName}} {{patientLastName}},\n\n" +
                        "From: {{doctorName}}\n" +
                        "Clinic: {{clinicName}}\n" +
                        "Date: {{currentDate}}\n" +
                        "Time: {{currentTime}}\n" +
                        "Message: {{message}}\n\n" +
                        "Best regards,\n{{doctorName}}");
        template.setPriority(NotificationTemplate.Priority.MEDIUM);
        template.setIsActive(true);

        NotificationTemplate savedTemplate = notificationTemplateRepository.save(template);
        assertNotNull(savedTemplate.getTemplateId());

        // Verify template was saved with variables intact
        Optional<NotificationTemplate> retrievedTemplate = notificationTemplateRepository.findById(savedTemplate.getTemplateId());
        assertTrue(retrievedTemplate.isPresent());
        
        String body = retrievedTemplate.get().getBody();
        assertTrue(body.contains("{{patientFirstName}}"));
        assertTrue(body.contains("{{patientLastName}}"));
        assertTrue(body.contains("{{doctorName}}"));
        assertTrue(body.contains("{{clinicName}}"));
        assertTrue(body.contains("{{currentDate}}"));
        assertTrue(body.contains("{{currentTime}}"));
        assertTrue(body.contains("{{message}}"));
        
        System.out.println("Template variable storage test passed - all variables preserved in database");
    }
}
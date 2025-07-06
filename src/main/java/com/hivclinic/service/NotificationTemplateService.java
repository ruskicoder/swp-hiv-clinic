package com.hivclinic.service;

import com.hivclinic.model.NotificationTemplate;
import com.hivclinic.repository.NotificationTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificationTemplateService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationTemplateService.class);
    
    @Autowired
    private NotificationTemplateRepository notificationTemplateRepository;
    
    /**
     * Get all active notification templates
     */
    @Transactional(readOnly = true)
    public List<NotificationTemplate> getAllActiveTemplates() {
        return notificationTemplateRepository.findByIsActiveTrue();
    }
    
    /**
     * Get templates by type
     */
    @Transactional(readOnly = true)
    public List<NotificationTemplate> getTemplatesByType(NotificationTemplate.NotificationType type) {
        return notificationTemplateRepository.findByTypeAndIsActiveTrue(type);
    }
    
    /**
     * Get template by ID
     */
    @Transactional(readOnly = true)
    public Optional<NotificationTemplate> getTemplateById(Long templateId) {
        return notificationTemplateRepository.findById(templateId);
    }
    
    /**
     * Create a new notification template
     */
    @Transactional
    public NotificationTemplate createTemplate(NotificationTemplate template) {
        logger.info("Creating new notification template: {}", template.getName());
        return notificationTemplateRepository.save(template);
    }
    
    /**
     * Update an existing notification template
     */
    @Transactional
    public Optional<NotificationTemplate> updateTemplate(Long templateId, NotificationTemplate updatedTemplate) {
        return notificationTemplateRepository.findById(templateId)
                .map(template -> {
                    template.setName(updatedTemplate.getName());
                    template.setType(updatedTemplate.getType());
                    template.setSubject(updatedTemplate.getSubject());
                    template.setBody(updatedTemplate.getBody());
                    template.setPriority(updatedTemplate.getPriority());
                    template.setIsActive(updatedTemplate.getIsActive());
                    
                    logger.info("Updated notification template: {}", template.getName());
                    return notificationTemplateRepository.save(template);
                });
    }
    
    /**
     * Deactivate a notification template
     */
    @Transactional
    public boolean deactivateTemplate(Long templateId) {
        return notificationTemplateRepository.findById(templateId)
                .map(template -> {
                    template.setIsActive(false);
                    notificationTemplateRepository.save(template);
                    logger.info("Deactivated notification template: {}", template.getName());
                    return true;
                })
                .orElse(false);
    }
    
    /**
     * Delete a notification template
     */
    @Transactional
    public boolean deleteTemplate(Long templateId) {
        if (notificationTemplateRepository.existsById(templateId)) {
            notificationTemplateRepository.deleteById(templateId);
            logger.info("Deleted notification template with ID: {}", templateId);
            return true;
        }
        return false;
    }
    
    /**
     * Search templates by name
     */
    @Transactional(readOnly = true)
    public List<NotificationTemplate> searchTemplatesByName(String name) {
        return notificationTemplateRepository.findByNameContainingIgnoreCaseAndIsActiveTrue(name);
    }
    
    /**
     * Process template variables - supports both {{var}} and {var} formats
     */
    public String processTemplate(String templateBody, java.util.Map<String, String> variables) {
        String processedBody = templateBody;
        
        if (variables != null && !variables.isEmpty()) {
            for (java.util.Map.Entry<String, String> entry : variables.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue() != null ? entry.getValue() : "";
                
                // Support both {{variable}} and {variable} formats
                String placeholder1 = "{{" + key + "}}";
                String placeholder2 = "{" + key + "}";
                
                processedBody = processedBody.replace(placeholder1, value);
                processedBody = processedBody.replace(placeholder2, value);
            }
        }
        
        return processedBody;
    }
}
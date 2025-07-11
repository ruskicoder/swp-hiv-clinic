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
     * Enhanced with better error handling and logging
     */
    public String processTemplate(String templateBody, java.util.Map<String, String> variables) {
        if (templateBody == null || templateBody.trim().isEmpty()) {
            logger.warn("Template body is null or empty, returning empty string");
            return "";
        }
        
        String processedBody = templateBody;
        logger.debug("Processing template with {} characters and {} variables",
                    templateBody.length(), variables != null ? variables.size() : 0);
        
        if (variables != null && !variables.isEmpty()) {
            int totalReplacements = 0;
            java.util.Set<String> unresolvedPlaceholders = new java.util.HashSet<>();
            
            for (java.util.Map.Entry<String, String> entry : variables.entrySet()) {
                String key = entry.getKey();
                String value = entry.getValue() != null ? entry.getValue() : "";
                
                // Support both {{variable}} and {variable} formats
                String placeholder1 = "{{" + key + "}}";
                String placeholder2 = "{" + key + "}";
                
                // Count occurrences before replacement
                int count1 = countOccurrences(processedBody, placeholder1);
                int count2 = countOccurrences(processedBody, placeholder2);
                
                // Perform replacements
                processedBody = processedBody.replace(placeholder1, value);
                processedBody = processedBody.replace(placeholder2, value);
                
                int replacements = count1 + count2;
                totalReplacements += replacements;
                
                if (replacements > 0) {
                    logger.debug("Replaced {} occurrences of '{}' with '{}'",
                               replacements, key, value.length() > 50 ? value.substring(0, 50) + "..." : value);
                }
            }
            
            // Check for unresolved placeholders
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\{\\{([^}]+)\\}\\}|\\{([^}]+)\\}");
            java.util.regex.Matcher matcher = pattern.matcher(processedBody);
            
            while (matcher.find()) {
                String placeholder = matcher.group(0);
                String variableName = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
                unresolvedPlaceholders.add(placeholder);
                logger.warn("Unresolved placeholder found: '{}' (variable: '{}')", placeholder, variableName);
            }
            
            logger.info("Template processing completed: {} total replacements made, {} unresolved placeholders",
                       totalReplacements, unresolvedPlaceholders.size());
            
            if (!unresolvedPlaceholders.isEmpty()) {
                logger.warn("Unresolved placeholders in template: {}", unresolvedPlaceholders);
            }
        } else {
            logger.debug("No variables provided for template processing");
        }
        
        return processedBody;
    }
    
    /**
     * Count occurrences of a substring in a string
     */
    private int countOccurrences(String text, String substring) {
        if (text == null || substring == null || substring.isEmpty()) {
            return 0;
        }
        int count = 0;
        int index = 0;
        while ((index = text.indexOf(substring, index)) != -1) {
            count++;
            index += substring.length();
        }
        return count;
    }
}
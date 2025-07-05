package com.hivclinic.controller;

import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.Notification;
import com.hivclinic.model.NotificationTemplate;
import com.hivclinic.service.DoctorNotificationService;
import com.hivclinic.service.NotificationService;
import com.hivclinic.service.NotificationTemplateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private NotificationTemplateService notificationTemplateService;
    
    @Autowired
    private DoctorNotificationService doctorNotificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(@RequestParam Integer userId, @RequestParam(required = false) String status) {
        List<NotificationDto> notifications;
        if ("unread".equalsIgnoreCase(status)) {
            notifications = notificationService.getUnreadNotificationsByUserId(userId);
        } else {
            notifications = notificationService.getNotificationsByUserId(userId);
        }
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable Integer id) {
        NotificationDto notification = notificationService.markAsRead(id);
        return notification != null ? ResponseEntity.ok(notification) : ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam Integer userId) {
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
    
    // Template management endpoints
    
    @GetMapping("/templates")
    public ResponseEntity<List<NotificationTemplate>> getAllTemplates() {
        List<NotificationTemplate> templates = notificationTemplateService.getAllActiveTemplates();
        return ResponseEntity.ok(templates);
    }
    
    @GetMapping("/templates/{type}")
    public ResponseEntity<List<NotificationTemplate>> getTemplatesByType(@PathVariable String type) {
        try {
            NotificationTemplate.NotificationType notificationType =
                NotificationTemplate.NotificationType.valueOf(type.toUpperCase());
            List<NotificationTemplate> templates = notificationTemplateService.getTemplatesByType(notificationType);
            return ResponseEntity.ok(templates);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid notification type: {}", type);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/templates")
    public ResponseEntity<NotificationTemplate> createTemplate(@RequestBody NotificationTemplate template) {
        try {
            NotificationTemplate createdTemplate = notificationTemplateService.createTemplate(template);
            return ResponseEntity.ok(createdTemplate);
        } catch (Exception e) {
            logger.error("Error creating notification template: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/templates/{id}")
    public ResponseEntity<NotificationTemplate> updateTemplate(@PathVariable Integer id,
                                                              @RequestBody NotificationTemplate template) {
        try {
            return notificationTemplateService.updateTemplate(id, template)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating notification template: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @DeleteMapping("/templates/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Integer id) {
        boolean deleted = notificationTemplateService.deleteTemplate(id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }
    
    // Doctor notification management endpoints
    
    @GetMapping("/doctor/templates")
    public ResponseEntity<List<NotificationTemplate>> getDoctorNotificationTemplatesByType(@RequestParam String type) {
        List<NotificationTemplate> templates = doctorNotificationService.getNotificationTemplatesByType(type);
        return ResponseEntity.ok(templates);
    }
    
    @PostMapping("/doctor/send")
    public ResponseEntity<Map<String, Object>> sendNotificationToPatient(
            @RequestParam Long doctorId,
            @RequestParam Long patientId,
            @RequestParam Long templateId,
            @RequestBody(required = false) Map<String, String> variables) {
        
        try {
            boolean success = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Notification sent successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to send notification"
                ));
            }
        } catch (Exception e) {
            logger.error("Error sending notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/doctor/history/{patientId}")
    public ResponseEntity<List<Notification>> getNotificationHistory(
            @RequestParam Long doctorId,
            @PathVariable Long patientId) {
        
        try {
            List<Notification> history = doctorNotificationService.getNotificationHistory(doctorId, patientId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error getting notification history: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/doctor/{notificationId}/unsend")
    public ResponseEntity<Map<String, Object>> unsendNotification(
            @PathVariable Long notificationId,
            @RequestParam Long doctorId) {
        
        try {
            boolean success = doctorNotificationService.unsendNotification(notificationId, doctorId);
            
            if (success) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Notification cancelled successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to cancel notification"
                ));
            }
        } catch (Exception e) {
            logger.error("Error unsending notification: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Error: " + e.getMessage()
            ));
        }
    }
    
    @GetMapping("/doctor/patients-with-appointments")
    public ResponseEntity<List<Map<String, Object>>> getPatientsWithAppointments(@RequestParam Long doctorId) {
        try {
            List<Map<String, Object>> patients = doctorNotificationService.getPatientsWithAppointments(doctorId);
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            logger.error("Error getting patients with appointments: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
}

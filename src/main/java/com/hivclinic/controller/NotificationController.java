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
    public ResponseEntity<List<NotificationDto>> getNotifications(@AuthenticationPrincipal UserDetails userDetails, @RequestParam(required = false) String status) {
        Integer userId = ((com.hivclinic.config.CustomUserDetailsService.UserPrincipal) userDetails).getId();
        List<NotificationDto> notifications;
        if ("unread".equalsIgnoreCase(status)) {
            notifications = notificationService.getUnreadNotificationsByUserId(userId);
        } else {
            notifications = notificationService.getNotificationsByUserId(userId);
        }
        return ResponseEntity.ok(notifications);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(@PathVariable Integer id, @AuthenticationPrincipal UserDetails userDetails) {
        System.out.println("DEBUG: NotificationController.markAsRead called with id=" + id);
        System.out.println("DEBUG: UserDetails class: " + userDetails.getClass().getName());
        System.out.println("DEBUG: UserDetails: " + userDetails);
        
        Integer userId = ((com.hivclinic.config.CustomUserDetailsService.UserPrincipal) userDetails).getId();
        System.out.println("DEBUG: Extracted userId=" + userId);
        
        NotificationDto notification = notificationService.markAsRead(id, userId);
        System.out.println("DEBUG: Service returned notification=" + notification);
        
        boolean isSuccess = notification != null;
        System.out.println("DEBUG: Returning success=" + isSuccess);
        
        return notification != null ? ResponseEntity.ok(notification) : ResponseEntity.notFound().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        System.out.println("DEBUG: NotificationController.markAllAsRead called");
        
        try {
            Integer userId = ((com.hivclinic.config.CustomUserDetailsService.UserPrincipal) userDetails).getId();
            System.out.println("DEBUG: Extracted userId=" + userId);
            
            notificationService.markAllAsRead(userId);
            System.out.println("DEBUG: Successfully marked all notifications as read for userId=" + userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All notifications marked as read successfully"
            ));
        } catch (Exception e) {
            System.out.println("ERROR: Exception in markAllAsRead controller: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to mark all notifications as read: " + e.getMessage()
            ));
        }
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
    public ResponseEntity<NotificationTemplate> updateTemplate(@PathVariable Long id,
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
    public ResponseEntity<Void> deleteTemplate(@PathVariable Long id) {
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
        
        logger.info("POST /doctor/send called with doctorId={}, patientId={}, templateId={}, variables={}",
                   doctorId, patientId, templateId, variables);
        
        try {
            boolean success = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);
            
            if (success) {
                logger.info("Notification sent successfully from doctor {} to patient {}", doctorId, patientId);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Notification sent successfully"
                ));
            } else {
                logger.warn("Failed to send notification from doctor {} to patient {}", doctorId, patientId);
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Failed to send notification"
                ));
            }
        } catch (Exception e) {
            logger.error("Error sending notification from doctor {} to patient {}: {}",
                        doctorId, patientId, e.getMessage(), e);
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
    
    @GetMapping("/doctor/history")
    public ResponseEntity<List<Map<String, Object>>> getNotificationHistoryForDoctor(
            @RequestParam Long doctorId) {
        
        try {
            logger.info("Getting notification history for doctor {}", doctorId);
            List<Map<String, Object>> history = doctorNotificationService.getNotificationHistoryForDoctor(doctorId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            logger.error("Error getting notification history for doctor {}: {}", doctorId, e.getMessage(), e);
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
    
    @PostMapping("/bulk/unsend")
    public ResponseEntity<Map<String, Object>> bulkUnsendNotifications(
            @RequestBody List<Long> notificationIds,
            @RequestParam Long doctorId) {
        
        try {
            logger.info("Doctor {} attempting to bulk unsend {} notifications", doctorId, notificationIds.size());
            
            int successCount = 0;
            int failureCount = 0;
            List<String> errors = new java.util.ArrayList<>();
            
            for (Long notificationId : notificationIds) {
                try {
                    boolean success = doctorNotificationService.unsendNotification(notificationId, doctorId);
                    if (success) {
                        successCount++;
                    } else {
                        failureCount++;
                        errors.add("Failed to unsend notification " + notificationId);
                    }
                } catch (Exception e) {
                    failureCount++;
                    errors.add("Error unsending notification " + notificationId + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", failureCount == 0);
            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("message", String.format("Bulk unsend completed: %d successful, %d failed", successCount, failureCount));
            
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error in bulk unsend operation: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Bulk unsend operation failed: " + e.getMessage()
            ));
        }
    }
    
    @PostMapping("/bulk/delete")
    public ResponseEntity<Map<String, Object>> bulkDeleteNotifications(
            @RequestBody List<Long> notificationIds,
            @RequestParam Long doctorId) {
        
        try {
            logger.info("Doctor {} attempting to bulk delete {} notifications", doctorId, notificationIds.size());
            
            int successCount = 0;
            int failureCount = 0;
            List<String> errors = new java.util.ArrayList<>();
            
            for (Long notificationId : notificationIds) {
                try {
                    boolean success = doctorNotificationService.deleteNotification(notificationId, doctorId);
                    if (success) {
                        successCount++;
                    } else {
                        failureCount++;
                        errors.add("Failed to delete notification " + notificationId);
                    }
                } catch (Exception e) {
                    failureCount++;
                    errors.add("Error deleting notification " + notificationId + ": " + e.getMessage());
                }
            }
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", failureCount == 0);
            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("message", String.format("Bulk delete completed: %d successful, %d failed", successCount, failureCount));
            
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error in bulk delete operation: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Bulk delete operation failed: " + e.getMessage()
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

package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.NotificationDto;
import com.hivclinic.dto.request.ReminderRequest;
import com.hivclinic.dto.request.TemplateRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Notification;
import com.hivclinic.model.NotificationTemplate;
import com.hivclinic.service.NotificationService;
import com.hivclinic.service.ReminderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*", maxAge = 3600)
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private ReminderService reminderService;

    // Get all notifications for a doctor
    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<NotificationDto>> getDoctorNotifications(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        List<NotificationDto> notifications = notificationService.getNotificationsForDoctor(userPrincipal.getId());
        return ResponseEntity.ok(notifications);
    }
    
    // Get notifications for a doctor prioritized by appointment status
    @GetMapping("/doctor/prioritized")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<NotificationDto>> getDoctorNotificationsPrioritized(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        List<NotificationDto> notifications = notificationService.getNotificationsForDoctorPrioritized(userPrincipal.getId());
        return ResponseEntity.ok(notifications);
    }
    
    // Get count of unread notifications for a doctor
    @GetMapping("/doctor/unread-count")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Long> getDoctorUnreadCount(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        long count = notificationService.countUnreadNotificationsForPatient(userPrincipal.getId());
        return ResponseEntity.ok(count);
    }

    // Mark a notification as read
    @PostMapping("/{notificationId}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(@PathVariable Integer notificationId) {
        notificationService.markNotificationAsRead(notificationId);
        return ResponseEntity.ok().build();
    }
    
    // Mark a notification as seen
    @PostMapping("/{notificationId}/seen")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsSeen(@PathVariable Integer notificationId) {
        notificationService.markNotificationAsSeen(notificationId);
        return ResponseEntity.ok().build();
    }

    // Send an appointment reminder
    @PostMapping("/send-reminder")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<NotificationDto> sendReminder(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody ReminderRequest reminderRequest) {
        Notification notification = notificationService.sendNotification(
            userPrincipal.getId(),
            reminderRequest.getPatientId(),
            reminderRequest.getMessage(),
            "APPOINTMENT_REMINDER"
        );
        return ResponseEntity.ok(NotificationDto.fromEntity(notification));
    }
    
    // Send a medication reminder
    @PostMapping("/send-medication-reminder")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<NotificationDto> sendMedicationReminder(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> request) {
        Integer patientId = (Integer) request.get("patientId");
        Integer routineId = (Integer) request.get("routineId");
        String message = (String) request.get("message");
        
        Notification notification = notificationService.sendMedicationReminder(
            userPrincipal.getId(),
            patientId,
            routineId,
            message
        );
        return ResponseEntity.ok(NotificationDto.fromEntity(notification));
    }
    
    // Send batch medication reminders
    @PostMapping("/send-batch-reminders")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<NotificationDto>> sendBatchReminders(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> request) {
        
        @SuppressWarnings("unchecked")
        List<Integer> patientIds = (List<Integer>) request.get("patientIds");
        String message = (String) request.get("message");
        String medicationDetails = (String) request.get("medicationDetails");
        
        List<Notification> notifications = notificationService.sendBatchMedicationReminders(
            userPrincipal.getId(),
            patientIds,
            message,
            medicationDetails
        );
        
        List<NotificationDto> dtos = notifications.stream()
            .map(NotificationDto::fromEntity)
            .toList();
            
        return ResponseEntity.ok(dtos);
    }

    // Retract a notification (remove from patient view)
    @PostMapping("/{notificationId}/retract")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> retractNotification(@PathVariable Integer notificationId) {
        notificationService.retractNotification(notificationId);
        return ResponseEntity.ok().build();
    }
    
    // Get notifications for patient
    @GetMapping("/patient")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<NotificationDto>> getPatientNotifications(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        List<NotificationDto> notifications = notificationService.getUnreadNotificationsForPatient(userPrincipal.getId());
        return ResponseEntity.ok(notifications);
    }
    
    // Get medication reminders for a patient
    @GetMapping("/patient/medication-reminders")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<List<NotificationDto>> getPatientMedicationReminders(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        List<NotificationDto> notifications = notificationService.getNotificationHistory(userPrincipal.getId()).stream()
            .filter(n -> "MEDICATION_REMINDER".equals(n.getType()))
            .toList();
        return ResponseEntity.ok(notifications);
    }
    
    // Mark all notifications as read for a patient
    @PostMapping("/mark-all-read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        List<NotificationDto> notifications = notificationService.getUnreadNotificationsForPatient(userPrincipal.getId());
        for (NotificationDto notification : notifications) {
            notificationService.markNotificationAsRead(notification.getNotificationId());
        }
        return ResponseEntity.ok().build();
    }

    // Notification template management
    @PostMapping("/templates")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<NotificationTemplate> createTemplate(
            @RequestBody TemplateRequest request,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        NotificationTemplate newTemplate = notificationService.createTemplate(
            request.getName(),
            request.getContent(),
            userPrincipal.getId()
        );
        return ResponseEntity.ok(newTemplate);
    }

    @GetMapping("/templates")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationTemplate>> getAllTemplates() {
        return ResponseEntity.ok(notificationService.getAllTemplates());
    }

    @PutMapping("/templates/{templateId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<NotificationTemplate> updateTemplate(
            @PathVariable Integer templateId,
            @RequestBody TemplateRequest request) {
        return ResponseEntity.ok(notificationService.updateTemplate(
            templateId,
            request.getName(),
            request.getContent()
        ));
    }

    @DeleteMapping("/templates/{templateId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Integer templateId) {
        notificationService.deleteTemplate(templateId);
        return ResponseEntity.ok().build();
    }

    // Notification history
    @GetMapping("/history/{patientId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<NotificationDto>> getNotificationHistory(@PathVariable Integer patientId) {
        return ResponseEntity.ok(notificationService.getNotificationHistory(patientId));
    }
    
    // Trigger automated medication reminders (could be called by a scheduler)
    @PostMapping("/process-medication-reminders")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SYSTEM')")
    public ResponseEntity<Void> processMedicationReminders() {
        notificationService.processAutomatedMedicationReminders();
        return ResponseEntity.ok().build();
    }
    
    // ================== MANAGER NOTIFICATION DASHBOARD ENDPOINTS ==================
    
    /**
     * Get all notifications (Admin/Manager access)
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getAllNotifications() {
        try {
            logger.debug("Fetching all notifications for admin/manager");
            List<NotificationDto> notifications = notificationService.getAllNotifications();
            logger.info("Retrieved {} notifications", notifications.size());
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            logger.error("Error fetching all notifications: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch notifications: " + e.getMessage()));
        }
    }
    
    /**
     * Get notification by ID (Admin/Manager/Doctor access)
     */
    @GetMapping("/{notificationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> getNotificationById(@PathVariable Integer notificationId) {
        try {
            logger.debug("Fetching notification with ID: {}", notificationId);
            return notificationService.getNotificationById(notificationId)
                    .map(notification -> ResponseEntity.ok(NotificationDto.fromEntity(notification)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching notification {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch notification: " + e.getMessage()));
        }
    }
    
    /**
     * Create notification (Admin/Manager/Doctor access)
     */
    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> createNotification(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            Integer patientId = (Integer) request.get("patientId");
            String type = (String) request.get("type");
            String message = (String) request.get("message");
            String payload = (String) request.get("payload");
            
            if (patientId == null || message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Patient ID and message are required"));
            }
            
            logger.info("Creating notification from {} to patient {}", userPrincipal.getUsername(), patientId);
            
            Notification notification = notificationService.createNotification(
                userPrincipal.getId(),
                patientId,
                type != null ? type : "GENERAL",
                message,
                payload
            );
            
            logger.info("Notification created successfully with ID: {}", notification.getNotificationId());
            return ResponseEntity.ok(NotificationDto.fromEntity(notification));
            
        } catch (Exception e) {
            logger.error("Error creating notification: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create notification: " + e.getMessage()));
        }
    }
    
    /**
     * Update notification (Admin/Manager/Doctor access)
     */
    @PutMapping("/{notificationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> updateNotification(
            @PathVariable Integer notificationId,
            @RequestBody Map<String, Object> request) {
        try {
            String type = (String) request.get("type");
            String message = (String) request.get("message");
            String payload = (String) request.get("payload");
            
            logger.info("Updating notification with ID: {}", notificationId);
            
            Notification notification = notificationService.updateNotification(notificationId, type, message, payload);
            
            logger.info("Notification updated successfully");
            return ResponseEntity.ok(NotificationDto.fromEntity(notification));
            
        } catch (Exception e) {
            logger.error("Error updating notification {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update notification: " + e.getMessage()));
        }
    }
    
    /**
     * Delete notification (Admin/Manager/Doctor access)
     */
    @DeleteMapping("/{notificationId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> deleteNotification(@PathVariable Integer notificationId) {
        try {
            logger.info("Deleting notification with ID: {}", notificationId);
            notificationService.deleteNotification(notificationId);
            logger.info("Notification deleted successfully");
            return ResponseEntity.ok(MessageResponse.success("Notification deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting notification {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to delete notification: " + e.getMessage()));
        }
    }
    
    /**
     * Check if notification can be retracted (Admin/Manager/Doctor access)
     */
    @GetMapping("/{notificationId}/can-retract")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> canRetractNotification(@PathVariable Integer notificationId) {
        try {
            logger.debug("Checking if notification {} can be retracted", notificationId);
            boolean canRetract = notificationService.canRetractNotification(notificationId);
            return ResponseEntity.ok(Map.of("canRetract", canRetract));
        } catch (Exception e) {
            logger.error("Error checking retraction status for notification {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to check retraction status: " + e.getMessage()));
        }
    }
    
    /**
     * Retract notification with reason (Admin/Manager/Doctor access)
     */
    @PostMapping("/{notificationId}/retract-with-reason")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> retractNotificationWithReason(
            @PathVariable Integer notificationId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                reason = "Retracted by " + userPrincipal.getUsername();
            }
            
            logger.info("Retracting notification {} with reason: {}", notificationId, reason);
            
            notificationService.retractNotificationWithReason(notificationId, reason);
            
            logger.info("Notification retracted successfully");
            return ResponseEntity.ok(MessageResponse.success("Notification retracted successfully"));
            
        } catch (Exception e) {
            logger.error("Error retracting notification {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to retract notification: " + e.getMessage()));
        }
    }
    
    /**
     * Update notification status (Admin/Manager/Doctor access)
     */
    @PutMapping("/{notificationId}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> updateNotificationStatus(
            @PathVariable Integer notificationId,
            @RequestBody Map<String, String> request) {
        try {
            String status = request.get("status");
            String failureReason = request.get("failureReason");
            
            if (status == null || status.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Status is required"));
            }
            
            logger.info("Updating notification {} status to: {}", notificationId, status);
            
            if (failureReason != null && !failureReason.trim().isEmpty()) {
                notificationService.updateNotificationStatusWithFailureReason(notificationId, status, failureReason);
            } else {
                notificationService.updateNotificationStatus(notificationId, status);
            }
            
            logger.info("Notification status updated successfully");
            return ResponseEntity.ok(MessageResponse.success("Notification status updated successfully"));
            
        } catch (Exception e) {
            logger.error("Error updating notification status for {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update notification status: " + e.getMessage()));
        }
    }
    
    // ================== AUTOMATED REMINDER CONTROL ENDPOINTS ==================
    
    /**
     * Send manual medication reminder (Admin/Manager/Doctor access)
     */
    @PostMapping("/send-manual-medication-reminder")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> sendManualMedicationReminder(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            Integer patientId = (Integer) request.get("patientId");
            Integer routineId = (Integer) request.get("routineId");
            String customMessage = (String) request.get("message");
            
            if (patientId == null || routineId == null) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Patient ID and routine ID are required"));
            }
            
            logger.info("Sending manual medication reminder from {} to patient {} for routine {}",
                       userPrincipal.getUsername(), patientId, routineId);
            
            Notification notification = reminderService.sendManualMedicationReminder(
                userPrincipal.getId(),
                patientId,
                routineId,
                customMessage
            );
            
            logger.info("Manual medication reminder sent successfully");
            return ResponseEntity.ok(NotificationDto.fromEntity(notification));
            
        } catch (Exception e) {
            logger.error("Error sending manual medication reminder: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to send manual medication reminder: " + e.getMessage()));
        }
    }
    
    /**
     * Send batch medication reminders (Admin/Manager/Doctor access)
     */
    @PostMapping("/send-batch-medication-reminders")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> sendBatchMedicationReminders(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> patientIds = (List<Integer>) request.get("patientIds");
            String message = (String) request.get("message");
            String medicationDetails = (String) request.get("medicationDetails");
            
            if (patientIds == null || patientIds.isEmpty() || message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Patient IDs and message are required"));
            }
            
            logger.info("Sending batch medication reminders from {} to {} patients",
                       userPrincipal.getUsername(), patientIds.size());
            
            List<Notification> notifications = reminderService.sendBatchMedicationReminders(
                userPrincipal.getId(),
                patientIds,
                message,
                medicationDetails
            );
            
            List<NotificationDto> notificationDtos = notifications.stream()
                    .map(NotificationDto::fromEntity)
                    .toList();
            
            logger.info("Batch medication reminders sent successfully: {} notifications", notifications.size());
            return ResponseEntity.ok(notificationDtos);
            
        } catch (Exception e) {
            logger.error("Error sending batch medication reminders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to send batch medication reminders: " + e.getMessage()));
        }
    }
    
    /**
     * Get unread notification count for a patient (Admin/Manager/Doctor access)
     */
    @GetMapping("/patient/{patientId}/unread-count")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientUnreadCount(@PathVariable Integer patientId) {
        try {
            logger.debug("Getting unread notification count for patient: {}", patientId);
            long count = notificationService.countUnreadNotificationsForPatient(patientId);
            return ResponseEntity.ok(Map.of("unreadCount", count));
        } catch (Exception e) {
            logger.error("Error getting unread count for patient {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get unread count: " + e.getMessage()));
        }
    }
}

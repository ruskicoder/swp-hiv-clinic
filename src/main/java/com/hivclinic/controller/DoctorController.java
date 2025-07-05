package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService.UserPrincipal;
import com.hivclinic.dto.request.DoctorAvailabilityRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.dto.PatientAppointmentDTO;
import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import com.hivclinic.model.Notification;
import com.hivclinic.service.DoctorAvailabilityService;
import com.hivclinic.service.DoctorService;
import com.hivclinic.service.NotificationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for doctor-related operations
 * Handles doctor information retrieval and availability management
 */
@RestController
@RequestMapping("/api/doctors")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DoctorController {

    private static final Logger logger = LoggerFactory.getLogger(DoctorController.class);

    @Autowired
    private DoctorService doctorService;

    @Autowired
    private DoctorAvailabilityService availabilityService;
    
    @Autowired
    private NotificationService notificationService;

    /**
     * Get all doctors
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllDoctors() {
        try {
            logger.debug("Fetching all doctors");
            List<User> doctors = doctorService.getAllDoctors();
            logger.info("Retrieved {} doctors", doctors.size());
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            logger.error("Error fetching all doctors: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch doctors: " + e.getMessage()));
        }
    }

    /**
     * Get doctor by ID
     */
    @GetMapping("/{doctorId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDoctorById(@PathVariable Integer doctorId) {
        try {
            logger.debug("Fetching doctor with ID: {}", doctorId);
            Optional<User> doctor = doctorService.getDoctorById(doctorId);
            if (doctor.isPresent()) {
                logger.info("Retrieved doctor: {}", doctor.get().getUsername());
                return ResponseEntity.ok(doctor.get());
            } else {
                logger.warn("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(MessageResponse.error("Doctor not found"));
            }
        } catch (Exception e) {
            logger.error("Error fetching doctor {}: {}", doctorId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch doctor: " + e.getMessage()));
        }
    }

    /**
     * Create availability slot (Doctor only)
     */
    @PostMapping("/availability")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> createAvailabilitySlot(
            @Valid @RequestBody DoctorAvailabilityRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Processing availability slot creation: {}", request);
            
            if (request == null || request.getSlotDate() == null || request.getStartTime() == null) {
                return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Invalid request data"));
            }

            MessageResponse response = availabilityService.createAvailabilitySlot(request, userPrincipal.getId());
            
            if (!response.isSuccess()) {
                logger.warn("Failed to create slot: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }

            logger.info("Successfully created slot for doctor: {}", userPrincipal.getUsername());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating availability slot: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse.error("Server error: " + e.getMessage()));
        }
    }

    /**
     * Get doctor's availability slots
     */
    @GetMapping("/availability/my-slots")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getMyAvailability(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching availability slots for doctor: {}", userPrincipal.getUsername());
            List<DoctorAvailabilitySlot> slots = availabilityService.getDoctorAvailability(userPrincipal.getId());
            logger.info("Retrieved {} availability slots for doctor: {}", slots.size(), userPrincipal.getUsername());
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            logger.error("Error getting availability for doctor {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get availability: " + e.getMessage()));
        }
    }

    /**
     * Get available slots for a doctor (for booking)
     */
    @GetMapping("/{doctorId}/available-slots")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDoctorAvailableSlots(@PathVariable Integer doctorId) {
        try {
            logger.debug("Fetching available slots for doctor ID: {}", doctorId);
            List<DoctorAvailabilitySlot> slots = availabilityService.getDoctorAvailableSlots(doctorId);
            logger.info("Retrieved {} available slots for doctor ID: {}", slots.size(), doctorId);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            logger.error("Error getting available slots for doctor {}: {}", doctorId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get available slots: " + e.getMessage()));
        }
    }

    /**
     * Get doctor availability by date
     */
    @GetMapping("/{doctorId}/availability")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getDoctorAvailabilityByDate(
            @PathVariable Integer doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        try {
            logger.debug("Fetching availability for doctor ID: {} on date: {}", doctorId, date);
            List<DoctorAvailabilitySlot> slots = availabilityService.getDoctorAvailabilityByDate(doctorId, date);
            logger.info("Retrieved {} slots for doctor ID: {} on date: {}", slots.size(), doctorId, date);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            logger.error("Error getting availability for doctor {} on date {}: {}", doctorId, date, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get availability: " + e.getMessage()));
        }
    }

    /**
     * Update availability slot (Doctor only)
     */
    @PutMapping("/availability/{slotId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateAvailabilitySlot(
            @PathVariable Integer slotId,
            @Valid @RequestBody DoctorAvailabilityRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.info("Updating availability slot {} for doctor: {}", slotId, userPrincipal.getUsername());
            MessageResponse response = availabilityService.updateAvailabilitySlot(slotId, request, userPrincipal.getId());
            
            if (response.isSuccess()) {
                logger.info("Availability slot {} updated successfully", slotId);
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to update availability slot {}: {}", slotId, response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error updating availability slot {}: {}", slotId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update availability slot: " + e.getMessage()));
        }
    }

    /**
     * Delete availability slot (Doctor only)
     */
    @DeleteMapping("/availability/{slotId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> deleteAvailabilitySlot(
            @PathVariable Integer slotId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.info("Deleting availability slot {} for doctor: {}", slotId, userPrincipal.getUsername());
            MessageResponse response = availabilityService.deleteAvailabilitySlot(slotId, userPrincipal.getId());
            
            if (response.isSuccess()) {
                logger.info("Availability slot {} deleted successfully", slotId);
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to delete availability slot {}: {}", slotId, response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error deleting availability slot {}: {}", slotId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to delete availability slot: " + e.getMessage()));
        }
    }

    /**
     * Get patients with appointments for the current doctor
     */
    @GetMapping("/patients-with-appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientsWithAppointments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching patients with appointments for doctor: {}", userPrincipal.getUsername());
            List<?> patients = doctorService.getPatientsWithAppointments(userPrincipal.getId());
            logger.info("Retrieved {} patients with appointments for doctor: {}", patients.size(), userPrincipal.getUsername());
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            logger.error("Error fetching patients with appointments for doctor {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch patients with appointments: " + e.getMessage()));
        }
    }

    @GetMapping("/dashboard-patients")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getDashboardPatients(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            List<?> patients = doctorService.getDashboardPatients(userPrincipal.getId());
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            logger.error("Error fetching dashboard patients for doctor {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch dashboard patients: " + e.getMessage()));
        }
    }
    
    // ================== MANAGER NOTIFICATION ENDPOINTS ==================
    
    /**
     * Get all patients with appointments sorted by status (Manager/Doctor access)
     * Order: In Progress, Completed, Scheduled
     */
    @GetMapping("/patients-appointments-sorted")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientsWithAppointmentsSorted(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching patients with appointments sorted by status for user: {}", userPrincipal.getUsername());
            List<PatientAppointmentDTO> patients = notificationService.getAllPatientsWithAppointmentsSortedByStatus(userPrincipal.getId());
            logger.info("Retrieved {} patients with appointments sorted by status", patients.size());
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            logger.error("Error fetching patients with appointments sorted by status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch patients with appointments: " + e.getMessage()));
        }
    }
    
    /**
     * Send notification to specific patient (Manager/Doctor access)
     */
    @PostMapping("/send-notification")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> sendNotificationToPatient(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> request) {
        try {
            Integer patientId = (Integer) request.get("patientId");
            String message = (String) request.get("message");
            String type = (String) request.get("type");
            
            if (patientId == null || message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Patient ID and message are required"));
            }
            
            if (type == null || type.trim().isEmpty()) {
                type = "GENERAL";
            }
            
            logger.info("Sending notification from {} to patient {}: {}", userPrincipal.getUsername(), patientId, message);
            
            Notification notification = notificationService.sendNotification(
                userPrincipal.getId(),
                patientId,
                message,
                type
            );
            
            logger.info("Notification sent successfully with ID: {}", notification.getNotificationId());
            return ResponseEntity.ok(MessageResponse.success("Notification sent successfully"));
            
        } catch (Exception e) {
            logger.error("Error sending notification to patient: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to send notification: " + e.getMessage()));
        }
    }
    
    /**
     * Send batch notifications to multiple patients (Manager/Doctor access)
     */
    @PostMapping("/send-batch-notifications")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> sendBatchNotifications(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> patientIds = (List<Integer>) request.get("patientIds");
            String message = (String) request.get("message");
            String medicationDetails = (String) request.get("medicationDetails");
            
            if (patientIds == null || patientIds.isEmpty() || message == null || message.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Patient IDs and message are required"));
            }
            
            logger.info("Sending batch notifications from {} to {} patients", userPrincipal.getUsername(), patientIds.size());
            
            List<Notification> notifications = notificationService.sendBatchMedicationReminders(
                userPrincipal.getId(),
                patientIds,
                message,
                medicationDetails
            );
            
            logger.info("Batch notifications sent successfully: {} notifications", notifications.size());
            return ResponseEntity.ok(MessageResponse.success("Batch notifications sent: " + notifications.size() + " successful"));
            
        } catch (Exception e) {
            logger.error("Error sending batch notifications: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to send batch notifications: " + e.getMessage()));
        }
    }
    
    /**
     * Unsend/retract notification with reason tracking (Manager/Doctor access)
     */
    @PostMapping("/notifications/{notificationId}/retract")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> retractNotification(
            @PathVariable Integer notificationId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            String reason = request.get("reason");
            if (reason == null || reason.trim().isEmpty()) {
                reason = "Retracted by " + userPrincipal.getUsername();
            }
            
            logger.info("Retracting notification {} with reason: {}", notificationId, reason);
            
            // Check if notification can be retracted
            if (!notificationService.canRetractNotification(notificationId)) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Cannot retract notification - it may have already been seen by the patient"));
            }
            
            notificationService.retractNotificationWithReason(notificationId, reason);
            
            logger.info("Notification {} retracted successfully", notificationId);
            return ResponseEntity.ok(MessageResponse.success("Notification retracted successfully"));
            
        } catch (Exception e) {
            logger.error("Error retracting notification {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to retract notification: " + e.getMessage()));
        }
    }
    
    /**
     * Get notification status and history (Manager/Doctor access)
     */
    @GetMapping("/notifications/{notificationId}/status")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DOCTOR')")
    public ResponseEntity<?> getNotificationStatus(@PathVariable Integer notificationId) {
        try {
            logger.debug("Getting notification status for ID: {}", notificationId);
            
            Optional<Notification> notificationOpt = notificationService.getNotificationById(notificationId);
            if (notificationOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            NotificationDto notificationDto = NotificationDto.fromEntity(notificationOpt.get());
            return ResponseEntity.ok(notificationDto);
            
        } catch (Exception e) {
            logger.error("Error getting notification status for ID {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get notification status: " + e.getMessage()));
        }
    }
    
    /**
     * Update notification status (Manager/Doctor access)
     */
    @PutMapping("/notifications/{notificationId}/status")
    @PreAuthorize("hasRole('MANAGER') or hasRole('DOCTOR')")
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
            
            logger.info("Notification {} status updated successfully", notificationId);
            return ResponseEntity.ok(MessageResponse.success("Notification status updated successfully"));
            
        } catch (Exception e) {
            logger.error("Error updating notification status for ID {}: {}", notificationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update notification status: " + e.getMessage()));
        }
    }
}
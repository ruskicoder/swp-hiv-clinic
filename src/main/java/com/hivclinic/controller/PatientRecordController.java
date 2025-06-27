package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.PatientRecord;
import com.hivclinic.service.PatientRecordService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

/**
 * REST Controller for patient record operations
 * Handles patient medical record management
 */
@RestController
@RequestMapping("/api/patient-records")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PatientRecordController {

    private static final Logger logger = LoggerFactory.getLogger(PatientRecordController.class);

    @Autowired
    private PatientRecordService patientRecordService;

    /**
     * Get patient's own medical record
     */
    @GetMapping("/my-record")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<?> getMyRecord(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            logger.error("User principal is null - unauthorized access attempt");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponse.error("Authentication required"));
        }

        try {
            if (userPrincipal.getId() == null) {
                logger.error("User ID is null for username: {}", userPrincipal.getUsername());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(MessageResponse.error("Invalid user ID"));
            }

            logger.info("Fetching medical record for patient ID: {}", userPrincipal.getId());
            Map<String, Object> record = patientRecordService.getPatientRecordAsMap(userPrincipal.getId());
            
            if (!Boolean.TRUE.equals(record.get("success"))) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(MessageResponse.error(record.get("message").toString()));
            }

            return ResponseEntity.ok(record);

        } catch (Exception e) {
            logger.error("Error fetching patient record: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse.error("Failed to fetch patient record: " + e.getMessage()));
        }
    }

    /**
     * Update patient's own medical record
     */
    @PutMapping("/my-record")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")  // Changed from hasRole to hasAuthority
    public ResponseEntity<?> updateMyRecord(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> recordData) {
        try {
            // Verify user has patient role
            if (!userPrincipal.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_PATIENT"))) {
                logger.warn("Unauthorized access attempt by user: {}", userPrincipal.getUsername());
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(MessageResponse.error("Access denied: User is not a patient"));
            }

            logger.info("Updating medical record for patient: {}", userPrincipal.getUsername());
            MessageResponse response = patientRecordService.updatePatientRecordWithResponse(userPrincipal.getId(), recordData);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            logger.error("Error updating patient record for user {}: {}", 
                userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update patient record: " + e.getMessage()));
        }
    }

    /**
     * Get patient record by ID (for doctors)
     */
    @GetMapping("/{patientId}")
    @PreAuthorize("hasRole('Doctor') or hasRole('Admin')")
    public ResponseEntity<?> getPatientRecord(
            @PathVariable Integer patientId,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Doctor {} fetching medical record for patient ID: {}", userPrincipal.getUsername(), patientId);
            
            Optional<PatientRecord> recordOpt = patientRecordService.getPatientRecord(patientId);
            if (recordOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(MessageResponse.error("Patient record not found"));
            }
            
            return ResponseEntity.ok(recordOpt.get());
            
        } catch (Exception e) {
            logger.error("Error fetching patient record for patient ID {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch patient record: " + e.getMessage()));
        }
    }

    /**
     * Update patient record (for doctors)
     */
    @PutMapping("/{patientId}")
    @PreAuthorize("hasAnyAuthority('ROLE_DOCTOR', 'ROLE_ADMIN')")  // Changed from hasRole
    public ResponseEntity<?> updatePatientRecord(
            @PathVariable Integer patientId,
            @RequestBody Map<String, Object> recordData,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Doctor {} updating medical record for patient ID: {}", userPrincipal.getUsername(), patientId);

            MessageResponse response = patientRecordService.updatePatientRecordWithResponse(patientId, recordData);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            logger.error("Error updating patient record for patient ID {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update patient record: " + e.getMessage()));
        }
    }

    /**
     * Upload profile image for patient
     */
    @PostMapping("/upload-image")
    @PreAuthorize("hasAnyAuthority('ROLE_PATIENT', 'ROLE_DOCTOR', 'ROLE_ADMIN')")
    public ResponseEntity<?> uploadProfileImage(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody Map<String, String> imageData) {
        try {
            logger.info("Processing image upload request for user: {}", userPrincipal.getUsername());
            
            if (userPrincipal == null || userPrincipal.getId() == null) {
                logger.error("User principal or ID is null");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MessageResponse.error("Authentication required"));
            }
            
            String base64Image = imageData.get("imageData");
            if (base64Image == null || base64Image.trim().isEmpty()) {
                logger.error("Image data is missing from request");
                return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Image data is required"));
            }

            // Basic validation of base64 image format
            if (!base64Image.startsWith("data:image/")) {
                logger.error("Invalid image format received");
                return ResponseEntity.badRequest()
                    .body(MessageResponse.error("Invalid image format. Must be a valid base64 image data URL."));
            }
            
            MessageResponse response = patientRecordService.updateProfileImage(userPrincipal.getId(), base64Image);
            
            if (response.isSuccess()) {
                logger.info("Image upload successful for user: {}", userPrincipal.getUsername());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Image upload failed for user {}: {}", userPrincipal.getUsername(), response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error processing image upload for user {}: {}", 
                userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponse.error("Failed to upload image: " + e.getMessage()));
        }
    }

    /**
     * Get patient record by appointment ID (for doctors)
     */
    @GetMapping("/appointment/{appointmentId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> getPatientRecordByAppointment(
            @PathVariable Integer appointmentId,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Doctor {} fetching patient record for appointment ID: {}", 
                userPrincipal.getUsername(), appointmentId);

            Map<String, Object> record = patientRecordService.getPatientRecordForAppointment(
                appointmentId, userPrincipal.getId());

            if (!Boolean.TRUE.equals(record.get("success"))) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(MessageResponse.error(record.get("message").toString()));
            }

            return ResponseEntity.ok(record);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(MessageResponse.error("Access denied: " + e.getMessage()));
        } catch (Exception e) {
            logger.error("Error fetching patient record for appointment ID {}: {}", appointmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch patient record: " + e.getMessage()));
        }
    }
}

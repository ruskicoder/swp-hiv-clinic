package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.response.MessageResponse;
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
    @PreAuthorize("hasRole('Patient')")
    public ResponseEntity<?> getMyRecord(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching medical record for patient: {}", userPrincipal.getUsername());
            
            var record = patientRecordService.getPatientRecord(userPrincipal.getId());
            return ResponseEntity.ok(record);
            
        } catch (Exception e) {
            logger.error("Error fetching patient record for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch patient record: " + e.getMessage()));
        }
    }

    /**
     * Update patient's own medical record
     */
    @PutMapping("/my-record")
    @PreAuthorize("hasRole('Patient')")
    public ResponseEntity<?> updateMyRecord(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody Map<String, Object> recordData) {
        try {
            logger.info("Updating medical record for patient: {}", userPrincipal.getUsername());
            
            MessageResponse response = patientRecordService.updatePatientRecord(userPrincipal.getId(), recordData);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error updating patient record for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
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
            
            var record = patientRecordService.getPatientRecord(patientId);
            return ResponseEntity.ok(record);
            
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
    @PreAuthorize("hasRole('Doctor') or hasRole('Admin')")
    public ResponseEntity<?> updatePatientRecord(
            @PathVariable Integer patientId,
            @RequestBody Map<String, Object> recordData,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Doctor {} updating medical record for patient ID: {}", userPrincipal.getUsername(), patientId);
            
            MessageResponse response = patientRecordService.updatePatientRecord(patientId, recordData);
            
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
    @PreAuthorize("hasRole('Patient')")
    public ResponseEntity<?> uploadProfileImage(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody Map<String, String> imageData) {
        try {
            logger.info("Uploading profile image for patient: {}", userPrincipal.getUsername());
            
            String base64Image = imageData.get("image");
            if (base64Image == null || base64Image.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(MessageResponse.error("Image data is required"));
            }
            
            MessageResponse response = patientRecordService.updateProfileImage(userPrincipal.getId(), base64Image);
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error uploading profile image for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to upload profile image: " + e.getMessage()));
        }
    }
}

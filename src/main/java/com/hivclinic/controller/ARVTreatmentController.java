package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.service.ARVTreatmentService;
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

/**
 * REST Controller for ARV treatment operations
 * Handles ARV treatment management for patients and doctors
 */
@RestController
@RequestMapping("/api/arv-treatments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ARVTreatmentController {

    private static final Logger logger = LoggerFactory.getLogger(ARVTreatmentController.class);

    @Autowired
    private ARVTreatmentService arvTreatmentService;

    /**
     * Get patient's ARV treatments (for patients)
     */
    @GetMapping("/my-treatments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyTreatments(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching ARV treatments for patient: {}", userPrincipal.getUsername());
            
            var treatments = arvTreatmentService.getPatientTreatments(userPrincipal.getId());
            return ResponseEntity.ok(treatments);
            
        } catch (Exception e) {
            logger.error("Error fetching ARV treatments for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch ARV treatments: " + e.getMessage()));
        }
    }

    /**
     * Get ARV treatments for a specific patient (for doctors)
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<?> getPatientTreatments(
            @PathVariable Integer patientId,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Doctor {} fetching ARV treatments for patient ID: {}", userPrincipal.getUsername(), patientId);
            
            // Check if patient exists first
            if (!arvTreatmentService.checkPatientExists(patientId)) {
                return ResponseEntity.ok(List.of()); // Return empty list instead of error
            }
            
            var treatments = arvTreatmentService.getPatientTreatments(patientId);
            return ResponseEntity.ok(treatments);
            
        } catch (Exception e) {
            logger.error("Error fetching ARV treatments for patient ID {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch ARV treatments: " + e.getMessage()));
        }
    }

    /**
     * Add new ARV treatment (for doctors)
     */
    @PostMapping("/add")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> addTreatment(
            @RequestBody Map<String, Object> treatmentData,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Doctor {} adding ARV treatment", userPrincipal.getUsername());
            
            MessageResponse response = arvTreatmentService.addTreatment(treatmentData, userPrincipal.getId());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error adding ARV treatment: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to add ARV treatment: " + e.getMessage()));
        }
    }

    /**
     * Update ARV treatment (for doctors)
     */
    @PutMapping("/{treatmentId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateTreatment(
            @PathVariable Integer treatmentId,
            @RequestBody Map<String, Object> treatmentData,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Doctor {} updating ARV treatment ID: {}", userPrincipal.getUsername(), treatmentId);
            
            MessageResponse response = arvTreatmentService.updateTreatment(treatmentId, treatmentData, userPrincipal.getId());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error updating ARV treatment ID {}: {}", treatmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update ARV treatment: " + e.getMessage()));
        }
    }

    /**
     * Deactivate ARV treatment (for doctors)
     */
    @PutMapping("/{treatmentId}/deactivate")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> deactivateTreatment(
            @PathVariable Integer treatmentId,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Doctor {} deactivating ARV treatment ID: {}", userPrincipal.getUsername(), treatmentId);
            
            MessageResponse response = arvTreatmentService.deactivateTreatment(treatmentId, userPrincipal.getId());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error deactivating ARV treatment ID {}: {}", treatmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to deactivate ARV treatment: " + e.getMessage()));
        }
    }

    /**
     * Edit an existing ARV treatment (for doctors)
     */
    @PutMapping("/{treatmentId}/edit")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> editTreatment(
            @PathVariable Integer treatmentId,
            @RequestBody Map<String, Object> treatmentData,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Doctor {} editing ARV treatment ID: {}", userPrincipal.getUsername(), treatmentId);
            
            MessageResponse response = arvTreatmentService.editTreatment(treatmentId, treatmentData, userPrincipal.getId());
            
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error editing ARV treatment ID {}: {}", treatmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to edit ARV treatment: " + e.getMessage()));
        }
    }

    /**
     * Delete ARV treatment (for doctors)
     */
    @DeleteMapping("/{treatmentId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> deleteTreatment(
            @PathVariable Integer treatmentId,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Doctor {} deleting ARV treatment ID: {}", userPrincipal.getUsername(), treatmentId);

            // If ARVTreatmentService.deleteTreatment expects only treatmentId, remove userPrincipal.getId()
            MessageResponse response = arvTreatmentService.deleteTreatment(treatmentId, userPrincipal.getId());

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            logger.error("Error deleting ARV treatment ID {}: {}", treatmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to delete ARV treatment: " + e.getMessage()));
        }
    }

    /**
     * Get ARV templates (default + doctor-created)
     */
    @GetMapping("/templates")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getTemplates(@AuthenticationPrincipal com.hivclinic.config.CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            var templates = arvTreatmentService.getTemplates(userPrincipal.getId());
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(com.hivclinic.dto.response.MessageResponse.error("Failed to fetch ARV templates: " + e.getMessage()));
        }
    }
}

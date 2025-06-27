package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService.UserPrincipal;
import com.hivclinic.service.PatientPrivacyService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/patients")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PatientPrivacyController {

    private static final Logger logger = LoggerFactory.getLogger(PatientPrivacyController.class);

    @Autowired
    private PatientPrivacyService patientPrivacyService;

    @GetMapping("/privacy-settings")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<?> getPrivacySettings(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching privacy settings for patient: {}", userPrincipal.getUsername());
            
            boolean isPrivate = patientPrivacyService.getPrivacySettings(userPrincipal.getId());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "isPrivate", isPrivate
            ));
            
        } catch (Exception e) {
            logger.error("Error fetching privacy settings for user {}: {}", 
                userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "message", "Failed to fetch privacy settings: " + e.getMessage()
                ));
        }
    }

    @PostMapping("/privacy-settings")
    @PreAuthorize("hasAuthority('ROLE_PATIENT')")
    public ResponseEntity<?> updatePrivacySettings(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @RequestBody Map<String, Boolean> settings) {
        try {
            logger.debug("Updating privacy settings for patient: {}", userPrincipal.getUsername());
            
            Boolean isPrivate = settings.get("isPrivate");
            if (isPrivate == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of(
                        "success", false,
                        "message", "isPrivate field is required"
                    ));
            }
            
            patientPrivacyService.updatePrivacySettings(userPrincipal.getId(), isPrivate);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Privacy settings updated successfully"
            ));
            
        } catch (Exception e) {
            logger.error("Error updating privacy settings for user {}: {}", 
                userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "message", "Failed to update privacy settings: " + e.getMessage()
                ));
        }
    }
}
package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.Specialty;
import com.hivclinic.model.User;
import com.hivclinic.service.AdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for admin operations
 * Handles user management, appointment oversight, and system administration
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private AdminService adminService;

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(MessageResponse.success("Admin service is running"));
    }

    /**
     * Get all users
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            logger.debug("Admin fetching all users");
            List<User> users = adminService.getAllUsers();
            logger.info("Retrieved {} users", users.size());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error getting all users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get users: " + e.getMessage()));
        }
    }

    /**
     * Get all patients
     */
    @GetMapping("/patients")
    public ResponseEntity<?> getAllPatients() {
        try {
            logger.debug("Admin fetching all patients");
            List<User> patients = adminService.getAllPatients();
            logger.info("Retrieved {} patients", patients.size());
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            logger.error("Error getting all patients: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get patients: " + e.getMessage()));
        }
    }

    /**
     * Get all doctors
     */
    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        try {
            logger.debug("Admin fetching all doctors");
            List<User> doctors = adminService.getAllDoctors();
            logger.info("Retrieved {} doctors", doctors.size());
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            logger.error("Error getting all doctors: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get doctors: " + e.getMessage()));
        }
    }

    /**
     * Create doctor account
     */
    @PostMapping("/doctors")
    public ResponseEntity<?> createDoctor(
            @RequestParam String username,
            @RequestParam String email,
            @RequestParam String password,
            @RequestParam String firstName,
            @RequestParam String lastName,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam(required = false) Integer specialtyId,
            @RequestParam(required = false) String bio,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Admin {} creating doctor account: {}", userPrincipal.getUsername(), username);
            
            MessageResponse response = adminService.createDoctorAccount(
                    username, email, password, firstName, lastName, phoneNumber, specialtyId, bio);
            
            if (response.isSuccess()) {
                logger.info("Doctor account created successfully: {}", username);
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to create doctor account: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error creating doctor account: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create doctor account: " + e.getMessage()));
        }
    }

    /**
     * Toggle user active status
     */
    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(
            @PathVariable Integer userId,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Admin {} toggling status for user ID: {}", userPrincipal.getUsername(), userId);
            
            MessageResponse response = adminService.toggleUserStatus(userId);
            
            if (response.isSuccess()) {
                logger.info("User status toggled successfully for user ID: {}", userId);
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to toggle user status: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error toggling user status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to toggle user status: " + e.getMessage()));
        }
    }

    /**
     * Reset user password
     */
    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<?> resetUserPassword(
            @PathVariable Integer userId,
            @RequestParam String newPassword,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Admin {} resetting password for user ID: {}", userPrincipal.getUsername(), userId);
            
            MessageResponse response = adminService.resetUserPassword(userId, newPassword);
            
            if (response.isSuccess()) {
                logger.info("Password reset successfully for user ID: {}", userId);
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to reset password: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error resetting password: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to reset password: " + e.getMessage()));
        }
    }

    /**
     * Get all appointments (admin oversight)
     */
    @GetMapping("/appointments")
    public ResponseEntity<?> getAllAppointments() {
        try {
            logger.debug("Admin fetching all appointments");
            List<Appointment> appointments = adminService.getAllAppointments();
            logger.info("Retrieved {} appointments", appointments.size());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error getting all appointments: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get appointments: " + e.getMessage()));
        }
    }

    /**
     * Get all specialties
     */
    @GetMapping("/specialties")
    public ResponseEntity<?> getAllSpecialties() {
        try {
            logger.debug("Admin fetching all specialties");
            List<Specialty> specialties = adminService.getAllSpecialties();
            logger.info("Retrieved {} specialties", specialties.size());
            return ResponseEntity.ok(specialties);
        } catch (Exception e) {
            logger.error("Error getting all specialties: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get specialties: " + e.getMessage()));
        }
    }

    /**
     * Create specialty
     */
    @PostMapping("/specialties")
    public ResponseEntity<?> createSpecialty(
            @RequestParam String specialtyName,
            @RequestParam(required = false) String description,
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.info("Admin {} creating specialty: {}", userPrincipal.getUsername(), specialtyName);
            
            MessageResponse response = adminService.createSpecialty(specialtyName, description);
            
            if (response.isSuccess()) {
                logger.info("Specialty created successfully: {}", specialtyName);
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to create specialty: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error creating specialty: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create specialty: " + e.getMessage()));
        }
    }
}

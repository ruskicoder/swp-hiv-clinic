package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService.UserPrincipal;
import com.hivclinic.dto.request.DoctorAvailabilityRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import com.hivclinic.service.DoctorAvailabilityService;
import com.hivclinic.service.DoctorService;
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
            logger.error("Error getting all doctors: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get doctors: " + e.getMessage()));
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
            Optional<User> doctorOpt = doctorService.getDoctorById(doctorId);
            
            if (doctorOpt.isPresent()) {
                User doctor = doctorOpt.get();
                logger.info("Retrieved doctor: {}", doctor.getUsername());
                return ResponseEntity.ok(doctor);
            } else {
                logger.warn("Doctor not found with ID: {}", doctorId);
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            logger.error("Error fetching doctor with ID {}: {}", doctorId, e.getMessage(), e);
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
            logger.debug("Creating availability slot for doctor: {}", userPrincipal.getUsername());
            MessageResponse response = availabilityService.createAvailabilitySlot(request, userPrincipal.getId());
            
            if (response.isSuccess()) {
                logger.info("Availability slot created successfully for doctor: {}", userPrincipal.getUsername());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to create availability slot: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error creating availability slot for doctor {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create availability slot: " + e.getMessage()));
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
            logger.debug("Fetching availability for doctor {} on date: {}", doctorId, date);
            List<DoctorAvailabilitySlot> slots = availabilityService.getDoctorAvailabilityByDate(doctorId, date);
            logger.info("Retrieved {} slots for doctor {} on {}", slots.size(), doctorId, date);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            logger.error("Error getting availability for doctor {} on {}: {}", doctorId, date, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get availability: " + e.getMessage()));
        }
    }

    /**
     * Update availability slot
     */
    @PutMapping("/availability/{slotId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateAvailabilitySlot(
            @PathVariable Integer slotId,
            @Valid @RequestBody DoctorAvailabilityRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Updating availability slot {} for doctor: {}", slotId, userPrincipal.getUsername());
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
     * Delete availability slot
     */
    @DeleteMapping("/availability/{slotId}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> deleteAvailabilitySlot(
            @PathVariable Integer slotId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Deleting availability slot {} for doctor: {}", slotId, userPrincipal.getUsername());
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
}
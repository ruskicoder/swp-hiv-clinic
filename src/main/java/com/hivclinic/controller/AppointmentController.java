package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService.UserPrincipal;
import com.hivclinic.dto.request.AppointmentBookingRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.service.AppointmentService;
import jakarta.validation.Valid;
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
 * REST Controller for appointment management
 * Handles appointment booking, retrieval, and cancellation
 */
@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AppointmentController {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentController.class);

    @Autowired
    private AppointmentService appointmentService;

    /**
     * Book an appointment (Patient only)
     */
    @PostMapping("/book")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> bookAppointment(
            @Valid @RequestBody AppointmentBookingRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.info("Booking appointment for patient: {}", userPrincipal.getUsername());
            MessageResponse response = appointmentService.bookAppointment(request, userPrincipal.getId());
            
            if (response.isSuccess()) {
                logger.info("Appointment booked successfully for patient: {}", userPrincipal.getUsername());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to book appointment: {}", response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error booking appointment for patient {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to book appointment: " + e.getMessage()));
        }
    }

    /**
     * Get patient's appointments
     */
    @GetMapping("/patient/my-appointments")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getMyAppointments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching appointments for patient: {}", userPrincipal.getUsername());
            List<Appointment> appointments = appointmentService.getPatientAppointments(userPrincipal.getId());
            logger.info("Retrieved {} appointments for patient: {}", appointments.size(), userPrincipal.getUsername());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error getting patient appointments for {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get appointments: " + e.getMessage()));
        }
    }

    /**
     * Get patient's upcoming appointments
     */
    @GetMapping("/patient/upcoming")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> getUpcomingAppointments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching upcoming appointments for patient: {}", userPrincipal.getUsername());
            List<Appointment> appointments = appointmentService.getPatientUpcomingAppointments(userPrincipal.getId());
            logger.info("Retrieved {} upcoming appointments for patient: {}", appointments.size(), userPrincipal.getUsername());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error getting upcoming appointments for {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get upcoming appointments: " + e.getMessage()));
        }
    }

    /**
     * Get doctor's appointments
     */
    @GetMapping("/doctor/my-appointments")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getDoctorAppointments(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching appointments for doctor: {}", userPrincipal.getUsername());
            List<Appointment> appointments = appointmentService.getDoctorAppointments(userPrincipal.getId());
            logger.info("Retrieved {} appointments for doctor: {}", appointments.size(), userPrincipal.getUsername());
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            logger.error("Error getting doctor appointments for {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get appointments: " + e.getMessage()));
        }
    }

    /**
     * Cancel an appointment
     */
    @PutMapping("/{appointmentId}/cancel")
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR')")
    public ResponseEntity<?> cancelAppointment(
            @PathVariable Integer appointmentId,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            logger.info("Cancelling appointment {} by user: {}", appointmentId, userPrincipal.getUsername());
            MessageResponse response = appointmentService.cancelAppointment(
                    appointmentId, userPrincipal.getId(), reason);
            
            if (response.isSuccess()) {
                logger.info("Appointment {} cancelled successfully", appointmentId);
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Failed to cancel appointment {}: {}", appointmentId, response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error cancelling appointment {}: {}", appointmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to cancel appointment: " + e.getMessage()));
        }
    }

    /**
     * Doctor updates appointment status, adds notes, and can schedule re-check
     */
    @PutMapping("/{appointmentId}/status")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> updateAppointmentStatus(
            @PathVariable Integer appointmentId,
            @RequestBody Map<String, Object> statusData,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            String status = (String) statusData.get("status");
            String notes = (String) statusData.getOrDefault("notes", "");
            Boolean scheduleRecheck = (Boolean) statusData.getOrDefault("scheduleRecheck", false);
            String recheckDateTime = (String) statusData.getOrDefault("recheckDateTime", null);
            Integer durationMinutes = statusData.get("durationMinutes") != null ? (Integer) statusData.get("durationMinutes") : null;

            MessageResponse response = appointmentService.updateAppointmentStatus(
                appointmentId, userPrincipal.getId(), status, notes, scheduleRecheck, recheckDateTime, durationMinutes
            );
            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error updating appointment status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update appointment status: " + e.getMessage()));
        }
    }

    /**
     * Doctor accesses patient record for a specific appointment (only if appointment is not completed)
     */
    @GetMapping("/{appointmentId}/patient-record")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getPatientRecordForAppointment(
            @PathVariable Integer appointmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            var record = appointmentService.getPatientRecordForAppointment(appointmentId, userPrincipal.getId());
            return ResponseEntity.ok(record);
        } catch (Exception e) {
            logger.error("Error getting patient record for appointment {}: {}", appointmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(MessageResponse.error("Access denied or record not found: " + e.getMessage()));
        }
    }
}

package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.request.CreateManagerRequest; // <-- THÊM DÒNG IMPORT NÀY
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

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);

    @Autowired
    private AdminService adminService;

    // --- CÁC PHƯƠNG THỨC KHÁC GIỮ NGUYÊN ---
    // (healthCheck, getAllUsers, getAllDoctors, v.v...)

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(MessageResponse.success("Admin service is running"));
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = adminService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get users: " + e.getMessage()));
        }
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getAllPatients() {
        try {
            List<User> patients = adminService.getAllPatients();
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get patients: " + e.getMessage()));
        }
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        try {
            List<User> doctors = adminService.getAllDoctors();
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get doctors: " + e.getMessage()));
        }
    }
    
    @GetMapping("/managers")
    public ResponseEntity<?> getAllManagers() {
        try {
            logger.debug("Admin fetching all managers");
            List<User> managers = adminService.getAllManagers();
            logger.info("Retrieved {} managers", managers.size());
            return ResponseEntity.ok(managers);
        } catch (Exception e) {
            logger.error("Error getting all managers: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get managers: " + e.getMessage()));
        }
    }

    @PostMapping("/doctors")
    public ResponseEntity<?> createDoctor(
            @RequestParam String username, @RequestParam String email, @RequestParam String password,
            @RequestParam String firstName, @RequestParam String lastName,
            @RequestParam(required = false) String phoneNumber,
            @RequestParam Integer specialtyId,
            @RequestParam(required = false) String bio) {
        try {
            MessageResponse response = adminService.createDoctorAccount(username, email, password, firstName, lastName, phoneNumber, specialtyId, bio);
            return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create doctor account: " + e.getMessage()));
        }
    }


    // ----- THAY ĐỔI QUAN TRỌNG Ở ĐÂY -----
    // Thay thế nhiều @RequestParam bằng một @RequestBody duy nhất.
    @PostMapping("/managers")
    public ResponseEntity<?> createManagerAccount(@RequestBody CreateManagerRequest request) {
        try {
            // Gọi service với dữ liệu lấy từ object 'request'
            MessageResponse response = adminService.createManagerAccount(
                    request.getUsername(),
                    request.getEmail(),
                    request.getPassword(),
                    request.getFirstName(),
                    request.getLastName()
            );
            return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create manager account: " + e.getMessage()));
        }
    }
    
    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Integer userId) {
        try {
            MessageResponse response = adminService.toggleUserStatus(userId);
            return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to toggle user status: " + e.getMessage()));
        }
    }

    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<?> resetUserPassword(@PathVariable Integer userId, @RequestParam String newPassword) {
        try {
            MessageResponse response = adminService.resetUserPassword(userId, newPassword);
            return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to reset password: " + e.getMessage()));
        }
    }

    @GetMapping("/appointments")
    public ResponseEntity<?> getAllAppointments() {
        try {
            List<Appointment> appointments = adminService.getAllAppointments();
            return ResponseEntity.ok(appointments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get appointments: " + e.getMessage()));
        }
    }

    @GetMapping("/specialties")
    public ResponseEntity<?> getAllSpecialties() {
        try {
            List<Specialty> specialties = adminService.getAllSpecialties();
            return ResponseEntity.ok(specialties);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get specialties: " + e.getMessage()));
        }
    }

    @PostMapping("/specialties")
    public ResponseEntity<?> createSpecialty(@RequestParam String specialtyName, @RequestParam(required = false) String description) {
        try {
            MessageResponse response = adminService.createSpecialty(specialtyName, description);
            return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create specialty: " + e.getMessage()));
        }
    }
}
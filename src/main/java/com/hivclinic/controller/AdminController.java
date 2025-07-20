package com.hivclinic.controller;

import com.hivclinic.dto.request.AdminCreateUserRequest; // <-- Import DTO mới
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.Role;
import com.hivclinic.model.Specialty;
import com.hivclinic.model.User;
import com.hivclinic.repository.RoleRepository; // <-- Import RoleRepository
import com.hivclinic.service.AdminService;
import jakarta.validation.Valid; // <-- Import để validation
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    @Autowired
    private RoleRepository roleRepository; // Cần thiết để lấy danh sách vai trò

    // ----- ENDPOINT TẠO TÀI KHOẢN MỚI THỐNG NHẤT -----
    /**
     * Endpoint duy nhất để Admin tạo một tài khoản người dùng mới với vai trò bất kỳ.
     * Nó thay thế cho các endpoint /doctors và /managers cũ.
     * @param request DTO chứa tất cả thông tin người dùng mới.
     * @return MessageResponse cho biết thành công hay thất bại.
     */
    @PostMapping("/users")
    public ResponseEntity<?> createUserByAdmin(@Valid @RequestBody AdminCreateUserRequest request) {
        try {
            MessageResponse response = adminService.createUser(request);
            return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            logger.error("Error creating user by admin: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create user account: " + e.getMessage()));
        }
    }

    // ----- CÁC ENDPOINT LẤY DANH SÁCH (GET) -----
    
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

    /**
     * Endpoint để frontend có thể lấy danh sách tất cả các vai trò
     * và hiển thị trong ô lựa chọn (dropdown/select).
     * @return Danh sách các đối tượng Role.
     */
    @GetMapping("/roles")
    public ResponseEntity<?> getAllRoles() {
        try {
            List<Role> roles = roleRepository.findAll();
            return ResponseEntity.ok(roles);
        } catch (Exception e) {
            logger.error("Error fetching roles: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get roles: " + e.getMessage()));
        }
    }

    // ----- CÁC ENDPOINT HÀNH ĐỘNG KHÁC (PUT, POST) -----
    
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
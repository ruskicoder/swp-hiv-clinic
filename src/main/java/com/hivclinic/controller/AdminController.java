package com.hivclinic.controller;

import com.hivclinic.dto.request.AdminCreateUserRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.Role;
import com.hivclinic.model.Specialty;
import com.hivclinic.model.User;
import com.hivclinic.repository.RoleRepository;
import com.hivclinic.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller xử lý tất cả các yêu cầu quản trị hệ thống.
 * Yêu cầu quyền 'ADMIN' để truy cập.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {

    @Autowired private AdminService adminService;
    @Autowired private RoleRepository roleRepository;

    // ----- CÁC ENDPOINT GHI DỮ LIỆU (POST, PUT) -----

    @PostMapping("/users")
    public ResponseEntity<MessageResponse> createUserByAdmin(@Valid @RequestBody AdminCreateUserRequest request) {
        MessageResponse response = adminService.createUser(request);
        return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<MessageResponse> toggleUserStatus(@PathVariable Integer userId) {
        MessageResponse response = adminService.toggleUserStatus(userId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{userId}/reset-password")
    public ResponseEntity<MessageResponse> resetUserPassword(@PathVariable Integer userId, @RequestParam String newPassword) {
        MessageResponse response = adminService.resetUserPassword(userId, newPassword);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/specialties")
    public ResponseEntity<MessageResponse> createSpecialty(@RequestParam String specialtyName, @RequestParam(required = false) String description) {
        MessageResponse response = adminService.createSpecialty(specialtyName, description);
        return response.isSuccess() ? ResponseEntity.ok(response) : ResponseEntity.badRequest().body(response);
    }

    // ----- CÁC ENDPOINT ĐỌC DỮ LIỆU CÓ PHÂN TRANG (GET) -----

    @GetMapping("/users")
    public ResponseEntity<Page<User>> getAllUsers(Pageable pageable) {
        Page<User> usersPage = adminService.getAllUsers(pageable);
        return ResponseEntity.ok(usersPage);
    }

    @GetMapping("/patients")
    public ResponseEntity<Page<User>> getAllPatients(Pageable pageable) {
        Page<User> patientsPage = adminService.getAllPatients(pageable);
        return ResponseEntity.ok(patientsPage);
    }

    @GetMapping("/doctors")
    public ResponseEntity<Page<User>> getAllDoctors(Pageable pageable) {
        Page<User> doctorsPage = adminService.getAllDoctors(pageable);
        return ResponseEntity.ok(doctorsPage);
    }
    
    @GetMapping("/managers")
    public ResponseEntity<Page<User>> getAllManagers(Pageable pageable) {
        Page<User> managersPage = adminService.getAllManagers(pageable);
        return ResponseEntity.ok(managersPage);
    }
    
    @GetMapping("/appointments")
    public ResponseEntity<Page<Appointment>> getAllAppointments(Pageable pageable) {
        Page<Appointment> appointmentsPage = adminService.getAllAppointments(pageable);
        return ResponseEntity.ok(appointmentsPage);
    }

    // ----- ENDPOINT ĐẾM SỐ LƯỢNG (DÙNG CHO OVERVIEW DASHBOARD) -----

    @GetMapping("/users/count")
    public ResponseEntity<Long> getUsersCount() {
        return ResponseEntity.ok(adminService.getUsersCount());
    }

    @GetMapping("/patients/count")
    public ResponseEntity<Long> getPatientsCount() {
        return ResponseEntity.ok(adminService.getPatientsCount());
    }
    
    @GetMapping("/doctors/count")
    public ResponseEntity<Long> getDoctorsCount() {
        return ResponseEntity.ok(adminService.getDoctorsCount());
    }

    @GetMapping("/managers/count")
    public ResponseEntity<Long> getManagersCount() {
        return ResponseEntity.ok(adminService.getManagersCount());
    }

    @GetMapping("/appointments/count")
    public ResponseEntity<Long> getAppointmentsCount() {
        return ResponseEntity.ok(adminService.getAppointmentsCount());
    }

    // ----- CÁC ENDPOINT TIỆN ÍCH KHÁC (GET) -----

    @GetMapping("/roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        List<Role> roles = roleRepository.findAll();
        return ResponseEntity.ok(roles);
    }
    
    @GetMapping("/specialties")
    public ResponseEntity<List<Specialty>> getAllSpecialties() {
        List<Specialty> specialties = adminService.getAllSpecialties();
        return ResponseEntity.ok(specialties);
    }
}
package com.hivclinic.controller;

import com.hivclinic.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasRole('MANAGER')")
public class ManagerController {
    @Autowired
    private ManagerService managerService;

    @GetMapping("/stats")
    public ResponseEntity<?> getSystemStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalPatients", managerService.getTotalPatients());
        stats.put("totalDoctors", managerService.getTotalDoctors());
        stats.put("totalAppointments", managerService.getTotalAppointments());
        stats.put("totalARVTreatments", managerService.getTotalARVTreatments());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/patients")
    public ResponseEntity<?> getAllPatients() {
        try {
            var patients = managerService.getAllPatients();
            return ResponseEntity.ok(patients);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể tải danh sách bệnh nhân: " + e.getMessage());
        }
    }

    @GetMapping("/doctors")
    public ResponseEntity<?> getAllDoctors() {
        try {
            var doctors = managerService.getAllDoctors();
            return ResponseEntity.ok(doctors);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể tải danh sách bác sĩ: " + e.getMessage());
        }
    }

    @GetMapping("/arv-treatments")
    public ResponseEntity<?> getAllARVTreatments() {
        try {
            var arvTreatments = managerService.getAllARVTreatmentsWithNames();
            return ResponseEntity.ok(arvTreatments);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể tải danh sách phác đồ ARV: " + e.getMessage());
        }
    }

    @GetMapping("/schedules")
    public ResponseEntity<?> getAllSchedules() {
        try {
            var schedules = managerService.getAllSchedules();
            return ResponseEntity.ok(schedules);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể tải danh sách lịch làm việc: " + e.getMessage());
        }
    }

    @GetMapping("/patients/search")
    public ResponseEntity<?> searchPatientsByName(@org.springframework.web.bind.annotation.RequestParam("q") String q) {
        try {
            var results = managerService.searchPatientsByName(q);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể tìm kiếm bệnh nhân: " + e.getMessage());
        }
    }

    @GetMapping("/doctors/search")
    public ResponseEntity<?> searchDoctorsByNameOrSpecialty(@org.springframework.web.bind.annotation.RequestParam("q") String q) {
        try {
            var results = managerService.searchDoctorsByNameOrSpecialty(q);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể tìm kiếm bác sĩ: " + e.getMessage());
        }
    }

    @GetMapping("/patients/{userId}/profile")
    public ResponseEntity<?> getPatientProfile(@PathVariable Integer userId) {
        try {
            var profileOpt = managerService.getPatientProfile(userId);
            if (profileOpt.isEmpty()) {
                return ResponseEntity.status(404).body("Không tìm thấy hồ sơ bệnh nhân");
            }
            var profile = profileOpt.get();
            // Lấy thông tin user liên kết
            var user = profile.getUser();
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("username", user != null ? user.getUsername() : "");
            result.put("email", user != null ? user.getEmail() : "");
            result.put("firstName", profile.getFirstName());
            result.put("lastName", profile.getLastName());
            result.put("dateOfBirth", profile.getDateOfBirth());
            result.put("gender", profile.getGender());
            result.put("address", profile.getAddress());
            result.put("phoneNumber", profile.getPhoneNumber());
            result.put("isActive", user != null ? user.getIsActive() : null);
            result.put("profileImageBase64", profile.getProfileImageBase64());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể lấy thông tin hồ sơ bệnh nhân: " + e.getMessage());
        }
    }

    @GetMapping("/patients/{userId}/records")
    public ResponseEntity<?> getPatientRecords(@PathVariable Integer userId) {
        try {
            var records = managerService.getPatientRecords(userId);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể lấy thông tin hồ sơ bệnh án: " + e.getMessage());
        }
    }

    @GetMapping("/patient-profile/{userId}")
    public ResponseEntity<?> getPatientProfileAndRecords(@PathVariable Integer userId) {
        try {
            var profileOpt = managerService.getPatientProfileByUserId(userId);
            var records = managerService.getPatientRecordsByUserId(userId);
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("profile", profileOpt.orElse(null));
            result.put("records", records);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể lấy thông tin chi tiết bệnh nhân: " + e.getMessage());
        }
    }
}

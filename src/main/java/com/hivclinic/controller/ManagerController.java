package com.hivclinic.controller;

import com.hivclinic.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
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
}

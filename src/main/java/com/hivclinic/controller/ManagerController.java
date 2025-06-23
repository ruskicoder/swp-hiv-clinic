package com.hivclinic.controller;

import com.hivclinic.repository.DoctorProfileRepository;
import com.hivclinic.repository.SpecialtyRepository;
import com.hivclinic.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasRole('MANAGER')")
public class ManagerController {
    @Autowired
    private ManagerService managerService;
    @Autowired
    private DoctorProfileRepository doctorProfileRepository;
    @Autowired
    private SpecialtyRepository specialtyRepository;

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
    public ResponseEntity<?> searchPatientsByName(@RequestParam("q") String q) {
        try {
            var results = managerService.searchPatientsByName(q);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể tìm kiếm bệnh nhân: " + e.getMessage());
        }
    }

    @GetMapping("/doctors/search")
    public ResponseEntity<?> searchDoctorsByNameOrSpecialty(@RequestParam("q") String q) {
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

    @GetMapping("/doctors/{userId}/profile")
    public ResponseEntity<?> getDoctorProfile(@PathVariable Integer userId) {
        try {
            var profileOpt = doctorProfileRepository.findByUser_UserId(userId);
            if (profileOpt.isEmpty()) return ResponseEntity.status(404).body("Không tìm thấy hồ sơ bác sĩ");
            var profile = profileOpt.get();
            var user = profile.getUser();
            java.util.Map<String, Object> result = new java.util.HashMap<>();
            result.put("username", user != null ? user.getUsername() : "");
            result.put("email", user != null ? user.getEmail() : "");
            result.put("firstName", profile.getFirstName());
            result.put("lastName", profile.getLastName());
            result.put("specialty", profile.getSpecialty() != null ? profile.getSpecialty().getSpecialtyName() : null);
            result.put("phoneNumber", profile.getPhoneNumber());
            result.put("bio", profile.getBio());
            result.put("isActive", user != null ? user.getIsActive() : null);
            result.put("profileImageBase64", profile.getProfileImageBase64());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể lấy thông tin bác sĩ: " + e.getMessage());
        }
    }

    @GetMapping("/doctors/{userId}/arv-treatments")
    public ResponseEntity<?> getDoctorARVTreatments(@PathVariable Integer userId) {
        try {
            var arvList = managerService.getARVTreatmentsByDoctor(userId);
            return ResponseEntity.ok(arvList);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể lấy danh sách ARV: " + e.getMessage());
        }
    }

    @GetMapping("/doctors/{userId}/appointments")
    public ResponseEntity<?> getDoctorAppointments(@PathVariable Integer userId) {
        try {
            var apps = managerService.getAppointmentsByDoctorUserId(userId);
            return ResponseEntity.ok(apps);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể lấy danh sách appointments: " + e.getMessage());
        }
    }

    @GetMapping("/doctors/{userId}/slots")
    public ResponseEntity<?> getDoctorSlots(@PathVariable Integer userId) {
        try {
            var slots = managerService.getDoctorSlotsByUserId(userId);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Không thể lấy danh sách slots: " + e.getMessage());
        }
    }

    @PutMapping("/doctors/{userId}/profile")
    public ResponseEntity<?> updateDoctorProfile(@PathVariable Integer userId, @RequestBody Map<String, Object> updateData) {
        try {
            var profileOpt = doctorProfileRepository.findByUser_UserId(userId);
            if (profileOpt.isEmpty()) return ResponseEntity.status(404).body("Không tìm thấy hồ sơ bác sĩ");
            var profile = profileOpt.get();
            // Cập nhật các trường cho profile
            if (updateData.containsKey("firstName")) profile.setFirstName((String) updateData.get("firstName"));
            if (updateData.containsKey("lastName")) profile.setLastName((String) updateData.get("lastName"));
            if (updateData.containsKey("phoneNumber")) profile.setPhoneNumber((String) updateData.get("phoneNumber"));
            if (updateData.containsKey("bio")) profile.setBio((String) updateData.get("bio"));
            if (updateData.containsKey("profileImageBase64")) profile.setProfileImageBase64((String) updateData.get("profileImageBase64"));
            // Cập nhật chuyên khoa nếu có
            if (updateData.containsKey("specialtyId")) {
                Object specialtyIdObj = updateData.get("specialtyId");
                Integer specialtyId = null;
                if (specialtyIdObj instanceof Integer) {
                    specialtyId = (Integer) specialtyIdObj;
                } else if (specialtyIdObj instanceof String) {
                    try { specialtyId = Integer.parseInt((String) specialtyIdObj); } catch (Exception ignored) {}
                }
                if (specialtyId != null) {
                    var specialtyOpt = specialtyRepository.findById(specialtyId);
                    specialtyOpt.ifPresent(profile::setSpecialty);
                }
            }
            doctorProfileRepository.save(profile);
            return ResponseEntity.ok("Cập nhật thông tin bác sĩ thành công");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Cập nhật thất bại: " + e.getMessage());
        }
    }
}

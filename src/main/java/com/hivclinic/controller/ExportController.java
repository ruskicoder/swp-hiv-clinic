package com.hivclinic.controller;

import com.hivclinic.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/export")
@PreAuthorize("hasRole('MANAGER')")
public class ExportController {

    @Autowired
    private ManagerService managerService;

    @GetMapping("/patient-profiles")
    public ResponseEntity<byte[]> exportPatientProfiles() {
        String csv = managerService.generatePatientProfilesCSV();
        return createCSVResponse(csv, "patient_profiles.csv");
    }

    @GetMapping("/doctor-slots")
    public ResponseEntity<byte[]> exportDoctorSlots() {
        String csv = managerService.generateDoctorSlotsCSV();
        return createCSVResponse(csv, "doctor_slots.csv");
    }

    @GetMapping("/arv-treatments")
    public ResponseEntity<byte[]> exportARVTreatments() {
        String csv = managerService.generateARVTreatmentsCSV();
        return createCSVResponse(csv, "arv_treatments.csv");
    }

    @GetMapping("/appointments")
    public ResponseEntity<byte[]> exportAppointments() {
        String csv = managerService.generateAppointmentsCSV();
        return createCSVResponse(csv, "appointments.csv");
    }

    @GetMapping("/doctor-profiles")
    public ResponseEntity<byte[]> exportDoctorProfiles() {
        String csv = managerService.generateDoctorProfilesCSV();
        return createCSVResponse(csv, "doctor_profiles.csv");
    }

    private ResponseEntity<byte[]> createCSVResponse(String csv, String filename) {
        byte[] bytes = csv.getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentLength(bytes.length);
        headers.setContentDispositionFormData("attachment", filename);
        return ResponseEntity.ok().headers(headers).body(bytes);
    }
}

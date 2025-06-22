package com.hivclinic.service;

import com.hivclinic.model.User;
import com.hivclinic.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ManagerService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private ARVTreatmentRepository arvTreatmentRepository;
    @Autowired
    private DoctorAvailabilitySlotRepository doctorAvailabilitySlotRepository;

    public long getTotalPatients() {
        return userRepository.countByRoleName("Patient");
    }

    public long getTotalDoctors() {
        return userRepository.countByRoleName("Doctor");
    }

    public long getTotalAppointments() {
        return appointmentRepository.count();
    }

    public long getTotalARVTreatments() {
        return arvTreatmentRepository.count();
    }

    public List<User> getAllPatients() {
        return userRepository.findAll().stream()
            .filter(user -> "Patient".equalsIgnoreCase(user.getRole().getRoleName()))
            .toList();
    }

    public List<User> getAllDoctors() {
        return userRepository.findAll().stream()
            .filter(user -> "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
            .toList();
    }

    public List<com.hivclinic.model.ARVTreatment> getAllARVTreatments() {
        return arvTreatmentRepository.findAll();
    }

    public List<com.hivclinic.model.DoctorAvailabilitySlot> getAllSchedules() {
        return doctorAvailabilitySlotRepository.findAll();
    }

    public List<User> searchPatientsByName(String q) {
        String query = q == null ? "" : q.trim().toLowerCase();
        return userRepository.findAll().stream()
            .filter(user -> "Patient".equalsIgnoreCase(user.getRole().getRoleName()))
            .filter(user -> user.getFirstName() != null && user.getFirstName().toLowerCase().contains(query)
                || user.getLastName() != null && user.getLastName().toLowerCase().contains(query))
            .toList();
    }

    public List<User> searchDoctorsByNameOrSpecialty(String q) {
        String query = q == null ? "" : q.trim().toLowerCase();
        return userRepository.findAll().stream()
            .filter(user -> "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
            .filter(user -> (user.getFirstName() != null && user.getFirstName().toLowerCase().contains(query))
                || (user.getLastName() != null && user.getLastName().toLowerCase().contains(query))
                || (user.getSpecialty() != null && user.getSpecialty().toLowerCase().contains(query)))
            .toList();
    }

    public List<java.util.Map<String, Object>> getAllARVTreatmentsWithNames() {
        return arvTreatmentRepository.findAll().stream().map(arv -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("arvTreatmentID", arv.getArvTreatmentID());
            map.put("regimen", arv.getRegimen());
            map.put("startDate", arv.getStartDate());
            map.put("endDate", arv.getEndDate());
            map.put("adherence", arv.getAdherence());
            map.put("sideEffects", arv.getSideEffects());
            map.put("notes", arv.getNotes());
            map.put("isActive", arv.getIsActive());
            // Lấy tên bệnh nhân
            String patientName = "";
            if (arv.getPatientUserID() != null) {
                userRepository.findById(arv.getPatientUserID()).ifPresent(u -> {
                    map.put("patientName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                });
            } else {
                map.put("patientName", "-");
            }
            // Lấy tên bác sĩ
            if (arv.getDoctorUserID() != null) {
                userRepository.findById(arv.getDoctorUserID()).ifPresent(u -> {
                    map.put("doctorName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                });
            } else {
                map.put("doctorName", "-");
            }
            return map;
        }).toList();
    }
}

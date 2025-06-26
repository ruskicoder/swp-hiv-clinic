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
    @Autowired
    private PatientProfileRepository patientProfileRepository;
    @Autowired
    private PatientRecordRepository patientRecordRepository;

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

    public java.util.Optional<com.hivclinic.model.PatientProfile> getPatientProfile(Integer userId) {
        return patientProfileRepository.findByUser_UserId(userId);
    }

    public java.util.List<com.hivclinic.model.PatientRecord> getPatientRecords(Integer userId) {
        return patientRecordRepository.findAll().stream()
            .filter(r -> r.getPatientUserID() != null && r.getPatientUserID().equals(userId))
            .toList();
    }

    public java.util.Optional<com.hivclinic.model.PatientProfile> getPatientProfileByUserId(Integer userId) {
        return patientProfileRepository.findByUser_UserId(userId);
    }

    public java.util.List<com.hivclinic.model.PatientRecord> getPatientRecordsByUserId(Integer userId) {
        return patientRecordRepository.findAll().stream()
            .filter(r -> r.getPatientUserID() != null && r.getPatientUserID().equals(userId))
            .toList();
    }

    public java.util.Optional<User> getDoctorById(Integer userId) {
        return userRepository.findById(userId).filter(u -> u.getRole() != null && "Doctor".equalsIgnoreCase(u.getRole().getRoleName()));
    }

    public java.util.List<java.util.Map<String, Object>> getARVTreatmentsByDoctor(Integer doctorUserId) {
        return arvTreatmentRepository.findAll().stream()
            .filter(arv -> doctorUserId.equals(arv.getDoctorUserID()))
            .map(arv -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("arvTreatmentID", arv.getArvTreatmentID());
                map.put("regimen", arv.getRegimen());
                map.put("startDate", arv.getStartDate());
                map.put("endDate", arv.getEndDate());
                map.put("notes", arv.getNotes());
                // Lấy tên bệnh nhân
                if (arv.getPatientUserID() != null) {
                    userRepository.findById(arv.getPatientUserID()).ifPresent(u -> {
                        map.put("patientName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                    });
                } else {
                    map.put("patientName", "-");
                }
                return map;
            }).toList();
    }

    public java.util.List<java.util.Map<String, Object>> getAppointmentsByDoctorUserId(Integer doctorUserId) {
        return appointmentRepository.findAll().stream()
            .filter(a -> a.getDoctorUser() != null && a.getDoctorUser().getUserId().equals(doctorUserId))
            .map(a -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("appointmentId", a.getAppointmentId());
                map.put("patientName", a.getPatientUser() != null ? a.getPatientUser().getFirstName() + " " + a.getPatientUser().getLastName() : "-");
                map.put("dateTime", a.getAppointmentDateTime());
                map.put("status", a.getStatus());
                map.put("notes", a.getAppointmentNotes());
                return map;
            }).toList();
    }

    public java.util.List<java.util.Map<String, Object>> getDoctorSlotsByUserId(Integer doctorUserId) {
        return doctorAvailabilitySlotRepository.findAll().stream()
            .filter(s -> s.getDoctorUser() != null && s.getDoctorUser().getUserId().equals(doctorUserId))
            .map(s -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("slotId", s.getAvailabilitySlotId());
                map.put("date", s.getSlotDate());
                map.put("startTime", s.getStartTime());
                map.put("endTime", s.getEndTime());
                map.put("status", s.getIsBooked() != null && s.getIsBooked() ? "Booked" : "Available");
                if (s.getIsBooked() != null && s.getIsBooked()) {
                    // Find the appointment for this slot
                    var appointments = appointmentRepository.findByAvailabilitySlot(s);
                    if (!appointments.isEmpty()) {
                        var appointment = appointments.get(0); // Most recent
                        var patient = appointment.getPatientUser();
                        if (patient != null) {
                            map.put("bookedByName", (patient.getFirstName() != null ? patient.getFirstName() : "") + " " + (patient.getLastName() != null ? patient.getLastName() : ""));
                            map.put("bookedByUsername", patient.getUsername());
                            map.put("bookedByEmail", patient.getEmail());
                        }
                    }
                }
                return map;
            }).toList();
    }
}

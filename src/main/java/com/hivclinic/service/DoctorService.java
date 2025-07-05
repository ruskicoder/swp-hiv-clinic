package com.hivclinic.service;

import com.hivclinic.dto.PatientAppointmentDTO;
import com.hivclinic.dto.PatientDashboardDTO;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.DoctorProfileRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing doctor-related operations
 */
@Service
public class DoctorService {
    
    private static final Logger logger = LoggerFactory.getLogger(DoctorService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;
    
    /**
     * Get all doctors in the system
     */
    public List<User> getAllDoctors() {
        try {
            List<User> doctors = userRepository.findAllNonDummyDoctors().stream()
                .filter(User::getIsActive)
                .toList();

            // Attach doctor profile info for each doctor
            for (User doctor : doctors) {
                doctorProfileRepository.findByUser(doctor).ifPresent(profile -> {
                    doctor.setFirstName(profile.getFirstName());
                    doctor.setLastName(profile.getLastName());
                    if (profile.getSpecialty() != null) {
                        doctor.setSpecialty(profile.getSpecialty().getSpecialtyName());
                    }
                });
            }
            return doctors;
        } catch (Exception e) {
            logger.error("Error fetching all doctors: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch doctors: " + e.getMessage());
        }
    }

    /**
     * Get doctor by ID
     */
    public Optional<User> getDoctorById(Integer doctorId) {
        try {
            Optional<User> doctorOpt = userRepository.findById(doctorId);
            if (doctorOpt.isPresent()) {
                User doctor = doctorOpt.get();
                if ("Doctor".equalsIgnoreCase(doctor.getRole().getRoleName()) && doctor.getIsActive()) {
                    // Attach doctor profile info
                    doctorProfileRepository.findByUser(doctor).ifPresent(profile -> {
                        doctor.setFirstName(profile.getFirstName());
                        doctor.setLastName(profile.getLastName());
                        if (profile.getSpecialty() != null) {
                            doctor.setSpecialty(profile.getSpecialty().getSpecialtyName());
                        }
                    });
                    return Optional.of(doctor);
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            logger.error("Error fetching doctor by ID {}: {}", doctorId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch doctor: " + e.getMessage());
        }
    }

    /**
     * Get patients with appointments for a specific doctor
     */
    public List<PatientAppointmentDTO> getPatientsWithAppointments(Integer doctorId) {
        try {
            List<Appointment> appointments = appointmentRepository.findByDoctorUserIdAndStatus(doctorId, "Scheduled");
            return appointments.stream()
                    .map(appointment -> {
                        PatientAppointmentDTO dto = new PatientAppointmentDTO();
                        dto.setAppointmentId(appointment.getAppointmentId());
                        dto.setPatientName(appointment.getPatientUser().getUsername());
                        dto.setAppointmentDateTime(appointment.getAppointmentDateTime());
                        dto.setStatus(appointment.getStatus());
                        dto.setPatientUserId(appointment.getPatientUser().getUserId());
                        dto.setNotificationCount(0); // Default value
                        return dto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching patients with appointments for doctor ID {}: {}", doctorId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch patients with appointments: " + e.getMessage());
        }
    }

    public List<PatientDashboardDTO> getDashboardPatients(Integer doctorId) {
        try {
            List<Appointment> appointments = appointmentRepository.findByDoctorUserId(doctorId);
            return appointments.stream()
                    .map(appointment -> new PatientDashboardDTO(
                            appointment.getPatientUser().getUserId(),
                            appointment.getPatientUser().getUsername(),
                            appointment.getAppointmentDateTime(),
                            appointment.getStatus()
                    ))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            logger.error("Error fetching dashboard patients for doctor ID {}: {}", doctorId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch dashboard patients: " + e.getMessage());
        }
    }
}
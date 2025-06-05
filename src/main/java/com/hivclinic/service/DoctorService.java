package com.hivclinic.service;

import com.hivclinic.model.User;
import com.hivclinic.repository.DoctorProfileRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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
    
    /**
     * Get all doctors in the system
     */
    public List<User> getAllDoctors() {
        try {
            List<User> doctors = userRepository.findAll().stream()
                .filter(user -> "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
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
}
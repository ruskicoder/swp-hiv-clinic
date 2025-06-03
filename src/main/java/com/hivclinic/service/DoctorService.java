package com.hivclinic.service;

import com.hivclinic.model.User;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Service class for doctor-related operations
 * Handles doctor information retrieval and management
 */
@Service
public class DoctorService {

    private static final Logger logger = LoggerFactory.getLogger(DoctorService.class);

    @Autowired
    private UserRepository userRepository;
    /**
     * Get all doctors in the system
     */
    public List<User> getAllDoctors() {
        try {
            return userRepository.findAll().stream()
                .filter(user -> "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
                    .filter(User::getIsActive)
                    .toList();
        } catch (Exception e) {
            logger.error("Error fetching all doctors: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch doctors: " + e.getMessage());
        }
    }

    /**
     * Get doctor by ID
     */
    public User getDoctorById(Integer doctorId) {
        try {
            Optional<User> userOpt = userRepository.findById(doctorId);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("Doctor not found");
}

            User doctor = userOpt.get();
            if (!"Doctor".equalsIgnoreCase(doctor.getRole().getRoleName())) {
                throw new RuntimeException("User is not a doctor");
            }

            return doctor;
        } catch (Exception e) {
            logger.error("Error fetching doctor by ID {}: {}", doctorId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch doctor: " + e.getMessage());
        }
    }

    /**
     * Get all active doctors
     */
    public List<User> getActiveDoctors() {
        try {
            return userRepository.findAll().stream()
                    .filter(user -> "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
                    .filter(User::getIsActive)
                    .toList();
        } catch (Exception e) {
            logger.error("Error fetching active doctors: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch active doctors: " + e.getMessage());
        }
    }
}
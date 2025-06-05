package com.hivclinic.service;

import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.*;
import com.hivclinic.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service class for administrative operations
 * Handles user management, system administration, and oversight functions
 */
@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Create a new doctor account
     */
    @Transactional
    public MessageResponse createDoctorAccount(String username, String email, String password, 
                                             String firstName, String lastName, String phoneNumber, 
                                             Integer specialtyId, String bio) {
        try {
            // Check if username already exists
            if (userRepository.existsByUsername(username)) {
                return MessageResponse.error("Username is already taken!");
            }

            // Check if email already exists
            if (userRepository.existsByEmail(email)) {
                return MessageResponse.error("Email is already in use!");
            }

            // Get Doctor role
            Optional<Role> doctorRoleOpt = roleRepository.findByRoleName("Doctor");
            if (doctorRoleOpt.isEmpty()) {
                logger.error("Doctor role not found in database");
                return MessageResponse.error("System error: Doctor role not configured");
            }
            Role doctorRole = doctorRoleOpt.get();

            // Get specialty if provided
            Specialty specialty = null;
            if (specialtyId != null) {
                Optional<Specialty> specialtyOpt = specialtyRepository.findById(specialtyId);
                if (specialtyOpt.isEmpty()) {
                    return MessageResponse.error("Specialty not found");
                }
                specialty = specialtyOpt.get();
            }

            // Create new user
            User user = new User();
            user.setUsername(username);
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(password));
            user.setRole(doctorRole);
            user.setIsActive(true);

            // Save user
            User savedUser = userRepository.save(user);

            // Create doctor profile
            DoctorProfile doctorProfile = new DoctorProfile();
            doctorProfile.setUser(savedUser);
            doctorProfile.setFirstName(firstName);
            doctorProfile.setLastName(lastName);
            doctorProfile.setPhoneNumber(phoneNumber);
            doctorProfile.setSpecialty(specialty);
            doctorProfile.setBio(bio);

            // Save doctor profile
            doctorProfileRepository.save(doctorProfile);

            logger.info("Doctor account created successfully: {}", username);
            return MessageResponse.success("Doctor account created successfully!");

        } catch (Exception e) {
            logger.error("Error creating doctor account: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to create doctor account: " + e.getMessage());
        }
    }

    /**
     * Get all users
     */
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    /**
     * Get all patients
     */
    public List<User> getAllPatients() {
        return userRepository.findAll().stream()
                .filter(user -> "Patient".equalsIgnoreCase(user.getRole().getRoleName()))
                .toList();
    }

    /**
     * Get all doctors
     */
    public List<User> getAllDoctors() {
        List<User> doctors = userRepository.findAll().stream()
                .filter(user -> "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
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
    }

    /**
     * Get all appointments (admin oversight)
     */
    public List<Appointment> getAllAppointments() {
        try {
            return appointmentRepository.findAll();
        } catch (Exception e) {
            logger.error("Error fetching all appointments: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch appointments: " + e.getMessage());
        }
    }

    /**
     * Activate/Deactivate user account
     */
    @Transactional
    public MessageResponse toggleUserStatus(Integer userId) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return MessageResponse.error("User not found");
            }

            User user = userOpt.get();
            user.setIsActive(!user.getIsActive());
            userRepository.save(user);

            String status = user.getIsActive() ? "activated" : "deactivated";
            logger.info("User {} {}", user.getUsername(), status);
            return MessageResponse.success("User account " + status + " successfully!");

        } catch (Exception e) {
            logger.error("Error toggling user status: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update user status: " + e.getMessage());
        }
    }

    /**
     * Reset user password
     */
    @Transactional
    public MessageResponse resetUserPassword(Integer userId, String newPassword) {
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return MessageResponse.error("User not found");
            }

            User user = userOpt.get();
            user.setPasswordHash(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            logger.info("Password reset for user: {}", user.getUsername());
            return MessageResponse.success("Password reset successfully!");
        } catch (Exception e) {
            logger.error("Error resetting password: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to reset password: " + e.getMessage());
        }
    }

    /**
     * Get all specialties
     */
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    /**
     * Create new specialty
     */
    @Transactional
    public MessageResponse createSpecialty(String specialtyName, String description) {
        try {
            // Check if specialty already exists
            Optional<Specialty> existingSpecialty = specialtyRepository.findBySpecialtyName(specialtyName);
            if (existingSpecialty.isPresent()) {
                return MessageResponse.error("Specialty already exists");
            }

            Specialty specialty = new Specialty();
            specialty.setSpecialtyName(specialtyName);
            specialty.setDescription(description);
            specialty.setIsActive(true);

            specialtyRepository.save(specialty);

            logger.info("Specialty created: {}", specialtyName);
            return MessageResponse.success("Specialty created successfully!");

        } catch (Exception e) {
            logger.error("Error creating specialty: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to create specialty: " + e.getMessage());
        }
    }
}
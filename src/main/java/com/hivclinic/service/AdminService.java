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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    @Transactional
    public MessageResponse createManagerAccount(String username, String email, String password, String firstName, String lastName) {
        if (userRepository.existsByUsername(username)) {
            return MessageResponse.error("Username is already taken!");
        }
        if (userRepository.existsByEmail(email)) {
            return MessageResponse.error("Email is already in use!");
        }
        Role managerRole = roleRepository.findByRoleName("Manager")
                .orElseThrow(() -> new RuntimeException("System error: Manager role not configured."));

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setRole(managerRole);
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        return MessageResponse.success("Manager account created successfully!");
    }
    
    @Transactional
    public MessageResponse createDoctorAccount(String username, String email, String password, String firstName, String lastName, String phoneNumber, Integer specialtyId, String bio) {
        if (userRepository.existsByUsername(username)) {
            return MessageResponse.error("Username is already taken!");
        }
        if (userRepository.existsByEmail(email)) {
            return MessageResponse.error("Email is already in use!");
        }
        Role doctorRole = roleRepository.findByRoleName("Doctor")
            .orElseThrow(() -> new RuntimeException("System error: Doctor role not configured."));
        Specialty specialty = specialtyRepository.findById(specialtyId)
            .orElseThrow(() -> new RuntimeException("Specialty not found for ID: " + specialtyId));
        
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(doctorRole);
        user.setIsActive(true);
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setSpecialty(specialty.getSpecialtyName());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        User savedUser = userRepository.save(user);

        DoctorProfile doctorProfile = new DoctorProfile();
        doctorProfile.setUser(savedUser);
        doctorProfile.setFirstName(firstName);
        doctorProfile.setLastName(lastName);
        doctorProfile.setPhoneNumber(phoneNumber);
        doctorProfile.setSpecialty(specialty);
        doctorProfile.setBio(bio);
        doctorProfileRepository.save(doctorProfile);

        return MessageResponse.success("Doctor account created successfully!");
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getAllPatients() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && "Patient".equalsIgnoreCase(user.getRole().getRoleName()))
                .collect(Collectors.toList());
    }

    public List<User> getAllDoctors() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
                .collect(Collectors.toList());
    }

    public List<User> getAllManagers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getRole() != null && "Manager".equalsIgnoreCase(user.getRole().getRoleName()))
                .collect(Collectors.toList());
    }

    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }
    
    @Transactional
    public MessageResponse toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        String status = user.getIsActive() ? "activated" : "deactivated";
        return MessageResponse.success("User account " + status + " successfully!");
    }

    @Transactional
    public MessageResponse resetUserPassword(Integer userId, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return MessageResponse.success("Password reset successfully!");
    }
    
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }
    
    @Transactional
    public MessageResponse createSpecialty(String specialtyName, String description) {
        Optional<Specialty> existingSpecialty = specialtyRepository.findBySpecialtyName(specialtyName);
        if (existingSpecialty.isPresent()) {
            return MessageResponse.error("Specialty already exists");
        }

        Specialty specialty = new Specialty();
        specialty.setSpecialtyName(specialtyName);
        specialty.setDescription(description);
        specialty.setIsActive(true);
        specialtyRepository.save(specialty);
        return MessageResponse.success("Specialty created successfully!");
    }
}
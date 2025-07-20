package com.hivclinic.service;

import com.hivclinic.dto.request.AdminCreateUserRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.*;
import com.hivclinic.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private DoctorProfileRepository doctorProfileRepository;
    @Autowired private PatientProfileRepository patientProfileRepository;
    @Autowired private SpecialtyRepository specialtyRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    // ----- PHƯƠNG THỨC LẤY DANH SÁCH CÓ PHÂN TRANG -----

    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAllNonDummyUsers(pageable);
    }

    public Page<User> getAllPatients(Pageable pageable) {
        return userRepository.findAllNonDummyPatients(pageable);
    }

    public Page<User> getAllDoctors(Pageable pageable) {
        return userRepository.findAllNonDummyDoctors(pageable);
    }

    public Page<User> getAllManagers(Pageable pageable) {
        return userRepository.findAllByRoleName("Manager", pageable);
    }

    public Page<Appointment> getAllAppointments(Pageable pageable) {
        return appointmentRepository.findAll(pageable);
    }

    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    // ----- PHƯƠNG THỨC ĐẾM SỐ LƯỢNG (DÙNG CHO OVERVIEW) -----

    public long getUsersCount() {
        return userRepository.countNonDummyUsers();
    }

    public long getPatientsCount() {
        return userRepository.countNonDummyPatients();
    }

    public long getDoctorsCount() {
        return userRepository.countNonDummyDoctors();
    }

    public long getManagersCount() {
        return userRepository.countByRoleName("Manager");
    }

    public long getAppointmentsCount() {
        return appointmentRepository.count();
    }

    // ----- CÁC PHƯƠNG THỨC HÀNH ĐỘNG (POST, PUT) -----

    @Transactional(readOnly = false)
    public MessageResponse createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return MessageResponse.error("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return MessageResponse.error("Email is already in use!");
        }

        Role userRole = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new RuntimeException("Error: Role '" + request.getRoleName() + "' not found."));

        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setRole(userRole);
        newUser.setIsActive(true);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(newUser);
        logger.info("Created new user with ID: {}", savedUser.getUserId());

        String roleName = userRole.getRoleName();
        if ("Patient".equalsIgnoreCase(roleName)) {
            PatientProfile profile = new PatientProfile();
            profile.setUser(savedUser);
            profile.setFirstName(request.getFirstName());
            profile.setLastName(request.getLastName());
            profile.setPhoneNumber(request.getPhoneNumber());
            if (request.getGender() != null && !request.getGender().isEmpty()) {
                profile.setGender(Gender.fromString(request.getGender()));
            }
            patientProfileRepository.save(profile);
            logger.info("Created PatientProfile for user ID: {}", savedUser.getUserId());

        } else if ("Doctor".equalsIgnoreCase(roleName)) {
            DoctorProfile profile = new DoctorProfile();
            profile.setUser(savedUser);
            profile.setFirstName(request.getFirstName());
            profile.setLastName(request.getLastName());
            profile.setPhoneNumber(request.getPhoneNumber());
            doctorProfileRepository.save(profile);
            logger.info("Created DoctorProfile for user ID: {}", savedUser.getUserId());
        }

        return MessageResponse.success("User '" + savedUser.getUsername() + "' created successfully with role: " + roleName);
    }

    @Transactional(readOnly = false)
    public MessageResponse toggleUserStatus(Integer userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setIsActive(!user.getIsActive());
        userRepository.save(user);
        String status = user.getIsActive() ? "activated" : "deactivated";
        logger.info("User {} has been {}.", user.getUsername(), status);
        return MessageResponse.success("User account " + status + " successfully!");
    }

    @Transactional(readOnly = false)
    public MessageResponse resetUserPassword(Integer userId, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        logger.info("Password for user {} has been reset.", user.getUsername());
        return MessageResponse.success("Password reset successfully!");
    }
    
    @Transactional(readOnly = false)
    public MessageResponse createSpecialty(String specialtyName, String description) {
        if (specialtyRepository.findBySpecialtyName(specialtyName).isPresent()) {
            return MessageResponse.error("Specialty already exists");
        }
        Specialty specialty = new Specialty();
        specialty.setSpecialtyName(specialtyName);
        specialty.setDescription(description);
        specialty.setIsActive(true);
        specialtyRepository.save(specialty);
        logger.info("New specialty '{}' created.", specialtyName);
        return MessageResponse.success("Specialty created successfully!");
    }
}
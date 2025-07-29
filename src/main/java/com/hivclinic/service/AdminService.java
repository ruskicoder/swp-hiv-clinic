package com.hivclinic.service;

import com.hivclinic.dto.request.AdminCreateUserRequest;
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
import java.util.stream.Collectors;

@Service
public class AdminService {

    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private DoctorProfileRepository doctorProfileRepository;
    @Autowired private PatientProfileRepository patientProfileRepository;
    @Autowired private SpecialtyRepository specialtyRepository;
    @Autowired private AppointmentRepository appointmentRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    /**
     * Phương thức thống nhất để tạo bất kỳ loại tài khoản nào từ trang Admin.
     * Nó sẽ tự động tạo Profile tương ứng dựa trên vai trò được chọn.
     */
    @Transactional
    public MessageResponse createUser(AdminCreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            return MessageResponse.error("Username is already taken!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            return MessageResponse.error("Email is already in use!");
        }

        Role userRole = roleRepository.findByRoleName(request.getRoleName())
                .orElseThrow(() -> new RuntimeException("Error: Role '" + request.getRoleName() + "' not found."));

        // 1. Tạo User với thông tin đăng nhập và vai trò
        User newUser = new User();
        newUser.setUsername(request.getUsername());
        newUser.setEmail(request.getEmail());
        newUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        newUser.setRole(userRole);
        newUser.setIsActive(true);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(newUser);

        // 2. Tự động tạo Profile tương ứng với vai trò
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

        } else if ("Doctor".equalsIgnoreCase(roleName)) {
            DoctorProfile profile = new DoctorProfile();
            profile.setUser(savedUser);
            profile.setFirstName(request.getFirstName());
            profile.setLastName(request.getLastName());
            profile.setPhoneNumber(request.getPhoneNumber());
            if (request.getGender() != null && !request.getGender().isEmpty()) {
                profile.setGender(Gender.fromString(request.getGender()));
            }
            // Bác sĩ có thể tự cập nhật chuyên khoa sau này
            doctorProfileRepository.save(profile);
        }
        // Các vai trò khác như Manager, Admin có thể không cần profile riêng

        return MessageResponse.success("User '" + savedUser.getUsername() + "' created successfully with role: " + roleName);
    }

    // Các phương thức khác giữ nguyên
    public List<User> getAllUsers() { return userRepository.findAllNonDummyUsers(); }
    public List<User> getAllPatients() { return userRepository.findAllNonDummyPatients(); }
    public List<User> getAllDoctors() { return userRepository.findAllNonDummyDoctors(); }
    public List<User> getAllManagers() {
        Role managerRole = roleRepository.findByRoleName("Manager").orElse(null);
        if (managerRole == null) return List.of();
        return userRepository.findAll().stream()
                .filter(user -> managerRole.equals(user.getRole()))
                .collect(Collectors.toList());
    }
    public List<Appointment> getAllAppointments() { return appointmentRepository.findAll(); }
    public List<Specialty> getAllSpecialties() { return specialtyRepository.findAll(); }

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
    
    @Transactional
    public MessageResponse createSpecialty(String specialtyName, String description) {
        if (specialtyRepository.findBySpecialtyName(specialtyName).isPresent()) {
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
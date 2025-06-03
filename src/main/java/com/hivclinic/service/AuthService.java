package com.hivclinic.service;

import com.hivclinic.config.JwtUtils;
import com.hivclinic.dto.request.LoginRequest;
import com.hivclinic.dto.request.RegisterRequest;
import com.hivclinic.dto.response.AuthResponse;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.dto.response.UserProfileResponse;
import com.hivclinic.model.PatientProfile;
import com.hivclinic.model.Role;
import com.hivclinic.model.User;
import com.hivclinic.repository.DoctorProfileRepository;
import com.hivclinic.repository.PatientProfileRepository;
import com.hivclinic.repository.RoleRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {
    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Register a new user (Patient by default for MVP)
     */
    @Transactional
    public MessageResponse registerUser(RegisterRequest registerRequest) {
        try {
            // Check if username already exists
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                return MessageResponse.error("Username is already taken!");
            }

            // Check if email already exists
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                return MessageResponse.error("Email is already in use!");
            }

            // Get Patient role (default for registration)
            Optional<Role> patientRoleOpt = roleRepository.findByRoleName("Patient");
            if (patientRoleOpt.isEmpty()) {
                logger.error("Patient role not found in database");
                return MessageResponse.error("System error: Patient role not configured");
            }
            Role patientRole = patientRoleOpt.get();

            // Create new user
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setEmail(registerRequest.getEmail());
            user.setPasswordHash(passwordEncoder.encode(registerRequest.getPassword()));
            user.setRole(patientRole);
            user.setIsActive(true);

            // Save user
            User savedUser = userRepository.save(user);

            // Create patient profile
            PatientProfile patientProfile = new PatientProfile();
            patientProfile.setUser(savedUser);
            patientProfile.setFirstName(registerRequest.getFirstName());
            patientProfile.setLastName(registerRequest.getLastName());
            patientProfile.setPhoneNumber(registerRequest.getPhoneNumber());

            // Save patient profile
            patientProfileRepository.save(patientProfile);

            logger.info("User registered successfully: {}", registerRequest.getUsername());
            return MessageResponse.success("User registered successfully!");

        } catch (Exception e) {
            logger.error("Error during user registration: {}", e.getMessage(), e);
            return MessageResponse.error("Registration failed: " + e.getMessage());
        }
    }

    /**
     * Authenticate user and generate JWT token
     */
    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        try {
            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );

            // Get user details from authentication
            com.hivclinic.config.CustomUserDetailsService.UserPrincipal userPrincipal = 
                    (com.hivclinic.config.CustomUserDetailsService.UserPrincipal) authentication.getPrincipal();

            // Generate JWT token
            String jwt = jwtUtils.generateJwtToken(
                    userPrincipal.getUsername(),
                    userPrincipal.getId(),
                    userPrincipal.getRole()
            );

            logger.info("User authenticated successfully: {}", loginRequest.getUsername());

            // Return authentication response
            return new AuthResponse(
                    jwt,
                    userPrincipal.getId(),
                    userPrincipal.getUsername(),
                    userPrincipal.getEmail(),
                    userPrincipal.getRole()
            );

        } catch (AuthenticationException e) {
            logger.warn("Authentication failed for user: {} - {}", loginRequest.getUsername(), e.getMessage());
            throw new RuntimeException("Invalid username or password");
        } catch (Exception e) {
            logger.error("Error during authentication: {}", e.getMessage(), e);
            throw new RuntimeException("Authentication failed: " + e.getMessage());
        }
    }

    /**
     * Get user by username (for additional operations)
     */
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    /**
     * Check if username exists
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Check if email exists
     */
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    /**
     * Get user profile by UserPrincipal (role-based)
     */
    public UserProfileResponse getUserProfile(com.hivclinic.config.CustomUserDetailsService.UserPrincipal userPrincipal) {
        Optional<User> userOpt = userRepository.findById(userPrincipal.getId());
        if (userOpt.isEmpty()) throw new RuntimeException("User not found");
        
        User user = userOpt.get();
        String role = user.getRole().getRoleName();

        // Patient profile
        if ("Patient".equalsIgnoreCase(role)) {
            return patientProfileRepository.findByUser(user)
                .map(profile -> new UserProfileResponse(
                    user.getUserId(),
                    user.getUsername(),
                    user.getEmail(),
                    role,
                    user.getIsActive(),
                    user.getCreatedAt(),
                    profile.getFirstName(),
                    profile.getLastName(),
                    profile.getPhoneNumber(),
                    profile.getDateOfBirth(),
                    profile.getAddress(),
                    null, // specialty
                    null, // bio
                    profile.getProfileImageBase64()
                ))
                .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        }

        // Doctor profile
        if ("Doctor".equalsIgnoreCase(role)) {
            return doctorProfileRepository.findByUser(user)
                .map(profile -> new UserProfileResponse(
                    user.getUserId(),
                    user.getUsername(),
                    user.getEmail(),
                    role,
                    user.getIsActive(),
                    user.getCreatedAt(),
                    profile.getFirstName(),
                    profile.getLastName(),
                    profile.getPhoneNumber(),
                    null, // dateOfBirth
                    null, // address
                    profile.getSpecialty() != null ? profile.getSpecialty().getSpecialtyName() : null,
                    profile.getBio(),
                    profile.getProfileImageBase64()
                ))
                .orElseThrow(() -> new RuntimeException("Doctor profile not found"));
        }

        // Admin or other roles: basic info only
        return new UserProfileResponse(
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            role,
            user.getIsActive(),
            user.getCreatedAt(),
            null, // firstName
            null, // lastName
            null, // phoneNumber
            null, // dateOfBirth
            null, // address
            null, // specialty
            null, // bio
            null  // profileImageBase64
        );
    }

    /**
     * Update user profile (firstName, lastName, phoneNumber, etc.)
     */
    @Transactional
    public MessageResponse updateUserProfile(Integer userId, String firstName, String lastName, String phoneNumber, String dateOfBirth, String address, String bio) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return MessageResponse.error("User not found");
        }
        User user = userOpt.get();
        String role = user.getRole().getRoleName();

        try {
            if ("Patient".equalsIgnoreCase(role)) {
                var profileOpt = patientProfileRepository.findByUser(user);
                if (profileOpt.isEmpty()) return MessageResponse.error("Patient profile not found");
                var profile = profileOpt.get();
                if (firstName != null) profile.setFirstName(firstName);
                if (lastName != null) profile.setLastName(lastName);
                if (phoneNumber != null) profile.setPhoneNumber(phoneNumber);
                if (dateOfBirth != null) {
                    try {
                        profile.setDateOfBirth(java.time.LocalDate.parse(dateOfBirth));
                    } catch (Exception ignored) {}
                }
                if (address != null) profile.setAddress(address);
                patientProfileRepository.save(profile);
            } else if ("Doctor".equalsIgnoreCase(role)) {
                var profileOpt = doctorProfileRepository.findByUser(user);
                if (profileOpt.isEmpty()) return MessageResponse.error("Doctor profile not found");
                var profile = profileOpt.get();
                if (firstName != null) profile.setFirstName(firstName);
                if (lastName != null) profile.setLastName(lastName);
                if (phoneNumber != null) profile.setPhoneNumber(phoneNumber);
                if (bio != null) profile.setBio(bio);
                doctorProfileRepository.save(profile);
            }
            // Optionally update email on user entity if needed
            return MessageResponse.success("Profile updated successfully!");
        } catch (Exception e) {
            logger.error("Error updating profile: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update profile: " + e.getMessage());
        }
    }
}
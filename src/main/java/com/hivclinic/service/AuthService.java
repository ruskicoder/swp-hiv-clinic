package com.hivclinic.service;

import com.hivclinic.exception.ResourceNotFoundException;

import com.hivclinic.config.JwtUtils;
import com.hivclinic.dto.request.ChangePasswordRequest;
import com.hivclinic.dto.request.LoginRequest;
import com.hivclinic.dto.request.RegisterRequest;
import com.hivclinic.dto.response.AuthResponse;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.dto.response.UserProfileResponse;
import com.hivclinic.model.DoctorProfile;
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
    
    @Autowired
    private LoginActivityService loginActivityService;
    
    @Autowired
    private UserSessionService userSessionService;

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
            // Set firstname and lastname in Users table
            user.setFirstName(registerRequest.getFirstName());
            user.setLastName(registerRequest.getLastName());
            // No specialty for patient registration
            // Set createdAt and updatedAt
            user.setCreatedAt(java.time.LocalDateTime.now());
            user.setUpdatedAt(java.time.LocalDateTime.now());

            // Save user
            User savedUser = userRepository.save(user);

            // Create patient profile
            PatientProfile patientProfile = new PatientProfile();
            patientProfile.setUser(savedUser);
            patientProfile.setFirstName(registerRequest.getFirstName());
            patientProfile.setLastName(registerRequest.getLastName());
            patientProfile.setPhoneNumber(registerRequest.getPhoneNumber());
            patientProfile.setGender(registerRequest.getGender()); // Set gender (allows null)

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
        return authenticateUser(loginRequest, null, null);
    }
    
    /**
     * Authenticate user and generate JWT token with login activity tracking
     */
    public AuthResponse authenticateUser(LoginRequest loginRequest, String ipAddress, String userAgent) {
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

            // Log successful login attempt
            loginActivityService.logLoginAttempt(loginRequest.getUsername(), true, ipAddress, userAgent);

            // Create session for the user
            Optional<User> authenticatedUser = userRepository.findByUsername(loginRequest.getUsername());
            if (authenticatedUser.isPresent()) {
                userSessionService.createSession(authenticatedUser.get(), jwt, ipAddress, userAgent);
            }

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
            
            // Log failed login attempt
            loginActivityService.logLoginAttempt(loginRequest.getUsername(), false, ipAddress, userAgent);
            
            throw new RuntimeException("Invalid username or password");
        } catch (Exception e) {
            logger.error("Error during authentication: {}", e.getMessage(), e);
            
            // Log failed login attempt for system errors
            loginActivityService.logLoginAttempt(loginRequest.getUsername(), false, ipAddress, userAgent);
            
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
                    profile.getGender(),
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
            var doctorProfile = doctorProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    // Create default doctor profile if not exists
                    DoctorProfile newProfile = new DoctorProfile();
                    newProfile.setUser(user);
                    newProfile.setFirstName(user.getUsername()); // Default to username
                    newProfile.setLastName("");
                    return doctorProfileRepository.save(newProfile);
                });

            return new UserProfileResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                role,
                user.getIsActive(),
                user.getCreatedAt(),
                doctorProfile.getFirstName(),
                doctorProfile.getLastName(),
                doctorProfile.getPhoneNumber(),
                doctorProfile.getGender(),
                null, // dateOfBirth
                null, // address
                doctorProfile.getSpecialty() != null ? doctorProfile.getSpecialty().getSpecialtyName() : null,
                doctorProfile.getBio(),
                doctorProfile.getProfileImageBase64()
            );
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
            null, // gender
            null, // dateOfBirth
            null, // address
            null, // specialty
            null, // bio
            null  // profileImageBase64
        );
    }

    /**
     * Update user profile (firstName, lastName, phoneNumber, gender, etc.)
     */
    @Transactional
    public MessageResponse updateUserProfile(Integer userId, String firstName, String lastName, String phoneNumber, String gender, String dateOfBirth, String address, String bio) {
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
                
                // Gender business logic: once set, cannot be null
                if (gender != null) {
                    // Validate gender values
                    if (!gender.isEmpty() && !java.util.Arrays.asList("Male", "Female", "Other", "Prefer not to say").contains(gender)) {
                        return MessageResponse.error("Invalid gender value");
                    }
                    // If current gender is not null and we're trying to set it to empty, reject
                    if (profile.getGender() != null && !profile.getGender().isEmpty() && gender.isEmpty()) {
                        return MessageResponse.error("Gender cannot be unselected once it has been set");
                    }
                    profile.setGender(gender.isEmpty() ? null : gender);
                }
                
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
                
                // Gender business logic: once set, cannot be null
                if (gender != null) {
                    // Validate gender values
                    if (!gender.isEmpty() && !java.util.Arrays.asList("Male", "Female", "Other", "Prefer not to say").contains(gender)) {
                        return MessageResponse.error("Invalid gender value");
                    }
                    // If current gender is not null and we're trying to set it to empty, reject
                    if (profile.getGender() != null && !profile.getGender().isEmpty() && gender.isEmpty()) {
                        return MessageResponse.error("Gender cannot be unselected once it has been set");
                    }
                    profile.setGender(gender.isEmpty() ? null : gender);
                }
                
                if (bio != null) profile.setBio(bio);
                doctorProfileRepository.save(profile); // ensure save after update
            }
            // Optionally update email on user entity if needed
            return MessageResponse.success("Profile updated successfully!");
        } catch (Exception e) {
            logger.error("Error updating profile: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update profile: " + e.getMessage());
        }
    }

    /**
     * Update profile image for current user (Patient or Doctor)
     */
    @Transactional
    public MessageResponse updateProfileImage(Integer userId, String base64Image) {
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
                profile.setProfileImageBase64(base64Image);
                patientProfileRepository.save(profile);
            } else if ("Doctor".equalsIgnoreCase(role)) {
                var profileOpt = doctorProfileRepository.findByUser(user);
                if (profileOpt.isEmpty()) return MessageResponse.error("Doctor profile not found");
                var profile = profileOpt.get();
                profile.setProfileImageBase64(base64Image);
                doctorProfileRepository.save(profile);
            } else {
                return MessageResponse.error("Profile image upload not supported for this role");
            }
            return MessageResponse.success("Profile image uploaded successfully");
        } catch (Exception e) {
            logger.error("Error updating profile image: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update profile image: " + e.getMessage());
        }
    }

    /**
     * Change user password
     */
    @Transactional
    public MessageResponse changePassword(Integer userId, ChangePasswordRequest request) {
        try {
            // Get user by ID
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.warn("Change password attempt for non-existent user ID: {}", userId);
                return MessageResponse.error("User not found");
            }
            
            User user = userOpt.get();
            
            // Verify current password
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                logger.warn("Change password failed - incorrect current password for user: {}", user.getUsername());
                return MessageResponse.error("Current password is incorrect");
            }
            
            // Validate new password is different from current
            if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
                logger.warn("Change password failed - new password same as current for user: {}", user.getUsername());
                return MessageResponse.error("New password must be different from current password");
            }
            
            // Update password
            user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
            user.setUpdatedAt(java.time.LocalDateTime.now());
            
            userRepository.save(user);
            
            logger.info("Password changed successfully for user: {}", user.getUsername());
            return MessageResponse.success("Password changed successfully");
            
        } catch (Exception e) {
            logger.error("Error changing password for user ID {}: {}", userId, e.getMessage(), e);
            return MessageResponse.error("Failed to change password: " + e.getMessage());
        }
    }

    /**
     * Get user profile by User (for internal use, e.g., admin panel)
     */
    public UserProfileResponse getUserProfile(User user) {
        String role = user.getRole().getRoleName();

        // Doctor profile
        if ("Doctor".equalsIgnoreCase(role)) {
            var doctorProfile = doctorProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    // Create default doctor profile if not exists
                    DoctorProfile newProfile = new DoctorProfile();
                    newProfile.setUser(user);
                    newProfile.setFirstName(user.getUsername()); // Default to username
                    newProfile.setLastName("");
                    return doctorProfileRepository.save(newProfile);
                });

            return new UserProfileResponse(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                role,
                user.getIsActive(),
                user.getCreatedAt(),
                doctorProfile.getFirstName(),
                doctorProfile.getLastName(),
                doctorProfile.getPhoneNumber(),
                doctorProfile.getGender(),
                null, // dateOfBirth
                null, // address
                doctorProfile.getSpecialty() != null ? doctorProfile.getSpecialty().getSpecialtyName() : null,
                doctorProfile.getBio(),
                doctorProfile.getProfileImageBase64()
            );
        }

        // Patient profile
        var patientProfile = patientProfileRepository.findByUser(user)
            .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));

        return new UserProfileResponse(
            user.getUserId(),
            user.getUsername(),
            user.getEmail(),
            role,
            user.getIsActive(),
            user.getCreatedAt(),
            patientProfile.getFirstName(),
            patientProfile.getLastName(),
            patientProfile.getPhoneNumber(),
            patientProfile.getGender(),
            patientProfile.getDateOfBirth(),
            patientProfile.getAddress(),
            null, // specialty (not applicable for patients)
            null, // bio (not applicable for patients)
            patientProfile.getProfileImageBase64()
        );
    }
}
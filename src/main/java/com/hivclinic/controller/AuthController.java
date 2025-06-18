package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.request.LoginRequest;
import com.hivclinic.dto.request.RegisterRequest;
import com.hivclinic.dto.response.AuthResponse;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.dto.response.UserProfileResponse;
import com.hivclinic.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for handling user registration, login, and profile operations
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    private AuthService authService;

    /**
     * Register a new user account
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            logger.info("Registration attempt for username: {}", registerRequest.getUsername());
            
            MessageResponse response = authService.register(registerRequest);
            
            if (response.isSuccess()) {
                logger.info("User registered successfully: {}", registerRequest.getUsername());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Registration failed for username {}: {}", registerRequest.getUsername(), response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            logger.error("Error during registration for username {}: {}", registerRequest.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Registration failed: " + e.getMessage()));
        }
    }

    /**
     * Authenticate user login
     */
    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            logger.info("Login attempt for username: {}", loginRequest.getUsername());
            
            AuthResponse response = authService.authenticateUser(loginRequest);
            
            logger.info("User logged in successfully: {}", loginRequest.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.warn("Login failed for username {}: {}", loginRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MessageResponse.error("Invalid credentials: " + e.getMessage()));
        }
    }

    /**
     * Get current user profile - Updated endpoint path
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching profile for user: {}", userPrincipal.getUsername());
            UserProfileResponse profile = authService.getUserProfile(userPrincipal);
            
            logger.debug("Profile retrieved successfully for user: {}", userPrincipal.getUsername());
            return ResponseEntity.ok(profile);
            
        } catch (Exception e) {
            logger.error("Error fetching profile for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to get user profile: " + e.getMessage()));
        }
    }

    /**
     * Alternative profile endpoint for compatibility
     */
    @GetMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        return getCurrentUser(userPrincipal);
    }

    /**
     * Update user profile
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody java.util.Map<String, String> profileData) {
        try {
            logger.debug("Updating profile for user: {}", userPrincipal.getUsername());
            
            MessageResponse response = authService.updateUserProfile(
                userPrincipal.getId(),
                profileData.get("firstName"),
                profileData.get("lastName"),
                profileData.get("phoneNumber"),
                profileData.get("dateOfBirth"),
                profileData.get("address"),
                profileData.get("bio")
            );
            
            if (response.isSuccess()) {
                logger.info("Profile updated successfully for user: {}", userPrincipal.getUsername());
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error updating profile for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }

    /**
     * Update profile image
     */
    @PostMapping("/profile-image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfileImage(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody java.util.Map<String, String> imageData) {
        try {
            logger.debug("Updating profile image for user: {}", userPrincipal.getUsername());
            
            MessageResponse response = authService.updateProfileImage(
                userPrincipal.getId(),
                imageData.get("imageData")
            );
            
            if (response.isSuccess()) {
                logger.info("Profile image updated successfully for user: {}", userPrincipal.getUsername());
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error updating profile image for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update profile image: " + e.getMessage()));
        }
    }

    /**
     * Check if username is available
     */
    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        try {
            logger.debug("Checking username availability: {}", username);
            
            boolean exists = authService.existsByUsername(username);
            
            return ResponseEntity.ok(MessageResponse.builder()
                    .success(!exists)
                    .message(exists ? "Username is already taken" : "Username is available")
                    .build());
                    
        } catch (Exception e) {
            logger.error("Error checking username {}: {}", username, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to check username: " + e.getMessage()));
        }
    }

    /**
     * Check if email is available
     */
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        try {
            logger.debug("Checking email availability: {}", email);
            
            boolean exists = authService.existsByEmail(email);
            
            return ResponseEntity.ok(MessageResponse.builder()
                    .success(!exists)
                    .message(exists ? "Email is already in use" : "Email is available")
                    .build());
                    
        } catch (Exception e) {
            logger.error("Error checking email {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to check email: " + e.getMessage()));
        }
    }
}
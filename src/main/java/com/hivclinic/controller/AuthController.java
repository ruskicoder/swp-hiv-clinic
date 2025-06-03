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
 * REST Controller for authentication operations
 * Handles user registration, login, and profile management
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
            
            MessageResponse response = authService.registerUser(registerRequest);
            
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
     * Get current user profile
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
                    .message(exists ? "Email is already registered" : "Email is available")
                    .build());
                    
        } catch (Exception e) {
            logger.error("Error checking email {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to check email: " + e.getMessage()));
        }
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        return ResponseEntity.ok(MessageResponse.success("Auth service is running"));
    }

    /**
     * Update current user profile (firstName, lastName, etc.)
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestBody(required = true) java.util.Map<String, Object> payload
    ) {
        try {
            String firstName = (String) payload.getOrDefault("firstName", null);
            String lastName = (String) payload.getOrDefault("lastName", null);
            String phoneNumber = (String) payload.getOrDefault("phoneNumber", null);
            String dateOfBirth = (String) payload.getOrDefault("dateOfBirth", null);
            String address = (String) payload.getOrDefault("address", null);
            String bio = (String) payload.getOrDefault("bio", null);

            MessageResponse response = authService.updateUserProfile(
                userPrincipal.getId(), firstName, lastName, phoneNumber, dateOfBirth, address, bio
            );
            if (response.isSuccess()) {
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
}
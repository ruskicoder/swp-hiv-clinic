package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.request.ChangePasswordRequest;
import com.hivclinic.dto.request.LoginRequest;
import com.hivclinic.dto.request.RegisterRequest;
import com.hivclinic.dto.response.AuthResponse;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.dto.response.UserProfileResponse;
import com.hivclinic.service.AuthService;
import com.hivclinic.service.SessionStatusInfo;
import com.hivclinic.service.UserSessionService;
import jakarta.servlet.http.HttpServletRequest;
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
    
    @Autowired
    private UserSessionService userSessionService;

    /**
     * Register a new user account
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            logger.info("Registration attempt for username: {}", registerRequest.getUsername());
            
            // Validate password confirmation
            if (!registerRequest.getPassword().equals(registerRequest.getConfirmPassword())) {
                logger.warn("Password confirmation mismatch for username: {}", registerRequest.getUsername());
                return ResponseEntity.badRequest().body(MessageResponse.builder()
                    .success(false)
                    .message("Password and confirmation password do not match")
                    .build());
            }
            
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
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            logger.info("Login attempt for username: {}", loginRequest.getUsername());
            
            // Extract IP address and user agent for login activity tracking
            String ipAddress = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            AuthResponse response = authService.authenticateUser(loginRequest, ipAddress, userAgent);
            
            logger.info("User logged in successfully: {}", loginRequest.getUsername());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.warn("Login failed for username {}: {}", loginRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(MessageResponse.error("Invalid credentials: " + e.getMessage()));
        }
    }
    
    /**
     * Extract client IP address from request, considering proxy headers
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        String xForwardedForCloudflare = request.getHeader("CF-Connecting-IP");
        if (xForwardedForCloudflare != null && !xForwardedForCloudflare.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedForCloudflare)) {
            return xForwardedForCloudflare;
        }
        
        String proxyClientIp = request.getHeader("Proxy-Client-IP");
        if (proxyClientIp != null && !proxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(proxyClientIp)) {
            return proxyClientIp;
        }
        
        String wlProxyClientIp = request.getHeader("WL-Proxy-Client-IP");
        if (wlProxyClientIp != null && !wlProxyClientIp.isEmpty() && !"unknown".equalsIgnoreCase(wlProxyClientIp)) {
            return wlProxyClientIp;
        }
        
        String httpClientIp = request.getHeader("HTTP_CLIENT_IP");
        if (httpClientIp != null && !httpClientIp.isEmpty() && !"unknown".equalsIgnoreCase(httpClientIp)) {
            return httpClientIp;
        }
        
        String httpXForwardedFor = request.getHeader("HTTP_X_FORWARDED_FOR");
        if (httpXForwardedFor != null && !httpXForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(httpXForwardedFor)) {
            return httpXForwardedFor;
        }
        
        // Fall back to remote address
        return request.getRemoteAddr();
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
                profileData.get("gender"),
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
     * Change user password
     */
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            logger.debug("Password change request for user: {}", userPrincipal.getUsername());
            
            MessageResponse response = authService.changePassword(userPrincipal.getId(), request);
            
            if (response.isSuccess()) {
                logger.info("Password changed successfully for user: {}", userPrincipal.getUsername());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("Password change failed for user {}: {}", userPrincipal.getUsername(), response.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            logger.error("Error changing password for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to change password: " + e.getMessage()));
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
    
    /**
     * Check session status and remaining time
     */
    @GetMapping("/session/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> checkSessionStatus(HttpServletRequest request) {
        try {
            String jwtToken = extractJwtFromRequest(request);
            if (jwtToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(MessageResponse.error("No authentication token provided"));
            }
            
            SessionStatusInfo status = userSessionService.getSessionStatus(jwtToken);
            
            return ResponseEntity.ok(java.util.Map.of(
                "success", true,
                "message", status.getMessage(),
                "isActive", status.isActive(),
                "remainingMinutes", status.getRemainingMinutes(),
                "expiresAt", status.getExpiresAt()
            ));
            
        } catch (Exception e) {
            logger.error("Error checking session status: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to check session status: " + e.getMessage()));
        }
    }
    
    /**
     * Extend/refresh current session
     */
    @PostMapping("/session/extend")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> extendSession(HttpServletRequest request) {
        try {
            String jwtToken = extractJwtFromRequest(request);
            if (jwtToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(MessageResponse.error("No authentication token provided"));
            }
            
            boolean extended = userSessionService.extendSession(jwtToken);
            
            if (extended) {
                SessionStatusInfo status = userSessionService.getSessionStatus(jwtToken);
                return ResponseEntity.ok(java.util.Map.of(
                    "success", true,
                    "message", "Session extended successfully",
                    "remainingMinutes", status.getRemainingMinutes(),
                    "expiresAt", status.getExpiresAt()
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(MessageResponse.error("Session could not be extended - may be expired"));
            }
            
        } catch (Exception e) {
            logger.error("Error extending session: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to extend session: " + e.getMessage()));
        }
    }
    
    /**
     * Invalidate current session (logout)
     */
    @PostMapping("/session/invalidate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> invalidateSession(HttpServletRequest request) {
        try {
            String jwtToken = extractJwtFromRequest(request);
            if (jwtToken == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(MessageResponse.error("No authentication token provided"));
            }
            
            boolean invalidated = userSessionService.invalidateSessionByToken(jwtToken);
            
            if (invalidated) {
                return ResponseEntity.ok(MessageResponse.success("Session invalidated successfully"));
            } else {
                return ResponseEntity.ok(MessageResponse.success("Session was already invalid"));
            }
            
        } catch (Exception e) {
            logger.error("Error invalidating session: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to invalidate session: " + e.getMessage()));
        }
    }
    
    /**
     * Logout endpoint (alias for session invalidate)
     */
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        return invalidateSession(request);
    }
    
    /**
     * Extract JWT token from Authorization header
     */
    private String extractJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
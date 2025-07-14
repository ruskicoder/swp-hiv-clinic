package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.LoginActivity;
import com.hivclinic.model.User;
import com.hivclinic.service.AuthService;
import com.hivclinic.service.LoginActivityService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Controller for managing login activity data
 */
@RestController
@RequestMapping("/api/login-activity")
@CrossOrigin(origins = "*", maxAge = 3600)
public class LoginActivityController {
    
    private static final Logger logger = LoggerFactory.getLogger(LoginActivityController.class);
    
    @Autowired
    private LoginActivityService loginActivityService;
    
    @Autowired
    private AuthService authService;
    
    /**
     * Get current user's login history
     */
    @GetMapping("/my-history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyLoginHistory(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            logger.debug("Fetching login history for user: {}", userPrincipal.getUsername());
            
            Optional<User> userOpt = authService.findByUsername(userPrincipal.getUsername());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(MessageResponse.error("User not found"));
            }
            
            User user = userOpt.get();
            List<LoginActivity> loginHistory = loginActivityService.getUserLoginHistory(user, limit);
            
            logger.debug("Retrieved {} login activities for user: {}", loginHistory.size(), userPrincipal.getUsername());
            return ResponseEntity.ok(loginHistory);
            
        } catch (Exception e) {
            logger.error("Error fetching login history for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch login history: " + e.getMessage()));
        }
    }
    
    /**
     * Get current user's last login time
     */
    @GetMapping("/last-login")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getLastLogin(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching last login time for user: {}", userPrincipal.getUsername());
            
            Optional<User> userOpt = authService.findByUsername(userPrincipal.getUsername());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(MessageResponse.error("User not found"));
            }
            
            User user = userOpt.get();
            Optional<LocalDateTime> lastLoginTime = loginActivityService.getLastLoginTime(user);
            
            if (lastLoginTime.isPresent()) {
                return ResponseEntity.ok(MessageResponse.builder()
                        .success(true)
                        .message("Last login time retrieved successfully")
                        .data(lastLoginTime.get())
                        .build());
            } else {
                return ResponseEntity.ok(MessageResponse.builder()
                        .success(true)
                        .message("No previous login found")
                        .data(null)
                        .build());
            }
            
        } catch (Exception e) {
            logger.error("Error fetching last login time for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch last login time: " + e.getMessage()));
        }
    }
    
    /**
     * Get recent successful logins for current user
     */
    @GetMapping("/recent-successful")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getRecentSuccessfulLogins(
            @AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal,
            @RequestParam(defaultValue = "5") int limit) {
        try {
            logger.debug("Fetching recent successful logins for user: {}", userPrincipal.getUsername());
            
            Optional<User> userOpt = authService.findByUsername(userPrincipal.getUsername());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(MessageResponse.error("User not found"));
            }
            
            User user = userOpt.get();
            List<LoginActivity> recentLogins = loginActivityService.getRecentSuccessfulLogins(user, limit);
            
            logger.debug("Retrieved {} recent successful logins for user: {}", recentLogins.size(), userPrincipal.getUsername());
            return ResponseEntity.ok(recentLogins);
            
        } catch (Exception e) {
            logger.error("Error fetching recent successful logins for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch recent successful logins: " + e.getMessage()));
        }
    }
    
    /**
     * Get login statistics for current user
     */
    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getLoginStats(@AuthenticationPrincipal CustomUserDetailsService.UserPrincipal userPrincipal) {
        try {
            logger.debug("Fetching login statistics for user: {}", userPrincipal.getUsername());
            
            Optional<User> userOpt = authService.findByUsername(userPrincipal.getUsername());
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(MessageResponse.error("User not found"));
            }
            
            User user = userOpt.get();
            
            // Get all login activities for the user
            List<LoginActivity> allActivities = loginActivityService.getAllUserLoginActivities(user);
            List<LoginActivity> successfulLogins = loginActivityService.getRecentSuccessfulLogins(user, Integer.MAX_VALUE);
            List<LoginActivity> failedLogins = loginActivityService.getFailedLoginAttempts(user);
            
            // Calculate statistics
            long totalAttempts = allActivities.size();
            long successfulCount = successfulLogins.size();
            long failedCount = failedLogins.size();
            
            Optional<LocalDateTime> lastLoginTime = loginActivityService.getLastLoginTime(user);
            
            // Create response data
            var stats = new java.util.HashMap<String, Object>();
            stats.put("totalAttempts", totalAttempts);
            stats.put("successfulLogins", successfulCount);
            stats.put("failedAttempts", failedCount);
            stats.put("successRate", totalAttempts > 0 ? (double) successfulCount / totalAttempts * 100 : 0);
            stats.put("lastLoginTime", lastLoginTime.orElse(null));
            stats.put("isAccountLocked", loginActivityService.isAccountLocked(user));
            
            logger.debug("Retrieved login statistics for user: {}", userPrincipal.getUsername());
            return ResponseEntity.ok(MessageResponse.builder()
                    .success(true)
                    .message("Login statistics retrieved successfully")
                    .data(stats)
                    .build());
            
        } catch (Exception e) {
            logger.error("Error fetching login statistics for user {}: {}", userPrincipal.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch login statistics: " + e.getMessage()));
        }
    }
    
    /**
     * Admin endpoint: Get all login activities with pagination
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllLoginActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            logger.debug("Admin fetching all login activities - page: {}, size: {}", page, size);
            
            // For now, return a simple paginated response
            // In a full implementation, you'd use Spring Data JPA Pageable
            List<LoginActivity> allActivities = loginActivityService.getAllUserLoginActivities(null);
            
            int startIndex = page * size;
            int endIndex = Math.min(startIndex + size, allActivities.size());
            
            List<LoginActivity> pageActivities = allActivities.subList(startIndex, endIndex);
            
            var response = new java.util.HashMap<String, Object>();
            response.put("content", pageActivities);
            response.put("page", page);
            response.put("size", size);
            response.put("totalElements", allActivities.size());
            response.put("totalPages", (int) Math.ceil((double) allActivities.size() / size));
            
            logger.debug("Retrieved {} login activities for admin", pageActivities.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching all login activities for admin: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch login activities: " + e.getMessage()));
        }
    }
    
    /**
     * Admin endpoint: Get login activities by username
     */
    @GetMapping("/admin/user/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getLoginActivitiesByUsername(@PathVariable String username) {
        try {
            logger.debug("Admin fetching login activities for username: {}", username);
            
            Optional<User> userOpt = authService.findByUsername(username);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(MessageResponse.error("User not found"));
            }
            
            User user = userOpt.get();
            List<LoginActivity> activities = loginActivityService.getAllUserLoginActivities(user);
            
            logger.debug("Retrieved {} login activities for user: {}", activities.size(), username);
            return ResponseEntity.ok(activities);
            
        } catch (Exception e) {
            logger.error("Error fetching login activities for username {}: {}", username, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch login activities: " + e.getMessage()));
        }
    }
}
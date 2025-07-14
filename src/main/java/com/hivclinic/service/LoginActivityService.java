package com.hivclinic.service;

import com.hivclinic.model.LoginActivity;
import com.hivclinic.model.User;
import com.hivclinic.repository.LoginActivityRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class LoginActivityService {
    
    private static final Logger logger = LoggerFactory.getLogger(LoginActivityService.class);
    
    // Security constants
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int FAILED_ATTEMPT_WINDOW_MINUTES = 30;
    
    @Autowired
    private LoginActivityRepository loginActivityRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Log a login attempt (success or failure)
     */
    @Transactional
    public void logLoginAttempt(String username, boolean success, String ipAddress, String userAgent) {
        try {
            LoginActivity loginActivity = new LoginActivity();
            loginActivity.setUsernameAttempted(username);
            loginActivity.setIsSuccess(success);
            loginActivity.setIpAddress(ipAddress);
            loginActivity.setUserAgent(userAgent);
            
            // Set user if login was successful or if user exists
            Optional<User> userOpt = userRepository.findByUsername(username);
            if (userOpt.isPresent()) {
                loginActivity.setUser(userOpt.get());
                
                // Update last login time if successful
                if (success) {
                    User user = userOpt.get();
                    user.setLastLoginAt(LocalDateTime.now());
                    userRepository.save(user);
                    logger.info("Updated last login time for user: {}", username);
                }
            }
            
            loginActivityRepository.save(loginActivity);
            
            logger.info("Login attempt logged - Username: {}, Success: {}, IP: {}", 
                    username, success, ipAddress);
            
        } catch (Exception e) {
            logger.error("Error logging login attempt for username {}: {}", username, e.getMessage(), e);
        }
    }
    
    /**
     * Get the last successful login time for a user
     */
    public Optional<LocalDateTime> getLastLoginTime(User user) {
        try {
            return loginActivityRepository.findFirstByUserAndIsSuccessTrueOrderByAttemptTimeDesc(user)
                    .map(LoginActivity::getAttemptTime);
        } catch (Exception e) {
            logger.error("Error getting last login time for user {}: {}", user.getUsername(), e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    /**
     * Get user login history with limit
     */
    public List<LoginActivity> getUserLoginHistory(User user, int limit) {
        try {
            Pageable pageable = PageRequest.of(0, limit);
            return loginActivityRepository.findRecentLoginActivities(user, pageable);
        } catch (Exception e) {
            logger.error("Error getting login history for user {}: {}", user.getUsername(), e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Get all login activities for a user
     */
    public List<LoginActivity> getAllUserLoginActivities(User user) {
        try {
            return loginActivityRepository.findByUserOrderByAttemptTimeDesc(user);
        } catch (Exception e) {
            logger.error("Error getting all login activities for user {}: {}", user.getUsername(), e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Check if account should be locked due to failed attempts
     */
    public boolean isAccountLocked(User user) {
        try {
            LocalDateTime windowStart = LocalDateTime.now().minusMinutes(FAILED_ATTEMPT_WINDOW_MINUTES);
            long failedAttempts = loginActivityRepository.countByUserAndIsSuccessFalseAndAttemptTimeAfter(user, windowStart);
            
            boolean isLocked = failedAttempts >= MAX_FAILED_ATTEMPTS;
            
            if (isLocked) {
                logger.warn("Account locked due to {} failed attempts for user: {}", failedAttempts, user.getUsername());
            }
            
            return isLocked;
        } catch (Exception e) {
            logger.error("Error checking account lock status for user {}: {}", user.getUsername(), e.getMessage(), e);
            return false; // Default to not locked if there's an error
        }
    }
    
    /**
     * Check if account should be locked by username (for failed login attempts)
     */
    public boolean isAccountLockedByUsername(String username) {
        try {
            LocalDateTime windowStart = LocalDateTime.now().minusMinutes(FAILED_ATTEMPT_WINDOW_MINUTES);
            long failedAttempts = loginActivityRepository.countByUsernameAttemptedAndIsSuccessFalseAndAttemptTimeAfter(username, windowStart);
            
            boolean isLocked = failedAttempts >= MAX_FAILED_ATTEMPTS;
            
            if (isLocked) {
                logger.warn("Account locked due to {} failed attempts for username: {}", failedAttempts, username);
            }
            
            return isLocked;
        } catch (Exception e) {
            logger.error("Error checking account lock status for username {}: {}", username, e.getMessage(), e);
            return false; // Default to not locked if there's an error
        }
    }
    
    /**
     * Check for suspicious activity from IP address
     */
    public boolean isSuspiciousIpActivity(String ipAddress) {
        try {
            LocalDateTime windowStart = LocalDateTime.now().minusMinutes(FAILED_ATTEMPT_WINDOW_MINUTES);
            long failedAttemptsFromIp = loginActivityRepository.countByIpAddressAndIsSuccessFalseAndAttemptTimeAfter(ipAddress, windowStart);
            
            boolean isSuspicious = failedAttemptsFromIp >= MAX_FAILED_ATTEMPTS * 2; // More lenient for IP-based blocking
            
            if (isSuspicious) {
                logger.warn("Suspicious activity detected from IP: {} with {} failed attempts", ipAddress, failedAttemptsFromIp);
            }
            
            return isSuspicious;
        } catch (Exception e) {
            logger.error("Error checking suspicious IP activity for {}: {}", ipAddress, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get recent successful logins for a user
     */
    public List<LoginActivity> getRecentSuccessfulLogins(User user, int limit) {
        try {
            return loginActivityRepository.findByUserAndIsSuccessTrueOrderByAttemptTimeDesc(user)
                    .stream()
                    .limit(limit)
                    .toList();
        } catch (Exception e) {
            logger.error("Error getting recent successful logins for user {}: {}", user.getUsername(), e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Get failed login attempts for a user
     */
    public List<LoginActivity> getFailedLoginAttempts(User user) {
        try {
            return loginActivityRepository.findByUserAndIsSuccessFalseOrderByAttemptTimeDesc(user);
        } catch (Exception e) {
            logger.error("Error getting failed login attempts for user {}: {}", user.getUsername(), e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Get login activities within date range
     */
    public List<LoginActivity> getLoginActivitiesInRange(User user, LocalDateTime startDate, LocalDateTime endDate) {
        try {
            return loginActivityRepository.findByUserAndAttemptTimeBetweenOrderByAttemptTimeDesc(user, startDate, endDate);
        } catch (Exception e) {
            logger.error("Error getting login activities in range for user {}: {}", user.getUsername(), e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Clear old login activities (for maintenance)
     */
    @Transactional
    public void clearOldLoginActivities(int daysToKeep) {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysToKeep);
            List<LoginActivity> oldActivities = loginActivityRepository.findAll()
                    .stream()
                    .filter(activity -> activity.getAttemptTime().isBefore(cutoffDate))
                    .toList();
            
            if (!oldActivities.isEmpty()) {
                loginActivityRepository.deleteAll(oldActivities);
                logger.info("Cleared {} old login activities older than {} days", oldActivities.size(), daysToKeep);
            }
        } catch (Exception e) {
            logger.error("Error clearing old login activities: {}", e.getMessage(), e);
        }
    }
}
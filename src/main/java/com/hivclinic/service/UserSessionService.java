package com.hivclinic.service;

import com.hivclinic.model.User;
import com.hivclinic.model.UserSession;
import com.hivclinic.repository.UserSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing user sessions and timeout functionality
 */
@Service
public class UserSessionService {
    
    private static final Logger logger = LoggerFactory.getLogger(UserSessionService.class);
    
    // Default session timeout in minutes
    private static final int DEFAULT_SESSION_TIMEOUT_MINUTES = 15;
    
    @Autowired
    private UserSessionRepository userSessionRepository;
    
    @Autowired
    private LoginActivityService loginActivityService;
    
    /**
     * Create a new session for a user
     */
    @Transactional
    public UserSession createSession(User user, String jwtToken, String ipAddress, String userAgent) {
        try {
            // Invalidate any existing active sessions for this user
            invalidateUserSessions(user);
            
            // Create new session
            UserSession session = new UserSession();
            session.setUser(user);
            session.setSessionToken(jwtToken);
            session.setIpAddress(ipAddress);
            session.setUserAgent(userAgent);
            session.setSessionTimeoutMinutes(DEFAULT_SESSION_TIMEOUT_MINUTES);
            session.setIsActive(true);
            
            LocalDateTime now = LocalDateTime.now();
            session.setCreatedAt(now);
            session.setLastActivityAt(now);
            session.setExpiresAt(now.plusMinutes(DEFAULT_SESSION_TIMEOUT_MINUTES));
            
            UserSession savedSession = userSessionRepository.save(session);
            
            logger.info("Created new session for user: {} with timeout: {} minutes", 
                user.getUsername(), DEFAULT_SESSION_TIMEOUT_MINUTES);
            
            return savedSession;
            
        } catch (Exception e) {
            logger.error("Error creating session for user {}: {}", user.getUsername(), e.getMessage(), e);
            throw new RuntimeException("Failed to create session: " + e.getMessage());
        }
    }
    
    /**
     * Find active session by JWT token
     */
    public Optional<UserSession> findActiveSessionByToken(String jwtToken) {
        try {
            return userSessionRepository.findBySessionTokenAndIsActiveTrue(jwtToken);
        } catch (Exception e) {
            logger.error("Error finding session by token: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    /**
     * Update session activity and extend timeout
     */
    @Transactional
    public boolean updateSessionActivity(String jwtToken) {
        try {
            Optional<UserSession> sessionOpt = userSessionRepository.findBySessionTokenAndIsActiveTrue(jwtToken);
            
            if (sessionOpt.isEmpty()) {
                logger.warn("Session not found for token update");
                return false;
            }
            
            UserSession session = sessionOpt.get();
            
            // Check if session is expired
            if (session.isExpired()) {
                logger.info("Session expired for user: {}", session.getUser().getUsername());
                invalidateSession(session);
                return false;
            }
            
            // Update activity
            session.updateActivity();
            userSessionRepository.save(session);
            
            logger.debug("Updated session activity for user: {}", session.getUser().getUsername());
            return true;
            
        } catch (Exception e) {
            logger.error("Error updating session activity: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Check if session is valid and not expired
     */
    public boolean isSessionValid(String jwtToken) {
        try {
            Optional<UserSession> sessionOpt = userSessionRepository.findBySessionTokenAndIsActiveTrue(jwtToken);
            
            if (sessionOpt.isEmpty()) {
                return false;
            }
            
            UserSession session = sessionOpt.get();
            
            if (session.isExpired()) {
                logger.info("Session expired for user: {}", session.getUser().getUsername());
                invalidateSession(session);
                return false;
            }
            
            return true;
            
        } catch (Exception e) {
            logger.error("Error checking session validity: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get session status information
     */
    public SessionStatusInfo getSessionStatus(String jwtToken) {
        try {
            Optional<UserSession> sessionOpt = userSessionRepository.findBySessionTokenAndIsActiveTrue(jwtToken);
            
            if (sessionOpt.isEmpty()) {
                return new SessionStatusInfo(false, 0, null, "Session not found");
            }
            
            UserSession session = sessionOpt.get();
            
            if (session.isExpired()) {
                invalidateSession(session);
                return new SessionStatusInfo(false, 0, session.getExpiresAt(), "Session expired");
            }
            
            return new SessionStatusInfo(
                true, 
                session.getRemainingMinutes(), 
                session.getExpiresAt(),
                "Session active"
            );
            
        } catch (Exception e) {
            logger.error("Error getting session status: {}", e.getMessage(), e);
            return new SessionStatusInfo(false, 0, null, "Error retrieving session status");
        }
    }
    
    /**
     * Extend session timeout
     */
    @Transactional
    public boolean extendSession(String jwtToken) {
        try {
            Optional<UserSession> sessionOpt = userSessionRepository.findBySessionTokenAndIsActiveTrue(jwtToken);
            
            if (sessionOpt.isEmpty()) {
                logger.warn("Session not found for extension");
                return false;
            }
            
            UserSession session = sessionOpt.get();
            
            if (session.isExpired()) {
                logger.info("Cannot extend expired session for user: {}", session.getUser().getUsername());
                invalidateSession(session);
                return false;
            }
            
            // Extend session
            session.updateActivity();
            userSessionRepository.save(session);
            
            logger.info("Extended session for user: {}, new expiry: {}", 
                session.getUser().getUsername(), session.getExpiresAt());
            
            return true;
            
        } catch (Exception e) {
            logger.error("Error extending session: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Invalidate a specific session
     */
    @Transactional
    public void invalidateSession(UserSession session) {
        try {
            session.setIsActive(false);
            userSessionRepository.save(session);
            
            // Log session timeout in LoginActivity
            loginActivityService.logLoginAttempt(
                session.getUser().getUsername(), 
                false, 
                session.getIpAddress(), 
                "SESSION_TIMEOUT"
            );
            
            logger.info("Invalidated session for user: {}", session.getUser().getUsername());
            
        } catch (Exception e) {
            logger.error("Error invalidating session: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Invalidate session by token
     */
    @Transactional
    public boolean invalidateSessionByToken(String jwtToken) {
        try {
            Optional<UserSession> sessionOpt = userSessionRepository.findBySessionTokenAndIsActiveTrue(jwtToken);
            
            if (sessionOpt.isEmpty()) {
                logger.warn("Session not found for invalidation");
                return false;
            }
            
            invalidateSession(sessionOpt.get());
            return true;
            
        } catch (Exception e) {
            logger.error("Error invalidating session by token: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Invalidate all sessions for a user
     */
    @Transactional
    public void invalidateUserSessions(User user) {
        try {
            List<UserSession> activeSessions = userSessionRepository.findByUserAndIsActiveTrueOrderByLastActivityAtDesc(user);
            
            for (UserSession session : activeSessions) {
                session.setIsActive(false);
                userSessionRepository.save(session);
            }
            
            if (!activeSessions.isEmpty()) {
                logger.info("Invalidated {} active sessions for user: {}", activeSessions.size(), user.getUsername());
            }
            
        } catch (Exception e) {
            logger.error("Error invalidating user sessions for {}: {}", user.getUsername(), e.getMessage(), e);
        }
    }
    
    /**
     * Get all active sessions for a user
     */
    public List<UserSession> getUserActiveSessions(User user) {
        try {
            return userSessionRepository.findByUserAndIsActiveTrueOrderByLastActivityAtDesc(user);
        } catch (Exception e) {
            logger.error("Error getting active sessions for user {}: {}", user.getUsername(), e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Cleanup expired sessions - runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void cleanupExpiredSessions() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<UserSession> expiredSessions = userSessionRepository.findExpiredSessions(now);
            
            for (UserSession session : expiredSessions) {
                invalidateSession(session);
            }
            
            if (!expiredSessions.isEmpty()) {
                logger.info("Cleaned up {} expired sessions", expiredSessions.size());
            }
            
        } catch (Exception e) {
            logger.error("Error during session cleanup: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Cleanup old inactive sessions - runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldSessions() {
        try {
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(7); // Keep inactive sessions for 7 days
            List<UserSession> oldSessions = userSessionRepository.findInactiveSessionsOlderThan(cutoffDate);
            
            if (!oldSessions.isEmpty()) {
                userSessionRepository.deleteAll(oldSessions);
                logger.info("Deleted {} old inactive sessions", oldSessions.size());
            }
            
        } catch (Exception e) {
            logger.error("Error during old session cleanup: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Session status information class
     */
    public static class SessionStatusInfo {
        private final boolean isActive;
        private final long remainingMinutes;
        private final LocalDateTime expiresAt;
        private final String message;
        
        public SessionStatusInfo(boolean isActive, long remainingMinutes, LocalDateTime expiresAt, String message) {
            this.isActive = isActive;
            this.remainingMinutes = remainingMinutes;
            this.expiresAt = expiresAt;
            this.message = message;
        }
        
        public boolean isActive() { return isActive; }
        public long getRemainingMinutes() { return remainingMinutes; }
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public String getMessage() { return message; }
    }
}
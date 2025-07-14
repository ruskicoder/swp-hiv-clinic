package com.hivclinic.repository;

import com.hivclinic.model.User;
import com.hivclinic.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for UserSession entity
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    
    /**
     * Find active session by session token
     */
    Optional<UserSession> findBySessionTokenAndIsActiveTrue(String sessionToken);
    
    /**
     * Find all active sessions for a user
     */
    List<UserSession> findByUserAndIsActiveTrueOrderByLastActivityAtDesc(User user);
    
    /**
     * Find active session by user and session token
     */
    Optional<UserSession> findByUserAndSessionTokenAndIsActiveTrue(User user, String sessionToken);
    
    /**
     * Find expired sessions
     */
    @Query("SELECT s FROM UserSession s WHERE s.expiresAt < :now AND s.isActive = true")
    List<UserSession> findExpiredSessions(@Param("now") LocalDateTime now);
    
    /**
     * Count active sessions for a user
     */
    long countByUserAndIsActiveTrue(User user);
    
    /**
     * Find sessions by user ordered by last activity
     */
    List<UserSession> findByUserOrderByLastActivityAtDesc(User user);
    
    /**
     * Find sessions that need cleanup (inactive and old)
     */
    @Query("SELECT s FROM UserSession s WHERE s.isActive = false AND s.lastActivityAt < :cutoffDate")
    List<UserSession> findInactiveSessionsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Find sessions by IP address in time range
     */
    @Query("SELECT s FROM UserSession s WHERE s.ipAddress = :ipAddress AND s.createdAt >= :startTime")
    List<UserSession> findByIpAddressAndCreatedAtAfter(@Param("ipAddress") String ipAddress, 
                                                      @Param("startTime") LocalDateTime startTime);
}
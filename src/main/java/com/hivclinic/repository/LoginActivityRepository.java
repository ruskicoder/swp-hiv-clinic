package com.hivclinic.repository;

import com.hivclinic.model.LoginActivity;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LoginActivityRepository extends JpaRepository<LoginActivity, Long> {
    
    /**
     * Find all login activities for a user, ordered by most recent first
     */
    List<LoginActivity> findByUserOrderByAttemptTimeDesc(User user);
    
    /**
     * Find login activities by username attempt, ordered by most recent first
     */
    List<LoginActivity> findByUsernameAttemptedOrderByAttemptTimeDesc(String username);
    
    /**
     * Find the most recent successful login for a user
     */
    Optional<LoginActivity> findFirstByUserAndIsSuccessTrueOrderByAttemptTimeDesc(User user);
    
    /**
     * Count failed login attempts for a user since a specific time
     */
    long countByUserAndIsSuccessFalseAndAttemptTimeAfter(User user, LocalDateTime since);
    
    /**
     * Count failed login attempts for a username since a specific time
     */
    long countByUsernameAttemptedAndIsSuccessFalseAndAttemptTimeAfter(String username, LocalDateTime since);
    
    /**
     * Find recent login activities for a user with limit
     */
    @Query("SELECT la FROM LoginActivity la WHERE la.user = :user ORDER BY la.attemptTime DESC")
    List<LoginActivity> findRecentLoginActivities(@Param("user") User user, org.springframework.data.domain.Pageable pageable);
    
    /**
     * Find all successful logins for a user
     */
    List<LoginActivity> findByUserAndIsSuccessTrueOrderByAttemptTimeDesc(User user);
    
    /**
     * Find all failed logins for a user
     */
    List<LoginActivity> findByUserAndIsSuccessFalseOrderByAttemptTimeDesc(User user);
    
    /**
     * Find login activities within a date range for a user
     */
    List<LoginActivity> findByUserAndAttemptTimeBetweenOrderByAttemptTimeDesc(
            User user, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * Check if there are recent failed attempts from the same IP
     */
    long countByIpAddressAndIsSuccessFalseAndAttemptTimeAfter(String ipAddress, LocalDateTime since);
}
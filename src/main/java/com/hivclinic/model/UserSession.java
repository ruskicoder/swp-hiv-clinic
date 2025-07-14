package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Entity representing active user sessions with timeout management
 */
@Entity
@Table(name = "UserSessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SessionID")
    private Long sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false)
    private User user;

    @Column(name = "SessionToken", nullable = false, unique = true, length = 500)
    private String sessionToken;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "LastActivityAt", nullable = false)
    private LocalDateTime lastActivityAt;

    @Column(name = "ExpiresAt", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;

    @Column(name = "IPAddress", length = 45)
    private String ipAddress;

    @Column(name = "UserAgent", columnDefinition = "NVARCHAR(MAX)")
    private String userAgent;

    @Column(name = "SessionTimeoutMinutes", nullable = false)
    private Integer sessionTimeoutMinutes = 15;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (lastActivityAt == null) {
            lastActivityAt = now;
        }
        if (expiresAt == null) {
            expiresAt = now.plusMinutes(sessionTimeoutMinutes);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // Update expiration time based on last activity
        if (lastActivityAt != null) {
            expiresAt = lastActivityAt.plusMinutes(sessionTimeoutMinutes);
        }
    }

    /**
     * Check if session is expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Get remaining time in minutes
     */
    public long getRemainingMinutes() {
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(expiresAt)) {
            return 0;
        }
        return java.time.Duration.between(now, expiresAt).toMinutes();
    }

    /**
     * Update last activity time and extend session
     */
    public void updateActivity() {
        this.lastActivityAt = LocalDateTime.now();
        this.expiresAt = this.lastActivityAt.plusMinutes(sessionTimeoutMinutes);
    }
}
package com.hivclinic.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing active user sessions with timeout management
 */
@Entity
@Table(name = "UserSessions")
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

    // Constructors
    public UserSession() {}

    public UserSession(Long sessionId, User user, String sessionToken, LocalDateTime createdAt, 
                      LocalDateTime lastActivityAt, LocalDateTime expiresAt, Boolean isActive, 
                      String ipAddress, String userAgent, Integer sessionTimeoutMinutes) {
        this.sessionId = sessionId;
        this.user = user;
        this.sessionToken = sessionToken;
        this.createdAt = createdAt;
        this.lastActivityAt = lastActivityAt;
        this.expiresAt = expiresAt;
        this.isActive = isActive;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }

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

    // Getters and Setters
    public Long getSessionId() {
        return sessionId;
    }

    public void setSessionId(Long sessionId) {
        this.sessionId = sessionId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getSessionToken() {
        return sessionToken;
    }

    public void setSessionToken(String sessionToken) {
        this.sessionToken = sessionToken;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getLastActivityAt() {
        return lastActivityAt;
    }

    public void setLastActivityAt(LocalDateTime lastActivityAt) {
        this.lastActivityAt = lastActivityAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public Integer getSessionTimeoutMinutes() {
        return sessionTimeoutMinutes;
    }

    public void setSessionTimeoutMinutes(Integer sessionTimeoutMinutes) {
        this.sessionTimeoutMinutes = sessionTimeoutMinutes;
    }
}
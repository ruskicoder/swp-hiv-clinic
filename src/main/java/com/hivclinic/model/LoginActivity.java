package com.hivclinic.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "LoginActivity")
public class LoginActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "LogID")
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID")
    private User user;

    @Column(name = "UsernameAttempted", nullable = false, length = 255)
    private String usernameAttempted;

    @Column(name = "AttemptTime", columnDefinition = "DATETIME2 DEFAULT GETDATE()", updatable = false)
    private LocalDateTime attemptTime;

    @Column(name = "IsSuccess", nullable = false)
    private Boolean isSuccess;

    @Column(name = "IPAddress", length = 45)
    private String ipAddress;

    @Column(name = "UserAgent", columnDefinition = "NVARCHAR(MAX)")
    private String userAgent;

    // Constructors
    public LoginActivity() {}

    public LoginActivity(Long logId, User user, String usernameAttempted, LocalDateTime attemptTime, 
                        Boolean isSuccess, String ipAddress, String userAgent) {
        this.logId = logId;
        this.user = user;
        this.usernameAttempted = usernameAttempted;
        this.attemptTime = attemptTime;
        this.isSuccess = isSuccess;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
    }

    @PrePersist
    protected void onCreate() {
        attemptTime = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getLogId() {
        return logId;
    }

    public void setLogId(Long logId) {
        this.logId = logId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUsernameAttempted() {
        return usernameAttempted;
    }

    public void setUsernameAttempted(String usernameAttempted) {
        this.usernameAttempted = usernameAttempted;
    }

    public LocalDateTime getAttemptTime() {
        return attemptTime;
    }

    public void setAttemptTime(LocalDateTime attemptTime) {
        this.attemptTime = attemptTime;
    }

    public Boolean getIsSuccess() {
        return isSuccess;
    }

    public void setIsSuccess(Boolean isSuccess) {
        this.isSuccess = isSuccess;
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
}
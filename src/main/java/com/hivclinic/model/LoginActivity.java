package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "LoginActivity")
@Data
@NoArgsConstructor
@AllArgsConstructor
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

    @PrePersist
    protected void onCreate() {
        attemptTime = LocalDateTime.now();
    }
}
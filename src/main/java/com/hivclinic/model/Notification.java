package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "Notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer notificationId;
    
    @Column(name = "UserID", nullable = false)
    private Integer userId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 50)
    private NotificationType type;
    
    @Column(name = "Title", nullable = false)
    private String title;
    
    @Column(name = "Message", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;
    
    @Column(name = "IsRead", nullable = false, columnDefinition = "BIT DEFAULT 0")
    private Boolean isRead = false;
    
    @Column(name = "status", length = 20)
    private String status = "PENDING";
    
    @Column(name = "Priority", length = 20)
    private String priority = "MEDIUM";
    
    @Column(name = "RelatedEntityID")
    private Integer relatedEntityId;
    
    @Column(name = "RelatedEntityType", length = 50)
    private String relatedEntityType;
    
    @Column(name = "ScheduledFor")
    private LocalDateTime scheduledFor;
    
    @Column(name = "SentAt")
    private LocalDateTime sentAt;
    
    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;
    
    @Column(name = "UpdatedAt")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Nested enum for notification types
    public enum NotificationType {
        APPOINTMENT_REMINDER("APPOINTMENT_REMINDER"),
        MEDICATION_REMINDER("MEDICATION_REMINDER"),
        GENERAL("GENERAL"),
        SYSTEM_NOTIFICATION("SYSTEM_NOTIFICATION");
        
        private final String value;
        
        NotificationType(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    // Nested enum for priorities
    public enum Priority {
        LOW("LOW"),
        MEDIUM("MEDIUM"),
        HIGH("HIGH"),
        URGENT("URGENT");
        
        private final String value;
        
        Priority(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
}

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
    // Lombok @Data does not generate setters for final fields or enums with custom constructors.
    // Add missing setters and getters for test compatibility
    public void setNotificationId(Integer notificationId) { this.notificationId = notificationId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public void setTitle(String title) { this.title = title; }
    public void setMessage(String message) { this.message = message; }
    public void setType(NotificationType type) { this.type = type; }
    public void setPriority(String priority) { this.priority = priority; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
    public void setStatus(String status) { this.status = status; }

    public Integer getNotificationId() { return notificationId; }
    public Integer getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public NotificationType getType() { return type; }
    public String getPriority() { return priority; }
    public Boolean getIsRead() { return isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getSentAt() { return sentAt; }
    public String getStatus() { return status; }
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

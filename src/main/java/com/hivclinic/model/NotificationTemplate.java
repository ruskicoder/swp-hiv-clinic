package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "NotificationTemplates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTemplate {
    // ...existing code...
    // Lombok @Data does not generate setters for final fields or enums with custom constructors.
    // Add missing setters and getters for test compatibility
    public void setName(String name) { this.name = name; }
    public void setType(NotificationType type) { this.type = type; }
    public void setSubject(String subject) { this.subject = subject; }
    public void setBody(String body) { this.body = body; }
    public void setPriority(Priority priority) { this.priority = priority; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Long getTemplateId() { return templateId; }
    public String getName() { return name; }
    public NotificationType getType() { return type; }
    public String getSubject() { return subject; }
    public String getBody() { return body; }
    public Priority getPriority() { return priority; }
    public Boolean getIsActive() { return isActive; }
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long templateId;
    
    @Column(name = "Name", nullable = false, length = 100)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "Type", nullable = false, length = 50)
    private NotificationType type;
    
    @Column(name = "Subject", nullable = false, length = 200)
    private String subject;
    
    @Column(name = "Body", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String body;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "Priority", nullable = false, length = 20)
    private Priority priority = Priority.MEDIUM;
    
    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;
    
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
    
    // Enum for notification types
    public enum NotificationType {
        APPOINTMENT_REMINDER("APPOINTMENT_REMINDER"),
        MEDICATION_REMINDER("MEDICATION_REMINDER"),
        GENERAL("GENERAL"),
        SYSTEM("SYSTEM");
        
        private final String value;
        
        NotificationType(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
    
    // Enum for priorities
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
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
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer templateId;
    
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
        GENERAL_ALERT("GENERAL_ALERT"),
        SYSTEM_NOTIFICATION("SYSTEM_NOTIFICATION");
        
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
        HIGH("HIGH");
        
        private final String value;
        
        Priority(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
}
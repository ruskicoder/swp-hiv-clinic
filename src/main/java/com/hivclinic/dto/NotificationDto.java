package com.hivclinic.dto;

import com.hivclinic.model.Notification;


import java.time.LocalDateTime;

public class NotificationDto {
    private Integer notificationId;
    private Integer userId;
    private Notification.NotificationType type;
    private String title;
    private String message;
    private boolean isRead;
    private String status;
    private Integer relatedEntityId;
    private String relatedEntityType;
    private LocalDateTime createdAt;

    public NotificationDto() {}

    public NotificationDto(Integer notificationId, Integer userId, Notification.NotificationType type, String title, String message, boolean isRead, String status, Integer relatedEntityId, String relatedEntityType, LocalDateTime createdAt) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.isRead = isRead;
        this.status = status;
        this.relatedEntityId = relatedEntityId;
        this.relatedEntityType = relatedEntityType;
        this.createdAt = createdAt;
    }

    public Integer getNotificationId() { return notificationId; }
    public void setNotificationId(Integer notificationId) { this.notificationId = notificationId; }
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public Notification.NotificationType getType() { return type; }
    public void setType(Notification.NotificationType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean isRead) { this.isRead = isRead; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Integer relatedEntityId) { this.relatedEntityId = relatedEntityId; }
    public String getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static NotificationDto fromEntity(Notification notification) {
        return new NotificationDto(
                notification.getNotificationId(),
                notification.getUserId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                Boolean.TRUE.equals(notification.getIsRead()), // Safe null handling
                notification.getStatus() != null ? notification.getStatus() : "PENDING", // Safe null handling
                notification.getRelatedEntityId(),
                notification.getRelatedEntityType(),
                notification.getCreatedAt()
        );
    }
}

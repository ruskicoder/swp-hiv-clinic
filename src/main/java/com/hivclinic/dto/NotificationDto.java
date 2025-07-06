package com.hivclinic.dto;

import com.hivclinic.model.Notification;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
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

    public static NotificationDto fromEntity(Notification notification) {
        return new NotificationDto(
                notification.getNotificationId(),
                notification.getUserId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getIsRead() != null ? notification.getIsRead() : false, // Safe null handling
                notification.getStatus() != null ? notification.getStatus() : "PENDING", // Safe null handling
                notification.getRelatedEntityId(),
                notification.getRelatedEntityType(),
                notification.getCreatedAt()
        );
    }
}

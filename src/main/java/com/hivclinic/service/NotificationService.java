package com.hivclinic.service;

import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.Notification;
import com.hivclinic.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<NotificationDto> getNotificationsByUserId(Integer userId) {
        // Add logging to diagnose cancelled notification visibility issue
        List<Notification> allNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        System.out.println("DEBUG: Found " + allNotifications.size() + " total notifications for user " + userId);
        
        // Use new repository method to efficiently filter out cancelled notifications
        List<Notification> visibleNotifications = notificationRepository.findByUserIdExcludingCancelledOrderByCreatedAtDesc(userId);
        
        // Log cancelled notifications that were filtered out
        int cancelledCount = allNotifications.size() - visibleNotifications.size();
        System.out.println("DEBUG: Filtered out " + cancelledCount + " cancelled notifications for patient visibility");
        
        if (cancelledCount > 0) {
            System.out.println("DEBUG: Successfully hidden " + cancelledCount + " cancelled notifications from patient");
            allNotifications.stream()
                    .filter(n -> "CANCELLED".equals(n.getStatus()))
                    .forEach(n -> System.out.println("DEBUG: Hidden cancelled notification ID " + n.getNotificationId() +
                                                   " with title: " + n.getTitle() +
                                                   " and status: " + n.getStatus()));
        }
        
        System.out.println("DEBUG: Returning " + visibleNotifications.size() + " visible notifications (filtered out " +
                          cancelledCount + " cancelled notifications)");
        
        return visibleNotifications.stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<NotificationDto> getUnreadNotificationsByUserId(Integer userId) {
        // Add logging to diagnose cancelled notification visibility issue
        List<Notification> allUnreadNotifications = notificationRepository.findByUserIdAndIsRead(userId, false);
        System.out.println("DEBUG: Found " + allUnreadNotifications.size() + " total unread notifications for user " + userId);
        
        // Use new repository method to efficiently filter out cancelled notifications
        List<Notification> visibleUnreadNotifications = notificationRepository.findByUserIdAndIsReadExcludingCancelled(userId, false);
        
        // Log cancelled notifications that were filtered out
        int cancelledUnreadCount = allUnreadNotifications.size() - visibleUnreadNotifications.size();
        System.out.println("DEBUG: Filtered out " + cancelledUnreadCount + " cancelled unread notifications for patient visibility");
        
        if (cancelledUnreadCount > 0) {
            System.out.println("DEBUG: Successfully hidden " + cancelledUnreadCount + " cancelled unread notifications from patient");
            allUnreadNotifications.stream()
                    .filter(n -> "CANCELLED".equals(n.getStatus()))
                    .forEach(n -> System.out.println("DEBUG: Hidden cancelled unread notification ID " + n.getNotificationId() +
                                                   " with title: " + n.getTitle() +
                                                   " and status: " + n.getStatus()));
        }
        
        System.out.println("DEBUG: Returning " + visibleUnreadNotifications.size() + " visible unread notifications (filtered out " +
                          cancelledUnreadCount + " cancelled notifications)");
        
        return visibleUnreadNotifications.stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    public long getUnreadNotificationCount(Integer userId) {
        // Use new repository method to efficiently filter out cancelled notifications
        List<Notification> visibleUnreadNotifications = notificationRepository.findByUserIdAndIsReadExcludingCancelled(userId, false);
        long visibleUnreadCount = visibleUnreadNotifications.size();
        
        // Log for debugging
        List<Notification> allUnreadNotifications = notificationRepository.findByUserIdAndIsRead(userId, false);
        int cancelledCount = allUnreadNotifications.size() - visibleUnreadNotifications.size();
        
        System.out.println("DEBUG: Unread count for user " + userId + ": " + visibleUnreadCount +
                          " (filtered out " + cancelledCount + " cancelled)");
        
        return visibleUnreadCount;
    }

    @Transactional(rollbackFor = Exception.class)
    public NotificationDto markAsRead(Integer notificationId, Integer userId) {
        System.out.println("DEBUG: NotificationService.markAsRead called with notificationId=" + notificationId + ", userId=" + userId);
        
        try {
            return notificationRepository.findById(notificationId)
                    .map(notification -> {
                        System.out.println("DEBUG: Found notification with ID=" + notification.getNotificationId() +
                                         ", userId=" + notification.getUserId() +
                                         ", isRead=" + notification.getIsRead() +
                                         ", status=" + notification.getStatus() +
                                         ", title=" + notification.getTitle());
                        
                        // Verify that the notification belongs to the authenticated user
                        if (!notification.getUserId().equals(userId)) {
                            System.out.println("DEBUG: User ID mismatch - notification belongs to userId=" + notification.getUserId() +
                                             ", but request from userId=" + userId);
                            return null; // Return null if user doesn't own the notification
                        }
                        
                        // Check if already read to avoid unnecessary database operations
                        if (notification.getIsRead() != null && notification.getIsRead() && "READ".equals(notification.getStatus())) {
                            System.out.println("DEBUG: Notification already marked as read, returning existing state");
                            return NotificationDto.fromEntity(notification);
                        }
                        
                        System.out.println("DEBUG: Setting notification as read - updating both isRead and status fields");
                        
                        // Atomically update both fields to ensure consistency
                        notification.setIsRead(true);
                        notification.setStatus("READ");
                        
                        // Force flush to ensure database commit
                        Notification savedNotification = notificationRepository.saveAndFlush(notification);
                        System.out.println("DEBUG: Saved and flushed notification with isRead=" + savedNotification.getIsRead() + 
                                         ", status=" + savedNotification.getStatus());
                        
                        // Verify the save was successful for both fields
                        if (savedNotification.getIsRead() == null || !savedNotification.getIsRead() || 
                            !"READ".equals(savedNotification.getStatus())) {
                            System.out.println("ERROR: Failed to save notification as read - database state inconsistent. " +
                                             "isRead=" + savedNotification.getIsRead() + ", status=" + savedNotification.getStatus());
                            throw new RuntimeException("Failed to update notification read status in database - field synchronization failed");
                        }
                        
                        // Double-check by re-reading from database
                        Notification verificationNotification = notificationRepository.findById(notificationId).orElse(null);
                        if (verificationNotification == null || 
                            verificationNotification.getIsRead() == null || 
                            !verificationNotification.getIsRead() || 
                            !"READ".equals(verificationNotification.getStatus())) {
                            System.out.println("ERROR: Database verification failed - notification not properly saved. " +
                                             "Re-read notification: isRead=" + (verificationNotification != null ? verificationNotification.getIsRead() : "null") + 
                                             ", status=" + (verificationNotification != null ? verificationNotification.getStatus() : "null"));
                            throw new RuntimeException("Database persistence verification failed - notification read status not properly saved");
                        }
                        
                        NotificationDto dto = NotificationDto.fromEntity(savedNotification);
                        System.out.println("DEBUG: Successfully created DTO with isRead=" + dto.isRead() + ", status=" + dto.getStatus());
                        
                        return dto;
                    }).orElse(null);
        } catch (Exception e) {
            System.out.println("ERROR: Exception in markAsRead: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to trigger transaction rollback
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void markAllAsRead(Integer userId) {
        System.out.println("DEBUG: NotificationService.markAllAsRead called for userId=" + userId);
        
        try {
            // Get all unread notifications for verification
            List<Notification> unreadNotifications = notificationRepository.findByUserIdAndIsRead(userId, false);
            System.out.println("DEBUG: Found " + unreadNotifications.size() + " unread notifications to mark as read");
            
            if (unreadNotifications.isEmpty()) {
                System.out.println("DEBUG: No unread notifications found, nothing to update");
                return;
            }
            
            // Use the repository method to mark all as read
            int updatedCount = notificationRepository.markAllAsReadByUserId(userId);
            System.out.println("DEBUG: Repository method updated " + updatedCount + " notifications for userId=" + userId);
            
            // Verify the update was successful by checking multiple notifications
            int verificationCount = 0;
            for (Notification originalNotification : unreadNotifications) {
                Notification verifiedNotification = notificationRepository.findById(originalNotification.getNotificationId())
                        .orElse(null);
                if (verifiedNotification != null) {
                    System.out.println("DEBUG: Verification - notification ID=" + verifiedNotification.getNotificationId() +
                                     ", isRead=" + verifiedNotification.getIsRead() + 
                                     ", status=" + verifiedNotification.getStatus());
                    
                    if (verifiedNotification.getIsRead() == null || !verifiedNotification.getIsRead() || 
                        !"READ".equals(verifiedNotification.getStatus())) {
                        System.out.println("ERROR: markAllAsRead failed - notification ID=" + verifiedNotification.getNotificationId() +
                                         " still not marked as read. isRead=" + verifiedNotification.getIsRead() + 
                                         ", status=" + verifiedNotification.getStatus());
                        throw new RuntimeException("Failed to mark all notifications as read in database - field synchronization failed");
                    }
                    verificationCount++;
                }
                
                // Verify first few notifications to avoid excessive database queries
                if (verificationCount >= Math.min(3, unreadNotifications.size())) {
                    break;
                }
            }
            
            System.out.println("DEBUG: Successfully marked all notifications as read for userId=" + userId + 
                             ". Verified " + verificationCount + " notifications.");
        } catch (Exception e) {
            System.out.println("ERROR: Exception in markAllAsRead: " + e.getMessage());
            e.printStackTrace();
            throw e; // Re-throw to trigger transaction rollback
        }
    }

    @Transactional
    public NotificationDto createAppointmentReminder(Integer userId, Integer appointmentId, LocalDateTime appointmentDateTime, String patientName) {
        String title = "Appointment Reminder";
        String message = String.format("Your appointment with %s is scheduled for %s.", patientName, appointmentDateTime.toString());
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(Notification.NotificationType.APPOINTMENT_REMINDER);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedEntityId(appointmentId);
        notification.setRelatedEntityType("APPOINTMENT");
        notification.setStatus("SENT"); // Set initial status as SENT for created notifications
        return NotificationDto.fromEntity(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationDto createMedicationReminder(Integer userId, Integer routineId, String medicationName, String dosage) {
        String title = "Medication Reminder";
        String message = String.format("It's time to take your medication: %s (%s).", medicationName, dosage);
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(Notification.NotificationType.MEDICATION_REMINDER);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRelatedEntityId(routineId);
        notification.setRelatedEntityType("MEDICATION_ROUTINE");
        notification.setStatus("SENT"); // Set initial status as SENT for created notifications
        return NotificationDto.fromEntity(notificationRepository.save(notification));
    }

    @Transactional
    public NotificationDto createSystemNotification(Integer userId, String title, String message, String priority) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setPriority(priority);
        notification.setRelatedEntityType("SYSTEM");
        notification.setStatus("SENT"); // Set initial status as SENT for created notifications
        return NotificationDto.fromEntity(notificationRepository.save(notification));
    }
}

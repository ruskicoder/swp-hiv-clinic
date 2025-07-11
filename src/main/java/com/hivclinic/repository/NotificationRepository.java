package com.hivclinic.repository;

import com.hivclinic.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Integer userId);

    List<Notification> findByUserIdAndIsRead(Integer userId, Boolean isRead);
    
    /**
     * Find notifications by user ID excluding cancelled ones (for patient visibility)
     */
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.status != 'CANCELLED' ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdExcludingCancelledOrderByCreatedAtDesc(@Param("userId") Integer userId);
    
    /**
     * Find unread notifications by user ID excluding cancelled ones (for patient visibility)
     */
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.isRead = :isRead AND n.status != 'CANCELLED'")
    List<Notification> findByUserIdAndIsReadExcludingCancelled(@Param("userId") Integer userId, @Param("isRead") Boolean isRead);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Notification n SET n.isRead = true, n.status = 'READ' WHERE n.userId = :userId AND n.isRead = false")
    int markAllAsReadByUserId(@Param("userId") Integer userId);
    
    /**
     * Find scheduled notifications that are due for processing
     */
    @Query("SELECT n FROM Notification n WHERE n.scheduledFor IS NOT NULL AND n.sentAt IS NULL AND n.scheduledFor <= :processingTime")
    List<Notification> findScheduledNotificationsDue(@Param("processingTime") LocalDateTime processingTime);
    
    /**
     * Find notifications by user ID and related entity
     */
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.relatedEntityType = :entityType AND n.relatedEntityId = :entityId ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndRelatedEntity(@Param("userId") Integer userId,
                                                   @Param("entityType") String entityType,
                                                   @Param("entityId") Integer entityId);
    
    /**
     * Find old notifications for cleanup
     */
    @Query("SELECT n FROM Notification n WHERE n.sentAt IS NOT NULL AND n.sentAt < :cutoffDate")
    List<Notification> findOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
}

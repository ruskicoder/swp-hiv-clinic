package com.hivclinic.service;

import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.Notification;
import com.hivclinic.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationPersistenceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Notification testNotification;
    private final Integer USER_ID = 1;
    private final Integer NOTIFICATION_ID = 1;

    @BeforeEach
    void setUp() {
        testNotification = new Notification();
        testNotification.setNotificationId(NOTIFICATION_ID);
        testNotification.setUserId(USER_ID);
        testNotification.setTitle("Test Notification");
        testNotification.setMessage("Test message");
        testNotification.setIsRead(false);
        testNotification.setStatus("SENT");
        testNotification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        testNotification.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void testMarkAsRead_ShouldSynchronizeBothFields() {
        // Arrange
        when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.of(testNotification));
        
        // Create the expected saved notification with both fields synchronized
        Notification savedNotification = new Notification();
        savedNotification.setNotificationId(NOTIFICATION_ID);
        savedNotification.setUserId(USER_ID);
        savedNotification.setTitle("Test Notification");
        savedNotification.setMessage("Test message");
        savedNotification.setIsRead(true);  // Both fields should be synchronized
        savedNotification.setStatus("READ");
        savedNotification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        savedNotification.setCreatedAt(LocalDateTime.now());
        
        when(notificationRepository.saveAndFlush(any(Notification.class))).thenReturn(savedNotification);
        
        // Mock the verification read
        when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.of(savedNotification));

        // Act
        NotificationDto result = notificationService.markAsRead(NOTIFICATION_ID, USER_ID);

        // Assert
        assertNotNull(result);
        assertTrue(result.isRead());
        assertEquals("READ", result.getStatus());
        
        // Verify that both fields were set on the notification before saving
        verify(notificationRepository).saveAndFlush(argThat(notification -> 
            notification.getIsRead() != null && 
            notification.getIsRead().equals(true) && 
            "READ".equals(notification.getStatus())
        ));
        
        // Verify that verification read was performed
        verify(notificationRepository, times(2)).findById(NOTIFICATION_ID);
    }

    @Test
    void testMarkAsRead_ShouldFailIfFieldsNotSynchronized() {
        // Arrange
        when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.of(testNotification));
        
        // Create a saved notification with inconsistent fields (simulation of database sync failure)
        Notification savedNotification = new Notification();
        savedNotification.setNotificationId(NOTIFICATION_ID);
        savedNotification.setUserId(USER_ID);
        savedNotification.setTitle("Test Notification");
        savedNotification.setMessage("Test message");
        savedNotification.setIsRead(true);
        savedNotification.setStatus("SENT"); // Inconsistent status field
        savedNotification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        savedNotification.setCreatedAt(LocalDateTime.now());
        
        when(notificationRepository.saveAndFlush(any(Notification.class))).thenReturn(savedNotification);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            notificationService.markAsRead(NOTIFICATION_ID, USER_ID);
        });

        assertTrue(exception.getMessage().contains("field synchronization failed"));
    }

    @Test
    void testMarkAsRead_ShouldFailIfDatabaseVerificationFails() {
        // Arrange
        when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.of(testNotification));
        
        // Create properly synchronized saved notification
        Notification savedNotification = new Notification();
        savedNotification.setNotificationId(NOTIFICATION_ID);
        savedNotification.setUserId(USER_ID);
        savedNotification.setTitle("Test Notification");
        savedNotification.setMessage("Test message");
        savedNotification.setIsRead(true);
        savedNotification.setStatus("READ");
        savedNotification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        savedNotification.setCreatedAt(LocalDateTime.now());
        
        when(notificationRepository.saveAndFlush(any(Notification.class))).thenReturn(savedNotification);
        
        // Mock verification read to return inconsistent data (simulating database persistence failure)
        Notification verificationNotification = new Notification();
        verificationNotification.setNotificationId(NOTIFICATION_ID);
        verificationNotification.setUserId(USER_ID);
        verificationNotification.setTitle("Test Notification");
        verificationNotification.setMessage("Test message");
        verificationNotification.setIsRead(false); // Verification shows it wasn't persisted
        verificationNotification.setStatus("SENT");
        verificationNotification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        verificationNotification.setCreatedAt(LocalDateTime.now());
        
        when(notificationRepository.findById(NOTIFICATION_ID))
            .thenReturn(Optional.of(testNotification))
            .thenReturn(Optional.of(verificationNotification));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            notificationService.markAsRead(NOTIFICATION_ID, USER_ID);
        });

        assertTrue(exception.getMessage().contains("Database persistence verification failed"));
    }

    @Test
    void testMarkAsRead_ShouldReturnExistingStateIfAlreadyRead() {
        // Arrange
        testNotification.setIsRead(true);
        testNotification.setStatus("READ");
        
        when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.of(testNotification));

        // Act
        NotificationDto result = notificationService.markAsRead(NOTIFICATION_ID, USER_ID);

        // Assert
        assertNotNull(result);
        assertTrue(result.isRead());
        assertEquals("READ", result.getStatus());
        
        // Verify that saveAndFlush was not called since notification was already read
        verify(notificationRepository, never()).saveAndFlush(any(Notification.class));
    }

    @Test
    void testMarkAllAsRead_ShouldSynchronizeAllFields() {
        // Arrange
        Notification notification1 = new Notification();
        notification1.setNotificationId(1);
        notification1.setUserId(USER_ID);
        notification1.setIsRead(false);
        notification1.setStatus("SENT");
        notification1.setTitle("Notification 1");
        notification1.setMessage("Message 1");
        notification1.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        notification1.setCreatedAt(LocalDateTime.now());

        Notification notification2 = new Notification();
        notification2.setNotificationId(2);
        notification2.setUserId(USER_ID);
        notification2.setIsRead(false);
        notification2.setStatus("SENT");
        notification2.setTitle("Notification 2");
        notification2.setMessage("Message 2");
        notification2.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        notification2.setCreatedAt(LocalDateTime.now());

        List<Notification> unreadNotifications = Arrays.asList(notification1, notification2);
        
        when(notificationRepository.findByUserIdAndIsRead(USER_ID, false)).thenReturn(unreadNotifications);
        when(notificationRepository.markAllAsReadByUserId(USER_ID)).thenReturn(2);
        
        // Mock verification reads to return properly synchronized notifications
        Notification verifiedNotification1 = new Notification();
        verifiedNotification1.setNotificationId(1);
        verifiedNotification1.setUserId(USER_ID);
        verifiedNotification1.setIsRead(true);
        verifiedNotification1.setStatus("READ");
        verifiedNotification1.setTitle("Notification 1");
        verifiedNotification1.setMessage("Message 1");
        verifiedNotification1.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        verifiedNotification1.setCreatedAt(LocalDateTime.now());

        when(notificationRepository.findById(1)).thenReturn(Optional.of(verifiedNotification1));

        // Act
        assertDoesNotThrow(() -> notificationService.markAllAsRead(USER_ID));

        // Assert
        verify(notificationRepository).markAllAsReadByUserId(USER_ID);
        verify(notificationRepository).findById(1); // Verification was performed
    }

    @Test
    void testMarkAllAsRead_ShouldFailIfVerificationFails() {
        // Arrange
        Notification notification1 = new Notification();
        notification1.setNotificationId(1);
        notification1.setUserId(USER_ID);
        notification1.setIsRead(false);
        notification1.setStatus("SENT");
        notification1.setTitle("Notification 1");
        notification1.setMessage("Message 1");
        notification1.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        notification1.setCreatedAt(LocalDateTime.now());

        List<Notification> unreadNotifications = Arrays.asList(notification1);
        
        when(notificationRepository.findByUserIdAndIsRead(USER_ID, false)).thenReturn(unreadNotifications);
        when(notificationRepository.markAllAsReadByUserId(USER_ID)).thenReturn(1);
        
        // Mock verification read to return notification that wasn't properly updated
        Notification verifiedNotification1 = new Notification();
        verifiedNotification1.setNotificationId(1);
        verifiedNotification1.setUserId(USER_ID);
        verifiedNotification1.setIsRead(false); // Still not marked as read
        verifiedNotification1.setStatus("SENT");
        verifiedNotification1.setTitle("Notification 1");
        verifiedNotification1.setMessage("Message 1");
        verifiedNotification1.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        verifiedNotification1.setCreatedAt(LocalDateTime.now());

        when(notificationRepository.findById(1)).thenReturn(Optional.of(verifiedNotification1));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            notificationService.markAllAsRead(USER_ID);
        });

        assertTrue(exception.getMessage().contains("field synchronization failed"));
    }

    @Test
    void testMarkAllAsRead_ShouldHandleNoUnreadNotifications() {
        // Arrange
        when(notificationRepository.findByUserIdAndIsRead(USER_ID, false)).thenReturn(Arrays.asList());

        // Act
        assertDoesNotThrow(() -> notificationService.markAllAsRead(USER_ID));

        // Assert
        verify(notificationRepository, never()).markAllAsReadByUserId(USER_ID);
    }

    @Test
    void testMarkAsRead_ShouldRejectUnauthorizedAccess() {
        // Arrange
        testNotification.setUserId(999); // Different user ID
        when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.of(testNotification));

        // Act
        NotificationDto result = notificationService.markAsRead(NOTIFICATION_ID, USER_ID);

        // Assert
        assertNull(result);
        verify(notificationRepository, never()).saveAndFlush(any(Notification.class));
    }

    @Test
    void testMarkAsRead_ShouldHandleNotificationNotFound() {
        // Arrange
        when(notificationRepository.findById(NOTIFICATION_ID)).thenReturn(Optional.empty());

        // Act
        NotificationDto result = notificationService.markAsRead(NOTIFICATION_ID, USER_ID);

        // Assert
        assertNull(result);
        verify(notificationRepository, never()).saveAndFlush(any(Notification.class));
    }
}
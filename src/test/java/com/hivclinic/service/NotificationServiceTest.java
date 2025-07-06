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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Notification notification1;
    private Notification notification2;
    private List<Notification> notifications;

    @BeforeEach
    void setUp() {
        notification1 = createNotification(1, 1, "Test Notification 1", "Test message 1", false);
        notification2 = createNotification(2, 1, "Test Notification 2", "Test message 2", true);
        notifications = Arrays.asList(notification1, notification2);
    }

    @Test
    void testGetNotificationsByUserId_Success() {
        // Given
        Integer userId = 1;
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(notifications);

        // When
        List<NotificationDto> result = notificationService.getNotificationsByUserId(userId);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Test Notification 1", result.get(0).getTitle());
        assertEquals("Test Notification 2", result.get(1).getTitle());
        assertEquals(false, result.get(0).isRead());
        assertEquals(true, result.get(1).isRead());

        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void testGetNotificationsByUserId_EmptyList() {
        // Given
        Integer userId = 1;
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(Arrays.asList());

        // When
        List<NotificationDto> result = notificationService.getNotificationsByUserId(userId);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Test
    void testGetUnreadNotificationsByUserId_Success() {
        // Given
        Integer userId = 1;
        List<Notification> unreadNotifications = Arrays.asList(notification1);
        when(notificationRepository.findByUserIdAndIsRead(userId, false)).thenReturn(unreadNotifications);

        // When
        List<NotificationDto> result = notificationService.getUnreadNotificationsByUserId(userId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Notification 1", result.get(0).getTitle());
        assertEquals(false, result.get(0).isRead());

        verify(notificationRepository).findByUserIdAndIsRead(userId, false);
    }

    @Test
    void testGetUnreadNotificationsByUserId_EmptyList() {
        // Given
        Integer userId = 1;
        when(notificationRepository.findByUserIdAndIsRead(userId, false)).thenReturn(Arrays.asList());

        // When
        List<NotificationDto> result = notificationService.getUnreadNotificationsByUserId(userId);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());

        verify(notificationRepository).findByUserIdAndIsRead(userId, false);
    }

    @Test
    void testGetUnreadNotificationCount_Success() {
        // Given
        Integer userId = 1;
        List<Notification> unreadNotifications = Arrays.asList(notification1);
        when(notificationRepository.findByUserIdAndIsRead(userId, false)).thenReturn(unreadNotifications);

        // When
        long count = notificationService.getUnreadNotificationCount(userId);

        // Then
        assertEquals(1, count);

        verify(notificationRepository).findByUserIdAndIsRead(userId, false);
    }

    @Test
    void testGetUnreadNotificationCount_Zero() {
        // Given
        Integer userId = 1;
        when(notificationRepository.findByUserIdAndIsRead(userId, false)).thenReturn(Arrays.asList());

        // When
        long count = notificationService.getUnreadNotificationCount(userId);

        // Then
        assertEquals(0, count);

        verify(notificationRepository).findByUserIdAndIsRead(userId, false);
    }

    @Test
    void testMarkAsRead_Success() {
        // Given
        Integer notificationId = 1;
        Integer userId = 1;
        notification1.setIsRead(false);
        Notification updatedNotification = createNotification(1, 1, "Test Notification 1", "Test message 1", true);

        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification1));
        when(notificationRepository.save(any(Notification.class))).thenReturn(updatedNotification);

        // When
        NotificationDto result = notificationService.markAsRead(notificationId, userId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getNotificationId());
        assertEquals("Test Notification 1", result.getTitle());
        assertTrue(result.isRead());

        verify(notificationRepository).findById(notificationId);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testMarkAsRead_NotificationNotFound() {
        // Given
        Integer notificationId = 999;
        Integer userId = 1;
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.empty());

        // When
        NotificationDto result = notificationService.markAsRead(notificationId, userId);

        // Then
        assertNull(result);

        verify(notificationRepository).findById(notificationId);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testMarkAsRead_UnauthorizedUser() {
        // Given
        Integer notificationId = 1;
        Integer userId = 2; // Different user ID
        notification1.setUserId(1); // Notification belongs to user 1
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(notification1));

        // When
        NotificationDto result = notificationService.markAsRead(notificationId, userId);

        // Then
        assertNull(result); // Should return null for unauthorized access

        verify(notificationRepository).findById(notificationId);
        verify(notificationRepository, never()).save(any(Notification.class));
    }

    @Test
    void testMarkAllAsRead_Success() {
        // Given
        Integer userId = 1;
        doNothing().when(notificationRepository).markAllAsReadByUserId(userId);

        // When
        notificationService.markAllAsRead(userId);

        // Then
        verify(notificationRepository).markAllAsReadByUserId(userId);
    }

    @Test
    void testCreateAppointmentReminder_Success() {
        // Given
        Integer userId = 1;
        Integer appointmentId = 1;
        LocalDateTime appointmentDateTime = LocalDateTime.now().plusDays(1);
        String patientName = "John Doe";

        Notification savedNotification = createNotification(1, userId, "Appointment Reminder", 
            "Your appointment with John Doe is scheduled for " + appointmentDateTime.toString() + ".", false);
        savedNotification.setType(Notification.NotificationType.APPOINTMENT_REMINDER);
        savedNotification.setRelatedEntityId(appointmentId);
        savedNotification.setRelatedEntityType("APPOINTMENT");

        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        // When
        NotificationDto result = notificationService.createAppointmentReminder(userId, appointmentId, appointmentDateTime, patientName);

        // Then
        assertNotNull(result);
        assertEquals("Appointment Reminder", result.getTitle());
        assertTrue(result.getMessage().contains("John Doe"));
        assertEquals(Notification.NotificationType.APPOINTMENT_REMINDER, result.getType());
        assertEquals(appointmentId, result.getRelatedEntityId());
        assertEquals("APPOINTMENT", result.getRelatedEntityType());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testCreateMedicationReminder_Success() {
        // Given
        Integer userId = 1;
        Integer routineId = 1;
        String medicationName = "Medication A";
        String dosage = "10mg";

        Notification savedNotification = createNotification(1, userId, "Medication Reminder", 
            "It's time to take your medication: Medication A (10mg).", false);
        savedNotification.setType(Notification.NotificationType.MEDICATION_REMINDER);
        savedNotification.setRelatedEntityId(routineId);
        savedNotification.setRelatedEntityType("MEDICATION_ROUTINE");

        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        // When
        NotificationDto result = notificationService.createMedicationReminder(userId, routineId, medicationName, dosage);

        // Then
        assertNotNull(result);
        assertEquals("Medication Reminder", result.getTitle());
        assertTrue(result.getMessage().contains("Medication A"));
        assertTrue(result.getMessage().contains("10mg"));
        assertEquals(Notification.NotificationType.MEDICATION_REMINDER, result.getType());
        assertEquals(routineId, result.getRelatedEntityId());
        assertEquals("MEDICATION_ROUTINE", result.getRelatedEntityType());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testCreateSystemNotification_Success() {
        // Given
        Integer userId = 1;
        String title = "System Maintenance";
        String message = "System will be under maintenance from 2-4 AM";
        String priority = "HIGH";

        Notification savedNotification = createNotification(1, userId, title, message, false);
        savedNotification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        savedNotification.setPriority(priority);
        savedNotification.setRelatedEntityType("SYSTEM");

        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        // When
        NotificationDto result = notificationService.createSystemNotification(userId, title, message, priority);

        // Then
        assertNotNull(result);
        assertEquals("System Maintenance", result.getTitle());
        assertEquals("System will be under maintenance from 2-4 AM", result.getMessage());
        assertEquals(Notification.NotificationType.SYSTEM_NOTIFICATION, result.getType());
        assertEquals("SYSTEM", result.getRelatedEntityType());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testCreateSystemNotification_WithNullPriority() {
        // Given
        Integer userId = 1;
        String title = "System Notification";
        String message = "Test message";
        String priority = null;

        Notification savedNotification = createNotification(1, userId, title, message, false);
        savedNotification.setType(Notification.NotificationType.SYSTEM_NOTIFICATION);
        savedNotification.setPriority(priority);
        savedNotification.setRelatedEntityType("SYSTEM");

        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        // When
        NotificationDto result = notificationService.createSystemNotification(userId, title, message, priority);

        // Then
        assertNotNull(result);
        assertEquals("System Notification", result.getTitle());
        assertEquals("Test message", result.getMessage());
        assertEquals(Notification.NotificationType.SYSTEM_NOTIFICATION, result.getType());
        assertEquals("SYSTEM", result.getRelatedEntityType());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testCreateAppointmentReminder_WithNullPatientName() {
        // Given
        Integer userId = 1;
        Integer appointmentId = 1;
        LocalDateTime appointmentDateTime = LocalDateTime.now().plusDays(1);
        String patientName = null;

        Notification savedNotification = createNotification(1, userId, "Appointment Reminder", 
            "Your appointment with null is scheduled for " + appointmentDateTime.toString() + ".", false);
        savedNotification.setType(Notification.NotificationType.APPOINTMENT_REMINDER);
        savedNotification.setRelatedEntityId(appointmentId);
        savedNotification.setRelatedEntityType("APPOINTMENT");

        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        // When
        NotificationDto result = notificationService.createAppointmentReminder(userId, appointmentId, appointmentDateTime, patientName);

        // Then
        assertNotNull(result);
        assertEquals("Appointment Reminder", result.getTitle());
        assertTrue(result.getMessage().contains("null")); // The service should handle null gracefully
        assertEquals(Notification.NotificationType.APPOINTMENT_REMINDER, result.getType());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testCreateMedicationReminder_WithNullMedicationName() {
        // Given
        Integer userId = 1;
        Integer routineId = 1;
        String medicationName = null;
        String dosage = "10mg";

        Notification savedNotification = createNotification(1, userId, "Medication Reminder", 
            "It's time to take your medication: null (10mg).", false);
        savedNotification.setType(Notification.NotificationType.MEDICATION_REMINDER);
        savedNotification.setRelatedEntityId(routineId);
        savedNotification.setRelatedEntityType("MEDICATION_ROUTINE");

        when(notificationRepository.save(any(Notification.class))).thenReturn(savedNotification);

        // When
        NotificationDto result = notificationService.createMedicationReminder(userId, routineId, medicationName, dosage);

        // Then
        assertNotNull(result);
        assertEquals("Medication Reminder", result.getTitle());
        assertTrue(result.getMessage().contains("null")); // The service should handle null gracefully
        assertEquals(Notification.NotificationType.MEDICATION_REMINDER, result.getType());

        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testNotificationDtoFromEntity() {
        // Given
        Notification notification = createNotification(1, 1, "Test", "Test message", false);
        notification.setType(Notification.NotificationType.GENERAL);
        notification.setRelatedEntityId(1);
        notification.setRelatedEntityType("TEST");

        // When
        NotificationDto dto = NotificationDto.fromEntity(notification);

        // Then
        assertNotNull(dto);
        assertEquals(1, dto.getNotificationId());
        assertEquals(1, dto.getUserId());
        assertEquals("Test", dto.getTitle());
        assertEquals("Test message", dto.getMessage());
        assertEquals(Notification.NotificationType.GENERAL, dto.getType());
        assertEquals(false, dto.isRead());
        assertEquals(1, dto.getRelatedEntityId());
        assertEquals("TEST", dto.getRelatedEntityType());
        assertNotNull(dto.getCreatedAt());
    }

    private Notification createNotification(Integer id, Integer userId, String title, String message, boolean isRead) {
        Notification notification = new Notification();
        notification.setNotificationId(id);
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setIsRead(isRead);
        notification.setType(Notification.NotificationType.GENERAL);
        notification.setCreatedAt(LocalDateTime.now());
        return notification;
    }
}
package com.hivclinic.service;

import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.Notification;
import com.hivclinic.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class to verify the notification status field confusion fix
 * Tests that both isRead and status fields are properly updated
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class NotificationStatusFixTest {

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    private Integer testUserId = 1;
    private Integer testAppointmentId = 1;
    
    @BeforeEach
    void setUp() {
        // Clean up any existing test data
        notificationRepository.deleteAll();
    }
    
    @Test
    void testCreateNotificationSetsCorrectStatus() {
        // Test appointment reminder creation
        NotificationDto appointmentDto = notificationService.createAppointmentReminder(
            testUserId, testAppointmentId, java.time.LocalDateTime.now(), "Test Patient"
        );
        
        assertNotNull(appointmentDto);
        assertEquals("SENT", appointmentDto.getStatus());
        assertFalse(appointmentDto.isRead());
        
        // Test medication reminder creation
        NotificationDto medicationDto = notificationService.createMedicationReminder(
            testUserId, 1, "Test Medication", "10mg"
        );
        
        assertNotNull(medicationDto);
        assertEquals("SENT", medicationDto.getStatus());
        assertFalse(medicationDto.isRead());
        
        // Test system notification creation
        NotificationDto systemDto = notificationService.createSystemNotification(
            testUserId, "Test Title", "Test Message", "MEDIUM"
        );
        
        assertNotNull(systemDto);
        assertEquals("SENT", systemDto.getStatus());
        assertFalse(systemDto.isRead());
    }
    
    @Test
    void testMarkAsReadUpdatesBothFields() {
        // Create a notification
        NotificationDto createdDto = notificationService.createAppointmentReminder(
            testUserId, testAppointmentId, java.time.LocalDateTime.now(), "Test Patient"
        );
        
        assertNotNull(createdDto);
        assertEquals("SENT", createdDto.getStatus());
        assertFalse(createdDto.isRead());
        
        // Mark as read
        NotificationDto readDto = notificationService.markAsRead(createdDto.getNotificationId(), testUserId);
        
        assertNotNull(readDto);
        assertEquals("READ", readDto.getStatus()); // Status should now be READ
        assertTrue(readDto.isRead()); // IsRead should be true
        
        // Verify in database
        Notification dbNotification = notificationRepository.findById(createdDto.getNotificationId()).orElse(null);
        assertNotNull(dbNotification);
        assertEquals("READ", dbNotification.getStatus());
        assertTrue(dbNotification.getIsRead());
    }
    
    @Test
    void testMarkAllAsReadUpdatesBothFields() {
        // Create multiple notifications
        NotificationDto dto1 = notificationService.createAppointmentReminder(
            testUserId, testAppointmentId, java.time.LocalDateTime.now(), "Test Patient 1"
        );
        NotificationDto dto2 = notificationService.createMedicationReminder(
            testUserId, 1, "Test Medication", "10mg"
        );
        NotificationDto dto3 = notificationService.createSystemNotification(
            testUserId, "Test Title", "Test Message", "MEDIUM"
        );
        
        // Verify all are unread with SENT status
        assertEquals("SENT", dto1.getStatus());
        assertEquals("SENT", dto2.getStatus());
        assertEquals("SENT", dto3.getStatus());
        assertFalse(dto1.isRead());
        assertFalse(dto2.isRead());
        assertFalse(dto3.isRead());
        
        // Mark all as read
        notificationService.markAllAsRead(testUserId);
        
        // Verify all are now read in database
        Notification dbNotification1 = notificationRepository.findById(dto1.getNotificationId()).orElse(null);
        Notification dbNotification2 = notificationRepository.findById(dto2.getNotificationId()).orElse(null);
        Notification dbNotification3 = notificationRepository.findById(dto3.getNotificationId()).orElse(null);
        
        assertNotNull(dbNotification1);
        assertNotNull(dbNotification2);
        assertNotNull(dbNotification3);
        
        // Both isRead and status should be updated
        assertEquals("READ", dbNotification1.getStatus());
        assertEquals("READ", dbNotification2.getStatus());
        assertEquals("READ", dbNotification3.getStatus());
        assertTrue(dbNotification1.getIsRead());
        assertTrue(dbNotification2.getIsRead());
        assertTrue(dbNotification3.getIsRead());
    }
    
    @Test
    void testDtoMappingIncludesStatus() {
        // Create a notification
        NotificationDto dto = notificationService.createAppointmentReminder(
            testUserId, testAppointmentId, java.time.LocalDateTime.now(), "Test Patient"
        );
        
        assertNotNull(dto);
        assertNotNull(dto.getStatus());
        assertEquals("SENT", dto.getStatus());
        
        // Mark as read and verify DTO includes updated status
        NotificationDto readDto = notificationService.markAsRead(dto.getNotificationId(), testUserId);
        
        assertNotNull(readDto);
        assertNotNull(readDto.getStatus());
        assertEquals("READ", readDto.getStatus());
        assertTrue(readDto.isRead());
    }
    
    @Test
    void testUnreadNotificationsQuery() {
        // Create notifications
        NotificationDto dto1 = notificationService.createAppointmentReminder(
            testUserId, testAppointmentId, java.time.LocalDateTime.now(), "Test Patient 1"
        );
        NotificationDto dto2 = notificationService.createMedicationReminder(
            testUserId, 1, "Test Medication", "10mg"
        );
        
        // Mark one as read
        notificationService.markAsRead(dto1.getNotificationId(), testUserId);
        
        // Get unread notifications
        var unreadNotifications = notificationService.getUnreadNotificationsByUserId(testUserId);
        
        assertEquals(1, unreadNotifications.size());
        assertEquals(dto2.getNotificationId(), unreadNotifications.get(0).getNotificationId());
        assertFalse(unreadNotifications.get(0).isRead());
        
        // Get unread count
        long unreadCount = notificationService.getUnreadNotificationCount(testUserId);
        assertEquals(1, unreadCount);
    }
}
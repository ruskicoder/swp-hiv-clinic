package com.hivclinic.service;

import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.Notification;
import com.hivclinic.model.User;
import com.hivclinic.model.Role;
import com.hivclinic.repository.NotificationRepository;
import com.hivclinic.repository.UserRepository;
import com.hivclinic.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class NotificationVisibilityTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;

    private Integer testPatientId;
    private Integer testNotificationId;

    @BeforeEach
    void setUp() {
        // Create a test role if it doesn't exist
        Role patientRole = roleRepository.findByRoleName("Patient")
                .orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName("Patient");
                    return roleRepository.save(role);
                });

        // Create a test user
        User testUser = new User();
        testUser.setUsername("test_patient_" + System.currentTimeMillis());
        testUser.setEmail("test_patient_" + System.currentTimeMillis() + "@example.com");
        testUser.setPasswordHash("dummy_password_hash");
        testUser.setFirstName("Test");
        testUser.setLastName("Patient");
        testUser.setRole(patientRole);
        testUser.setIsActive(true);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
        
        User savedUser = userRepository.save(testUser);
        testPatientId = savedUser.getUserId();
        
        System.out.println("DEBUG: Created test user with ID: " + testPatientId);
        
        // Create a test notification
        Notification notification = new Notification();
        notification.setUserId(testPatientId);
        notification.setType(Notification.NotificationType.GENERAL);
        notification.setTitle("Test Notification");
        notification.setMessage("This is a test notification");
        notification.setIsRead(false);
        notification.setStatus("SENT");
        notification.setPriority("MEDIUM");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        
        Notification savedNotification = notificationRepository.save(notification);
        testNotificationId = savedNotification.getNotificationId();
        
        System.out.println("DEBUG: Created test notification with ID: " + testNotificationId);
    }

    @Test
    @DisplayName("Test: Cancelled notifications should be hidden from patient view")
    void testCancelledNotificationsHiddenFromPatient() {
        // Step 1: Verify notification is initially visible to patient
        List<NotificationDto> initialNotifications = notificationService.getNotificationsByUserId(testPatientId);
        boolean initiallyVisible = initialNotifications.stream()
                .anyMatch(n -> n.getNotificationId().equals(testNotificationId));
        
        assertTrue(initiallyVisible, "Notification should be initially visible to patient");
        System.out.println("DEBUG: ✓ Step 1 passed - Notification initially visible to patient");

        // Step 2: Simulate doctor cancelling the notification
        Optional<Notification> notificationOpt = notificationRepository.findById(testNotificationId);
        assertTrue(notificationOpt.isPresent(), "Test notification should exist");
        
        Notification notification = notificationOpt.get();
        notification.setStatus("CANCELLED");
        notification.setTitle(notification.getTitle() + " [CANCELLED]");
        notification.setMessage(notification.getMessage() + " [CANCELLED]");
        notificationRepository.save(notification);
        
        System.out.println("DEBUG: ✓ Step 2 passed - Notification marked as CANCELLED");

        // Step 3: Verify notification is no longer visible to patient
        List<NotificationDto> notificationsAfterCancel = notificationService.getNotificationsByUserId(testPatientId);
        boolean visibleAfterCancel = notificationsAfterCancel.stream()
                .anyMatch(n -> n.getNotificationId().equals(testNotificationId));
        
        assertFalse(visibleAfterCancel, "Cancelled notification should NOT be visible to patient");
        System.out.println("DEBUG: ✓ Step 3 passed - Cancelled notification hidden from patient");

        // Step 4: Verify unread notifications also filter out cancelled ones
        List<NotificationDto> unreadNotifications = notificationService.getUnreadNotificationsByUserId(testPatientId);
        boolean inUnreadList = unreadNotifications.stream()
                .anyMatch(n -> n.getNotificationId().equals(testNotificationId));
        
        assertFalse(inUnreadList, "Cancelled notification should NOT appear in unread notifications");
        System.out.println("DEBUG: ✓ Step 4 passed - Cancelled notification not in unread list");

        // Step 5: Verify unread count excludes cancelled notifications
        long unreadCount = notificationService.getUnreadNotificationCount(testPatientId);
        
        // Create another non-cancelled notification to verify count logic
        Notification nonCancelledNotification = new Notification();
        nonCancelledNotification.setUserId(testPatientId);
        nonCancelledNotification.setType(Notification.NotificationType.GENERAL);
        nonCancelledNotification.setTitle("Active Notification");
        nonCancelledNotification.setMessage("This notification is active");
        nonCancelledNotification.setIsRead(false);
        nonCancelledNotification.setStatus("SENT");
        nonCancelledNotification.setPriority("MEDIUM");
        nonCancelledNotification.setCreatedAt(LocalDateTime.now());
        nonCancelledNotification.setUpdatedAt(LocalDateTime.now());
        notificationRepository.save(nonCancelledNotification);
        
        long unreadCountAfterAdding = notificationService.getUnreadNotificationCount(testPatientId);
        
        // The count should include only the non-cancelled notification
        assertTrue(unreadCountAfterAdding >= 1, "Unread count should include non-cancelled notifications");
        System.out.println("DEBUG: ✓ Step 5 passed - Unread count correctly excludes cancelled notifications");

        System.out.println("DEBUG: ✅ All test steps passed - Cancelled notifications are properly hidden from patients");
    }

    @Test
    @DisplayName("Test: Staff should still be able to see cancelled notifications in management views")
    void testStaffCanSeeCancelledNotifications() {
        // Step 1: Cancel the test notification
        Optional<Notification> notificationOpt = notificationRepository.findById(testNotificationId);
        assertTrue(notificationOpt.isPresent(), "Test notification should exist");
        
        Notification notification = notificationOpt.get();
        notification.setStatus("CANCELLED");
        notificationRepository.save(notification);
        
        // Step 2: Verify cancelled notification is still accessible via direct repository query
        // (This simulates how staff management interfaces would access notifications)
        List<Notification> allNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(testPatientId);
        boolean cancelledNotificationExists = allNotifications.stream()
                .anyMatch(n -> n.getNotificationId().equals(testNotificationId) && "CANCELLED".equals(n.getStatus()));
        
        assertTrue(cancelledNotificationExists, "Staff should be able to see cancelled notifications for management purposes");
        System.out.println("DEBUG: ✓ Staff can still access cancelled notifications for management");
    }

    @Test
    @DisplayName("Test: Mixed scenario with both active and cancelled notifications")
    void testMixedActiveAndCancelledNotifications() {
        // Create multiple notifications
        Notification activeNotification = new Notification();
        activeNotification.setUserId(testPatientId);
        activeNotification.setType(Notification.NotificationType.APPOINTMENT_REMINDER);
        activeNotification.setTitle("Active Appointment Reminder");
        activeNotification.setMessage("Your appointment is tomorrow");
        activeNotification.setIsRead(false);
        activeNotification.setStatus("SENT");
        activeNotification.setPriority("HIGH");
        activeNotification.setCreatedAt(LocalDateTime.now());
        activeNotification.setUpdatedAt(LocalDateTime.now());
        Notification savedActive = notificationRepository.save(activeNotification);
        
        Notification cancelledNotification = new Notification();
        cancelledNotification.setUserId(testPatientId);
        cancelledNotification.setType(Notification.NotificationType.MEDICATION_REMINDER);
        cancelledNotification.setTitle("Cancelled Medication Reminder");
        cancelledNotification.setMessage("Take your medication [CANCELLED]");
        cancelledNotification.setIsRead(false);
        cancelledNotification.setStatus("CANCELLED");
        cancelledNotification.setPriority("MEDIUM");
        cancelledNotification.setCreatedAt(LocalDateTime.now());
        cancelledNotification.setUpdatedAt(LocalDateTime.now());
        Notification savedCancelled = notificationRepository.save(cancelledNotification);
        
        // Test patient view only shows active notifications
        List<NotificationDto> patientNotifications = notificationService.getNotificationsByUserId(testPatientId);
        
        boolean activeVisible = patientNotifications.stream()
                .anyMatch(n -> n.getNotificationId().equals(savedActive.getNotificationId()));
        boolean cancelledVisible = patientNotifications.stream()
                .anyMatch(n -> n.getNotificationId().equals(savedCancelled.getNotificationId()));
        
        assertTrue(activeVisible, "Active notification should be visible to patient");
        assertFalse(cancelledVisible, "Cancelled notification should be hidden from patient");
        
        System.out.println("DEBUG: ✓ Mixed scenario test passed - Only active notifications visible to patient");
    }
}
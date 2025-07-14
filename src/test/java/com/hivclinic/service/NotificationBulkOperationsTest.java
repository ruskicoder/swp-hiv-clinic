package com.hivclinic.service;

import com.hivclinic.model.Notification;
import com.hivclinic.model.User;
import com.hivclinic.repository.NotificationRepository;
import com.hivclinic.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test class to validate the critical backend fixes for notification system
 */
@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
public class NotificationBulkOperationsTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.hivclinic.repository.AppointmentRepository appointmentRepository;

    @Mock
    private com.hivclinic.repository.PatientProfileRepository patientProfileRepository;

    @InjectMocks
    private DoctorNotificationService doctorNotificationService;

    private User mockDoctor;
    private User mockPatient;
    private Notification mockNotification;

    @BeforeEach
    void setUp() {
        // Setup mock doctor
        mockDoctor = new User();
        mockDoctor.setUserId(1);
        mockDoctor.setUsername("doctor1");
        mockDoctor.setEmail("doctor@test.com");
        
        com.hivclinic.model.Role doctorRole = new com.hivclinic.model.Role();
        doctorRole.setRoleName("Doctor");
        mockDoctor.setRole(doctorRole);

        // Setup mock patient
        mockPatient = new User();
        mockPatient.setUserId(2);
        mockPatient.setUsername("patient1");
        mockPatient.setEmail("patient@test.com");
        
        com.hivclinic.model.Role patientRole = new com.hivclinic.model.Role();
        patientRole.setRoleName("Patient");
        mockPatient.setRole(patientRole);

        // Setup mock notification
        mockNotification = new Notification();
        mockNotification.setNotificationId(100);
        mockNotification.setUserId(2);
        mockNotification.setTitle("Test Notification");
        mockNotification.setMessage("Test message");
        mockNotification.setType(Notification.NotificationType.APPOINTMENT_REMINDER);
        mockNotification.setPriority("HIGH");
        mockNotification.setIsRead(false);
        mockNotification.setCreatedAt(LocalDateTime.now());
        mockNotification.setSentAt(null); // Not sent yet
        mockNotification.setStatus("PENDING"); // Initial status
    }

    /**
     * Test 1: Verify new notifications are created with proper status
     */
    @Test
    void testNewNotificationStatusAssignment() {
        // Setup mocks
        when(userRepository.findById(1)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.findById(2)).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorUserAndPatientUser(any(), any()))
            .thenReturn(Arrays.asList(new com.hivclinic.model.Appointment()));
        
        com.hivclinic.service.NotificationTemplateService mockTemplateService = mock(com.hivclinic.service.NotificationTemplateService.class);
        com.hivclinic.model.NotificationTemplate mockTemplate = new com.hivclinic.model.NotificationTemplate();
        mockTemplate.setTemplateId(1L);
        mockTemplate.setType(com.hivclinic.model.NotificationTemplate.NotificationType.APPOINTMENT_REMINDER);
        mockTemplate.setSubject("Test Subject");
        mockTemplate.setBody("Test Body");
        mockTemplate.setPriority(com.hivclinic.model.NotificationTemplate.Priority.HIGH);
        mockTemplate.setIsActive(true);
        
        when(mockTemplateService.getTemplateById(1L)).thenReturn(Optional.of(mockTemplate));
        when(mockTemplateService.processTemplate(anyString(), any())).thenReturn("Processed Text");
        
        // Capture the notification that gets saved
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification savedNotification = invocation.getArgument(0);
            // Verify that status is set to "SENT" for new notifications
            assertEquals("SENT", savedNotification.getStatus());
            return savedNotification;
        });

        // Use reflection to inject the mock template service
        try {
            java.lang.reflect.Field field = DoctorNotificationService.class.getDeclaredField("notificationTemplateService");
            field.setAccessible(true);
            field.set(doctorNotificationService, mockTemplateService);
        } catch (Exception e) {
            fail("Failed to inject mock template service");
        }

        // Execute the method
        boolean result = doctorNotificationService.sendNotificationToPatient(1L, 2L, 1L, null);

        // Verify
        assertTrue(result);
        verify(notificationRepository).save(any(Notification.class));
    }

    /**
     * Test 2: Verify unsend operation sets status to "CANCELLED"
     */
    @Test
    void testUnsendOperationSetsStatusToCancelled() {
        // Setup mocks
        when(notificationRepository.findById(100)).thenReturn(Optional.of(mockNotification));
        when(userRepository.findById(1)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.findById(2)).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorUserAndPatientUser(any(), any()))
            .thenReturn(Arrays.asList(new com.hivclinic.model.Appointment()));
        
        // Capture the notification that gets saved
        when(notificationRepository.save(any(Notification.class))).thenAnswer(invocation -> {
            Notification savedNotification = invocation.getArgument(0);
            // Verify that status is set to "CANCELLED" during unsend
            assertEquals("CANCELLED", savedNotification.getStatus());
            assertTrue(savedNotification.getTitle().contains("[CANCELLED]"));
            assertTrue(savedNotification.getMessage().contains("[CANCELLED]"));
            return savedNotification;
        });

        // Execute the method
        boolean result = doctorNotificationService.unsendNotification(100L, 1L);

        // Verify
        assertTrue(result);
        verify(notificationRepository).save(any(Notification.class));
    }

    /**
     * Test 3: Verify delete operation removes notification
     */
    @Test
    void testDeleteNotificationRemovesFromDatabase() {
        // Setup mocks
        when(notificationRepository.findById(100)).thenReturn(Optional.of(mockNotification));
        when(userRepository.findById(1)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.findById(2)).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorUserAndPatientUser(any(), any()))
            .thenReturn(Arrays.asList(new com.hivclinic.model.Appointment()));

        // Execute the method
        boolean result = doctorNotificationService.deleteNotification(100L, 1L);

        // Verify
        assertTrue(result);
        verify(notificationRepository).delete(mockNotification);
    }

    /**
     * Test 4: Verify status field usage in notification history
     */
    @Test
    void testStatusFieldUsageInNotificationHistory() {
        // Setup notification with explicit status
        mockNotification.setStatus("DELIVERED");
        mockNotification.setSentAt(LocalDateTime.now());
        mockNotification.setIsRead(false);

        // Setup mocks
        when(userRepository.findById(1)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.findById(2)).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorUserAndPatientUser(any(), any()))
            .thenReturn(Arrays.asList(new com.hivclinic.model.Appointment()));
        when(notificationRepository.findAll()).thenReturn(Arrays.asList(mockNotification));

        // Execute the method
        List<java.util.Map<String, Object>> history = doctorNotificationService.getNotificationHistoryForDoctor(1L);

        // Verify that actual status field is used (not calculated)
        assertFalse(history.isEmpty());
        java.util.Map<String, Object> notificationData = history.get(0);
        assertEquals("DELIVERED", notificationData.get("status"));
    }

    /**
     * Test 5: Verify fallback status calculation when status is null
     */
    @Test
    void testFallbackStatusCalculationWhenStatusIsNull() {
        // Setup notification with null status
        mockNotification.setStatus(null);
        mockNotification.setSentAt(LocalDateTime.now());
        mockNotification.setIsRead(true);

        // Setup mocks
        when(userRepository.findById(1)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.findById(2)).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorUserAndPatientUser(any(), any()))
            .thenReturn(Arrays.asList(new com.hivclinic.model.Appointment()));
        when(notificationRepository.findAll()).thenReturn(Arrays.asList(mockNotification));

        // Execute the method
        List<java.util.Map<String, Object>> history = doctorNotificationService.getNotificationHistoryForDoctor(1L);

        // Verify that fallback calculation is used
        assertFalse(history.isEmpty());
        java.util.Map<String, Object> notificationData = history.get(0);
        assertEquals("READ", notificationData.get("status"));
    }

    /**
     * Test 6: Verify permission validation for bulk operations
     */
    @Test
    void testPermissionValidationForBulkOperations() {
        // Setup mocks with no appointments (no permission)
        when(notificationRepository.findById(100)).thenReturn(Optional.of(mockNotification));
        when(userRepository.findById(1)).thenReturn(Optional.of(mockDoctor));
        when(userRepository.findById(2)).thenReturn(Optional.of(mockPatient));
        when(appointmentRepository.findByDoctorUserAndPatientUser(any(), any()))
            .thenReturn(Arrays.asList()); // No appointments = no permission

        // Execute the unsend method
        boolean unsendResult = doctorNotificationService.unsendNotification(100L, 1L);

        // Execute the delete method
        boolean deleteResult = doctorNotificationService.deleteNotification(100L, 1L);

        // Verify both operations are denied
        assertFalse(unsendResult);
        assertFalse(deleteResult);
        verify(notificationRepository, never()).save(any());
        verify(notificationRepository, never()).delete(any());
    }
}
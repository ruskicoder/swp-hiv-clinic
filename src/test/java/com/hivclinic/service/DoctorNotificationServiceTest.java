package com.hivclinic.service;

import com.hivclinic.model.*;
import com.hivclinic.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.Logger;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorNotificationServiceTest {

    @Mock
    private NotificationTemplateService notificationTemplateService;

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private PatientProfileRepository patientProfileRepository;

    @InjectMocks
    private DoctorNotificationService doctorNotificationService;

    private User doctorUser;
    private User patientUser;
    private Role doctorRole;
    private Role patientRole;
    private NotificationTemplate template;
    private Appointment appointment;
    private PatientProfile patientProfile;

    @BeforeEach
    void setUp() {
        // Set up roles
        doctorRole = new Role();
        doctorRole.setRoleId(1);
        doctorRole.setRoleName("Doctor");

        patientRole = new Role();
        patientRole.setRoleId(2);
        patientRole.setRoleName("Patient");

        // Set up doctor user
        doctorUser = new User();
        doctorUser.setUserId(1);
        doctorUser.setUsername("doctor1");
        doctorUser.setEmail("doctor@test.com");
        doctorUser.setFirstName("Dr. John");
        doctorUser.setLastName("Doe");
        doctorUser.setRole(doctorRole);

        // Set up patient user
        patientUser = new User();
        patientUser.setUserId(2);
        patientUser.setUsername("patient1");
        patientUser.setEmail("patient@test.com");
        patientUser.setFirstName("Jane");
        patientUser.setLastName("Smith");
        patientUser.setRole(patientRole);

        // Set up patient profile
        patientProfile = new PatientProfile();
        patientProfile.setPatientProfileId(1);
        patientProfile.setUser(patientUser);
        patientProfile.setFirstName("Jane");
        patientProfile.setLastName("Smith");

        // Set up appointment
        appointment = new Appointment();
        appointment.setAppointmentId(1);
        appointment.setDoctorUser(doctorUser);
        appointment.setPatientUser(patientUser);
        appointment.setAppointmentDateTime(LocalDateTime.now().plusDays(1));
        appointment.setStatus("SCHEDULED");

        // Set up notification template
        template = new NotificationTemplate();
        template.setTemplateId(1L);
        template.setName("Appointment Reminder");
        template.setSubject("Your appointment reminder");
        template.setBody("Dear {{patientName}}, you have an appointment on {{appointmentDate}}");
        template.setType(NotificationTemplate.NotificationType.APPOINTMENT_REMINDER);
        template.setPriority(NotificationTemplate.Priority.MEDIUM);
        template.setIsActive(true);
    }

    @Test
    void testGetPatientsWithAppointments_Success() {
        // Given
        Long doctorId = 1L;
        List<Appointment> appointments = Arrays.asList(appointment);

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findByDoctorUser(doctorUser)).thenReturn(appointments);
        when(patientProfileRepository.findByUser(patientUser)).thenReturn(Optional.of(patientProfile));

        // When
        List<Map<String, Object>> result = doctorNotificationService.getPatientsWithAppointments(doctorId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        
        Map<String, Object> patientData = result.get(0);
        assertEquals(2, patientData.get("userId"));
        assertEquals("Jane", patientData.get("firstName"));
        assertEquals("Smith", patientData.get("lastName"));
        assertEquals("patient@test.com", patientData.get("email"));
        assertEquals(appointment.getAppointmentDateTime(), patientData.get("lastAppointment"));
        assertEquals("SCHEDULED", patientData.get("appointmentStatus"));

        verify(userRepository).findById(doctorId.intValue());
        verify(appointmentRepository).findByDoctorUser(doctorUser);
        verify(patientProfileRepository).findByUser(patientUser);
    }

    @Test
    void testGetPatientsWithAppointments_WithoutPatientProfile() {
        // Given
        Long doctorId = 1L;
        List<Appointment> appointments = Arrays.asList(appointment);

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findByDoctorUser(doctorUser)).thenReturn(appointments);
        when(patientProfileRepository.findByUser(patientUser)).thenReturn(Optional.empty());

        // When
        List<Map<String, Object>> result = doctorNotificationService.getPatientsWithAppointments(doctorId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        
        Map<String, Object> patientData = result.get(0);
        assertEquals(2, patientData.get("userId"));
        assertEquals("Jane", patientData.get("firstName")); // Falls back to User entity
        assertEquals("Smith", patientData.get("lastName"));
        assertEquals("patient@test.com", patientData.get("email"));

        verify(patientProfileRepository).findByUser(patientUser);
    }

    @Test
    void testGetPatientsWithAppointments_WithFallbackNames() {
        // Given
        Long doctorId = 1L;
        User patientWithNoNames = new User();
        patientWithNoNames.setUserId(3);
        patientWithNoNames.setUsername("patient3");
        patientWithNoNames.setEmail("patient3@test.com");
        patientWithNoNames.setRole(patientRole);

        Appointment appointmentWithNoNames = new Appointment();
        appointmentWithNoNames.setAppointmentId(2);
        appointmentWithNoNames.setDoctorUser(doctorUser);
        appointmentWithNoNames.setPatientUser(patientWithNoNames);
        appointmentWithNoNames.setAppointmentDateTime(LocalDateTime.now().plusDays(1));
        appointmentWithNoNames.setStatus("SCHEDULED");

        List<Appointment> appointments = Arrays.asList(appointmentWithNoNames);

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findByDoctorUser(doctorUser)).thenReturn(appointments);
        when(patientProfileRepository.findByUser(patientWithNoNames)).thenReturn(Optional.empty());

        // When
        List<Map<String, Object>> result = doctorNotificationService.getPatientsWithAppointments(doctorId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        
        Map<String, Object> patientData = result.get(0);
        assertEquals(3, patientData.get("userId"));
        assertEquals("patient3", patientData.get("firstName")); // Falls back to username
        assertEquals("Patient", patientData.get("lastName")); // Default fallback
        assertEquals("patient3@test.com", patientData.get("email"));
    }

    @Test
    void testGetPatientsWithAppointments_DoctorNotFound() {
        // Given
        Long doctorId = 999L;
        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.empty());

        // When
        List<Map<String, Object>> result = doctorNotificationService.getPatientsWithAppointments(doctorId);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(userRepository).findById(doctorId.intValue());
        verify(appointmentRepository, never()).findByDoctorUser(any());
    }

    @Test
    void testGetPatientsWithAppointments_NoAppointments() {
        // Given
        Long doctorId = 1L;
        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(appointmentRepository.findByDoctorUser(doctorUser)).thenReturn(Collections.emptyList());

        // When
        List<Map<String, Object>> result = doctorNotificationService.getPatientsWithAppointments(doctorId);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetPatientsWithAppointments_ExceptionHandling() {
        // Given
        Long doctorId = 1L;
        when(userRepository.findById(doctorId.intValue())).thenThrow(new RuntimeException("Database error"));

        // When
        List<Map<String, Object>> result = doctorNotificationService.getPatientsWithAppointments(doctorId);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testSendNotificationToPatient_Success() {
        // Given
        Long doctorId = 1L;
        Long patientId = 2L;
        Long templateId = 1L;
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "Jane Smith");

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(patientId.intValue())).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findByDoctorUserAndPatientUser(doctorUser, patientUser))
                .thenReturn(Arrays.asList(appointment));
        when(notificationTemplateService.getTemplateById(templateId)).thenReturn(Optional.of(template));
        when(notificationTemplateService.processTemplate(anyString(), any())).thenReturn("Processed template");
        when(notificationRepository.save(any(Notification.class))).thenReturn(new Notification());

        // When
        boolean result = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);

        // Then
        assertTrue(result);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testSendNotificationToPatient_DoctorNotFound() {
        // Given
        Long doctorId = 999L;
        Long patientId = 2L;
        Long templateId = 1L;
        Map<String, String> variables = new HashMap<>();

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.empty());

        // When
        boolean result = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);

        // Then
        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testSendNotificationToPatient_PatientNotFound() {
        // Given
        Long doctorId = 1L;
        Long patientId = 999L;
        Long templateId = 1L;
        Map<String, String> variables = new HashMap<>();

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(patientId.intValue())).thenReturn(Optional.empty());

        // When
        boolean result = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);

        // Then
        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testSendNotificationToPatient_NoPermission() {
        // Given
        Long doctorId = 1L;
        Long patientId = 2L;
        Long templateId = 1L;
        Map<String, String> variables = new HashMap<>();

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(patientId.intValue())).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findByDoctorUserAndPatientUser(doctorUser, patientUser))
                .thenReturn(Collections.emptyList()); // No appointments = no permission

        // When
        boolean result = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);

        // Then
        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testSendNotificationToPatient_TemplateNotFound() {
        // Given
        Long doctorId = 1L;
        Long patientId = 2L;
        Long templateId = 999L;
        Map<String, String> variables = new HashMap<>();

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(patientId.intValue())).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findByDoctorUserAndPatientUser(doctorUser, patientUser))
                .thenReturn(Arrays.asList(appointment));
        when(notificationTemplateService.getTemplateById(templateId)).thenReturn(Optional.empty());

        // When
        boolean result = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);

        // Then
        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testSendNotificationToPatient_InactiveTemplate() {
        // Given
        Long doctorId = 1L;
        Long patientId = 2L;
        Long templateId = 1L;
        Map<String, String> variables = new HashMap<>();

        template.setIsActive(false); // Set template as inactive

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(patientId.intValue())).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findByDoctorUserAndPatientUser(doctorUser, patientUser))
                .thenReturn(Arrays.asList(appointment));
        when(notificationTemplateService.getTemplateById(templateId)).thenReturn(Optional.of(template));

        // When
        boolean result = doctorNotificationService.sendNotificationToPatient(doctorId, patientId, templateId, variables);

        // Then
        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testGetNotificationHistory_Success() {
        // Given
        Long doctorId = 1L;
        Long patientId = 2L;
        List<Notification> notifications = Arrays.asList(
                createNotification(1, "Test notification 1"),
                createNotification(2, "Test notification 2")
        );

        when(appointmentRepository.findByDoctorUserAndPatientUser(any(), any()))
                .thenReturn(Arrays.asList(appointment));
        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(patientId.intValue())).thenReturn(Optional.of(patientUser));
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(patientId.intValue()))
                .thenReturn(notifications);

        // When
        List<Notification> result = doctorNotificationService.getNotificationHistory(doctorId, patientId);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("Test notification 1", result.get(0).getTitle());
        assertEquals("Test notification 2", result.get(1).getTitle());
    }

    @Test
    void testGetNotificationHistory_NoPermission() {
        // Given
        Long doctorId = 1L;
        Long patientId = 2L;

        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(patientId.intValue())).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findByDoctorUserAndPatientUser(doctorUser, patientUser))
                .thenReturn(Collections.emptyList()); // No appointments = no permission

        // When
        List<Notification> result = doctorNotificationService.getNotificationHistory(doctorId, patientId);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(notificationRepository, never()).findByUserIdOrderByCreatedAtDesc(any());
    }

    @Test
    void testUnsendNotification_Success() {
        // Given
        Long notificationId = 1L;
        Long doctorId = 1L;
        Notification notification = createNotification(1, "Test notification");
        notification.setSentAt(null); // Not sent yet

        when(notificationRepository.findById(notificationId.intValue())).thenReturn(Optional.of(notification));
        when(userRepository.findById(doctorId.intValue())).thenReturn(Optional.of(doctorUser));
        when(userRepository.findById(notification.getUserId())).thenReturn(Optional.of(patientUser));
        when(appointmentRepository.findByDoctorUserAndPatientUser(doctorUser, patientUser))
                .thenReturn(Arrays.asList(appointment));
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

        // When
        boolean result = doctorNotificationService.unsendNotification(notificationId, doctorId);

        // Then
        assertTrue(result);
        verify(notificationRepository).save(any(Notification.class));
    }

    @Test
    void testUnsendNotification_NotificationNotFound() {
        // Given
        Long notificationId = 999L;
        Long doctorId = 1L;

        when(notificationRepository.findById(notificationId.intValue())).thenReturn(Optional.empty());

        // When
        boolean result = doctorNotificationService.unsendNotification(notificationId, doctorId);

        // Then
        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testUnsendNotification_AlreadySent() {
        // Given
        Long notificationId = 1L;
        Long doctorId = 1L;
        Notification notification = createNotification(1, "Test notification");
        notification.setSentAt(LocalDateTime.now()); // Already sent

        when(notificationRepository.findById(notificationId.intValue())).thenReturn(Optional.of(notification));

        // When
        boolean result = doctorNotificationService.unsendNotification(notificationId, doctorId);

        // Then
        assertFalse(result);
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void testGetNotificationTemplatesByType_Success() {
        // Given
        String type = "APPOINTMENT_REMINDER";
        List<NotificationTemplate> templates = Arrays.asList(template);

        when(notificationTemplateService.getTemplatesByType(NotificationTemplate.NotificationType.APPOINTMENT_REMINDER))
                .thenReturn(templates);

        // When
        List<NotificationTemplate> result = doctorNotificationService.getNotificationTemplatesByType(type);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(template.getName(), result.get(0).getName());
    }

    @Test
    void testGetNotificationTemplatesByType_InvalidType() {
        // Given
        String type = "INVALID_TYPE";

        // When
        List<NotificationTemplate> result = doctorNotificationService.getNotificationTemplatesByType(type);

        // Then
        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    private Notification createNotification(Integer id, String title) {
        Notification notification = new Notification();
        notification.setNotificationId(id);
        notification.setUserId(2);
        notification.setTitle(title);
        notification.setMessage("Test message");
        notification.setType(Notification.NotificationType.GENERAL);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notification;
    }
}
package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService;
import com.hivclinic.dto.NotificationDto;
import com.hivclinic.model.Notification;
import com.hivclinic.model.NotificationTemplate;
import com.hivclinic.service.DoctorNotificationService;
import com.hivclinic.service.NotificationService;
import com.hivclinic.service.NotificationTemplateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private NotificationTemplateService notificationTemplateService;

    @MockBean
    private DoctorNotificationService doctorNotificationService;

    @Autowired
    private ObjectMapper objectMapper;

    private CustomUserDetailsService.UserPrincipal userPrincipal;
    private NotificationDto notificationDto;
    private NotificationTemplate template;
    private List<NotificationDto> notifications;
    private Map<String, Object> patientData;

    @BeforeEach
    void setUp() {
        // Set up user principal
        userPrincipal = new CustomUserDetailsService.UserPrincipal(
            1,
            "doctor@test.com",
            "doctor@test.com",
            "password",
            "ROLE_DOCTOR",
            true,
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_DOCTOR"))
        );

        // Set up notification DTO
        notificationDto = new NotificationDto();
        notificationDto.setNotificationId(1);
        notificationDto.setUserId(1);
        notificationDto.setTitle("Test Notification");
        notificationDto.setMessage("Test message");
        notificationDto.setType(Notification.NotificationType.GENERAL);
        notificationDto.setRead(false);
        notificationDto.setCreatedAt(LocalDateTime.now());

        notifications = Arrays.asList(notificationDto);

        // Set up notification template
        template = new NotificationTemplate();
        template.setTemplateId(1L);
        template.setName("Test Template");
        template.setSubject("Test Subject");
        template.setBody("Test Body");
        template.setType(NotificationTemplate.NotificationType.GENERAL);
        template.setPriority(NotificationTemplate.Priority.MEDIUM);
        template.setIsActive(true);

        // Set up patient data
        patientData = new HashMap<>();
        patientData.put("userId", 2);
        patientData.put("firstName", "John");
        patientData.put("lastName", "Doe");
        patientData.put("email", "john.doe@test.com");
        patientData.put("lastAppointment", LocalDateTime.now().minusDays(1));
        patientData.put("appointmentStatus", "COMPLETED");
    }

    @Test
    void testGetNotifications_Success() throws Exception {
        // Given
        when(notificationService.getNotificationsByUserId(1)).thenReturn(notifications);

        // When & Then
        mockMvc.perform(get("/api/v1/notifications")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].notificationId").value(1))
                .andExpect(jsonPath("$[0].title").value("Test Notification"))
                .andExpect(jsonPath("$[0].message").value("Test message"))
                .andExpect(jsonPath("$[0].isRead").value(false));

        verify(notificationService).getNotificationsByUserId(1);
    }

    @Test
    void testGetNotifications_UnreadOnly() throws Exception {
        // Given
        when(notificationService.getUnreadNotificationsByUserId(1)).thenReturn(notifications);

        // When & Then
        mockMvc.perform(get("/api/v1/notifications")
                .param("status", "unread")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].notificationId").value(1));

        verify(notificationService).getUnreadNotificationsByUserId(1);
    }

    @Test
    void testMarkAsRead_Success() throws Exception {
        // Given
        when(notificationService.markAsRead(1)).thenReturn(notificationDto);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/1/read")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notificationId").value(1))
                .andExpect(jsonPath("$.title").value("Test Notification"));

        verify(notificationService).markAsRead(1);
    }

    @Test
    void testMarkAsRead_NotFound() throws Exception {
        // Given
        when(notificationService.markAsRead(999)).thenReturn(null);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/999/read")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(notificationService).markAsRead(999);
    }

    @Test
    void testMarkAllAsRead_Success() throws Exception {
        // Given
        doNothing().when(notificationService).markAllAsRead(1);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/read-all")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(notificationService).markAllAsRead(1);
    }

    @Test
    void testGetAllTemplates_Success() throws Exception {
        // Given
        List<NotificationTemplate> templates = Arrays.asList(template);
        when(notificationTemplateService.getAllActiveTemplates()).thenReturn(templates);

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/templates")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].templateId").value(1))
                .andExpect(jsonPath("$[0].name").value("Test Template"));

        verify(notificationTemplateService).getAllActiveTemplates();
    }

    @Test
    void testGetTemplatesByType_Success() throws Exception {
        // Given
        List<NotificationTemplate> templates = Arrays.asList(template);
        when(notificationTemplateService.getTemplatesByType(NotificationTemplate.NotificationType.GENERAL))
                .thenReturn(templates);

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/templates/general")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].templateId").value(1));

        verify(notificationTemplateService).getTemplatesByType(NotificationTemplate.NotificationType.GENERAL);
    }

    @Test
    void testGetTemplatesByType_InvalidType() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/notifications/templates/invalid_type")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(notificationTemplateService, never()).getTemplatesByType(any());
    }

    @Test
    void testCreateTemplate_Success() throws Exception {
        // Given
        when(notificationTemplateService.createTemplate(any(NotificationTemplate.class))).thenReturn(template);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/templates")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(template)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.templateId").value(1))
                .andExpect(jsonPath("$.name").value("Test Template"));

        verify(notificationTemplateService).createTemplate(any(NotificationTemplate.class));
    }

    @Test
    void testCreateTemplate_Error() throws Exception {
        // Given
        when(notificationTemplateService.createTemplate(any(NotificationTemplate.class)))
                .thenThrow(new RuntimeException("Template creation failed"));

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/templates")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(template)))
                .andExpect(status().isBadRequest());

        verify(notificationTemplateService).createTemplate(any(NotificationTemplate.class));
    }

    @Test
    void testUpdateTemplate_Success() throws Exception {
        // Given
        when(notificationTemplateService.updateTemplate(eq(1L), any(NotificationTemplate.class)))
                .thenReturn(Optional.of(template));

        // When & Then
        mockMvc.perform(put("/api/v1/notifications/templates/1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(template)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.templateId").value(1));

        verify(notificationTemplateService).updateTemplate(eq(1L), any(NotificationTemplate.class));
    }

    @Test
    void testUpdateTemplate_NotFound() throws Exception {
        // Given
        when(notificationTemplateService.updateTemplate(eq(999L), any(NotificationTemplate.class)))
                .thenReturn(Optional.empty());

        // When & Then
        mockMvc.perform(put("/api/v1/notifications/templates/999")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(template)))
                .andExpect(status().isNotFound());

        verify(notificationTemplateService).updateTemplate(eq(999L), any(NotificationTemplate.class));
    }

    @Test
    void testDeleteTemplate_Success() throws Exception {
        // Given
        when(notificationTemplateService.deleteTemplate(1L)).thenReturn(true);

        // When & Then
        mockMvc.perform(delete("/api/v1/notifications/templates/1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());

        verify(notificationTemplateService).deleteTemplate(1L);
    }

    @Test
    void testDeleteTemplate_NotFound() throws Exception {
        // Given
        when(notificationTemplateService.deleteTemplate(999L)).thenReturn(false);

        // When & Then
        mockMvc.perform(delete("/api/v1/notifications/templates/999")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());

        verify(notificationTemplateService).deleteTemplate(999L);
    }

    @Test
    void testGetDoctorNotificationTemplatesByType_Success() throws Exception {
        // Given
        List<NotificationTemplate> templates = Arrays.asList(template);
        when(doctorNotificationService.getNotificationTemplatesByType("general")).thenReturn(templates);

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/doctor/templates")
                .param("type", "general")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].templateId").value(1));

        verify(doctorNotificationService).getNotificationTemplatesByType("general");
    }

    @Test
    void testSendNotificationToPatient_Success() throws Exception {
        // Given
        Map<String, String> variables = new HashMap<>();
        variables.put("patientName", "John Doe");
        
        when(doctorNotificationService.sendNotificationToPatient(1L, 2L, 1L, variables)).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/doctor/send")
                .param("doctorId", "1")
                .param("patientId", "2")
                .param("templateId", "1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(variables)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Notification sent successfully"));

        verify(doctorNotificationService).sendNotificationToPatient(1L, 2L, 1L, variables);
    }

    @Test
    void testSendNotificationToPatient_Failure() throws Exception {
        // Given
        Map<String, String> variables = new HashMap<>();
        when(doctorNotificationService.sendNotificationToPatient(1L, 2L, 1L, variables)).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/doctor/send")
                .param("doctorId", "1")
                .param("patientId", "2")
                .param("templateId", "1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(variables)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Failed to send notification"));

        verify(doctorNotificationService).sendNotificationToPatient(1L, 2L, 1L, variables);
    }

    @Test
    void testGetNotificationHistory_Success() throws Exception {
        // Given
        List<Notification> history = Arrays.asList(new Notification());
        when(doctorNotificationService.getNotificationHistory(1L, 2L)).thenReturn(history);

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/doctor/history/2")
                .param("doctorId", "1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());

        verify(doctorNotificationService).getNotificationHistory(1L, 2L);
    }

    @Test
    void testUnsendNotification_Success() throws Exception {
        // Given
        when(doctorNotificationService.unsendNotification(1L, 1L)).thenReturn(true);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/doctor/1/unsend")
                .param("doctorId", "1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Notification cancelled successfully"));

        verify(doctorNotificationService).unsendNotification(1L, 1L);
    }

    @Test
    void testUnsendNotification_Failure() throws Exception {
        // Given
        when(doctorNotificationService.unsendNotification(1L, 1L)).thenReturn(false);

        // When & Then
        mockMvc.perform(post("/api/v1/notifications/doctor/1/unsend")
                .param("doctorId", "1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Failed to cancel notification"));

        verify(doctorNotificationService).unsendNotification(1L, 1L);
    }

    @Test
    void testGetPatientsWithAppointments_Success() throws Exception {
        // Given
        List<Map<String, Object>> patients = Arrays.asList(patientData);
        when(doctorNotificationService.getPatientsWithAppointments(1L)).thenReturn(patients);

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/doctor/patients-with-appointments")
                .param("doctorId", "1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].userId").value(2))
                .andExpect(jsonPath("$[0].firstName").value("John"))
                .andExpect(jsonPath("$[0].lastName").value("Doe"))
                .andExpect(jsonPath("$[0].email").value("john.doe@test.com"));

        verify(doctorNotificationService).getPatientsWithAppointments(1L);
    }

    @Test
    void testGetPatientsWithAppointments_Error() throws Exception {
        // Given
        when(doctorNotificationService.getPatientsWithAppointments(1L))
                .thenThrow(new RuntimeException("Database error"));

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/doctor/patients-with-appointments")
                .param("doctorId", "1")
                .with(user(userPrincipal))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        verify(doctorNotificationService).getPatientsWithAppointments(1L);
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void testAuthenticationRequired() throws Exception {
        // Test that endpoints require authentication
        mockMvc.perform(get("/api/v1/notifications")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void testNoAuthenticationProvided() throws Exception {
        // Test that endpoints without authentication are rejected
        mockMvc.perform(get("/api/v1/notifications")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
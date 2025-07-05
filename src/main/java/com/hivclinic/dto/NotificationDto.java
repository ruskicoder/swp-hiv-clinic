package com.hivclinic.dto;

import com.hivclinic.model.Notification;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private Integer notificationId;
    private Integer doctorUserId;
    private Integer patientUserId;
    private String patientName;
    private Integer appointmentId;
    private Integer medicationRoutineId;
    private String medicationName;
    private String type;
    private String status;
    private String message;
    private Map<String, Object> payload;
    private LocalDateTime createdAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime seenAt;
    private LocalDateTime readAt;
    private LocalDateTime retractedAt;
    private String retractionReason;
    private String failureReason;
    
    // Enhanced appointment information for manager sorting
    private String appointmentStatus;
    private LocalDateTime appointmentDateTime;
    private String doctorName;

    public static NotificationDto fromEntity(Notification notification) {
        NotificationDto dto = new NotificationDto();
        dto.setNotificationId(notification.getNotificationId());
        dto.setDoctorUserId(notification.getDoctor().getUserId());
        dto.setPatientUserId(notification.getPatient().getUserId());
        dto.setPatientName(notification.getPatient().getFirstName() + " " + notification.getPatient().getLastName());
        dto.setDoctorName(notification.getDoctor().getFirstName() + " " + notification.getDoctor().getLastName());
        dto.setType(notification.getType());
        dto.setStatus(notification.getStatus());
        dto.setMessage(notification.getMessage());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setDeliveredAt(notification.getDeliveredAt());
        dto.setSeenAt(notification.getSeenAt());
        dto.setReadAt(notification.getReadAt());
        dto.setRetractedAt(notification.getRetractedAt());
        dto.setRetractionReason(notification.getRetractionReason());
        dto.setFailureReason(notification.getFailureReason());

        // Set appointment information if available
        if (notification.getAppointment() != null) {
            dto.setAppointmentId(notification.getAppointment().getAppointmentId());
            dto.setAppointmentStatus(notification.getAppointment().getStatus());
            dto.setAppointmentDateTime(notification.getAppointment().getAppointmentDateTime());
        }

        // Set medication routine information if available
        if (notification.getMedicationRoutine() != null) {
            dto.setMedicationRoutineId(notification.getMedicationRoutine().getRoutineId());
            dto.setMedicationName(notification.getMedicationRoutine().getMedicationName());
        }

        // Deserialize JSON payload
        if (notification.getPayload() != null && !notification.getPayload().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                dto.setPayload(mapper.readValue(notification.getPayload(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {}));
            } catch (Exception e) {
                // Handle exception, maybe log it
                dto.setPayload(null);
            }
        }
        return dto;
    }
}

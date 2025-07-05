package com.hivclinic.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientAppointmentDTO {
    private Integer appointmentId;
    private String patientName;
    private LocalDateTime appointmentDateTime;
    private String status;
    private Integer patientUserId;
    private Integer notificationCount;
}
package com.hivclinic.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientDashboardDTO {
    private Integer patientId;
    private String patientName;
    private LocalDateTime appointmentDateTime;
    private String appointmentStatus;
}
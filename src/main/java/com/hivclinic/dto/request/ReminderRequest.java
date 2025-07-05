package com.hivclinic.dto.request;

import lombok.Data;

@Data
public class ReminderRequest {
    private Integer patientId;
    private String message;
}
package com.hivclinic.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO for doctor availability slot operations
 * Handles date and time properly without timezone conversion issues
 */
@Data
public class DoctorAvailabilityRequest {
    
    @NotNull(message = "Slot date is required")
    private LocalDate slotDate;
    
    @NotNull(message = "Start time is required")
    private LocalTime startTime;
    
    @NotNull(message = "Duration in minutes is required")
    private Integer durationMinutes;
    
    private String notes;
}
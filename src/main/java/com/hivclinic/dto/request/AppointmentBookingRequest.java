package com.hivclinic.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for appointment booking requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentBookingRequest {

    @NotNull(message = "Doctor user ID is required")
    private Integer doctorUserId;

    @NotNull(message = "Appointment date and time is required")
    private LocalDateTime appointmentDateTime;

    @Positive(message = "Duration must be positive")
    private Integer durationMinutes = 30;

    private Integer availabilitySlotId;
}
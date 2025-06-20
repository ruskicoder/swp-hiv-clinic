package com.hivclinic.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * DTO for appointment booking requests with enhanced date/time parsing
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentBookingRequest {

    // Multiple formatters for flexible parsing
    private static final DateTimeFormatter[] SUPPORTED_FORMATTERS = {
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ISO_LOCAL_DATE_TIME
    };

    @NotNull(message = "Doctor user ID is required")
    private Integer doctorUserId;

    @NotNull(message = "Availability slot ID is required")
    private Integer availabilitySlotId;

    @NotNull(message = "Appointment date and time is required")
    private String appointmentDateTime;

    @Positive(message = "Duration must be positive")
    private Integer durationMinutes = 30;

    /**
     * Parse appointment date/time with multiple format support
     */
    public LocalDateTime getAppointmentDateTimeAsLocalDateTime() {
        if (appointmentDateTime == null || appointmentDateTime.trim().isEmpty()) {
            throw new IllegalArgumentException("Appointment date time is required");
        }
        
        // Clean the input string
        String cleanDateTimeStr = appointmentDateTime.trim();
        
        // Remove timezone indicators for local parsing
        if (cleanDateTimeStr.endsWith("Z")) {
            cleanDateTimeStr = cleanDateTimeStr.substring(0, cleanDateTimeStr.length() - 1);
        }
        
        // Remove timezone offset patterns
        cleanDateTimeStr = cleanDateTimeStr.replaceAll("[+-]\\d{2}:\\d{2}$", "");
        cleanDateTimeStr = cleanDateTimeStr.replaceAll("[+-]\\d{4}$", "");
        
        // Try each formatter
        for (DateTimeFormatter formatter : SUPPORTED_FORMATTERS) {
            try {
                return LocalDateTime.parse(cleanDateTimeStr, formatter);
            } catch (DateTimeParseException e) {
                // Continue to next formatter
            }
        }
        
        throw new IllegalArgumentException("Invalid datetime format: " + appointmentDateTime 
            + ". Expected format: yyyy-MM-ddTHH:mm:ss or similar ISO format");
    }
}
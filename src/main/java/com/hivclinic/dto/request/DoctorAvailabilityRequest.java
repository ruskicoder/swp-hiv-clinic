package com.hivclinic.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Request DTO for doctor availability slot operations
 * Handles date and time properly without timezone conversion issues
 */
public class DoctorAvailabilityRequest {
    
    @NotNull(message = "Slot date is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate slotDate;
    
    @NotNull(message = "Start time is required")
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime startTime;
    
    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Duration must be at least 15 minutes")
    @Max(value = 240, message = "Duration cannot exceed 4 hours")
    private Integer durationMinutes;
    
    private String notes;

    // Default constructor
    public DoctorAvailabilityRequest() {}

    // Constructor with parameters
    public DoctorAvailabilityRequest(LocalDate slotDate, LocalTime startTime, Integer durationMinutes, String notes) {
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.durationMinutes = durationMinutes;
        this.notes = notes;
    }

    // Getters and setters
    public LocalDate getSlotDate() {
        return slotDate;
    }

    public void setSlotDate(LocalDate slotDate) {
        this.slotDate = slotDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalTime startTime) {
        this.startTime = startTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    @Override
    public String toString() {
        return "DoctorAvailabilityRequest{" +
                "slotDate=" + slotDate +
                ", startTime=" + startTime +
                ", durationMinutes=" + durationMinutes +
                ", notes='" + notes + '\'' +
                '}';
    }
}
package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;

/**
 * Entity representing doctor availability slots
 */
@Entity
@Table(name = "DoctorAvailabilitySlots", 
       uniqueConstraints = {
    @UniqueConstraint(columnNames = {"DoctorUserID", "SlotDate", "StartTime"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DoctorAvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AvailabilitySlotID")
    private Integer availabilitySlotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DoctorUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User doctorUser;

    @Column(name = "SlotDate", nullable = false)
    private LocalDate slotDate;

    @Column(name = "StartTime", nullable = false)
    private LocalTime startTime;

    @Column(name = "EndTime", nullable = false)
    private LocalTime endTime;

    @Column(name = "DurationMinutes", nullable = false)
    private Integer durationMinutes = 30;

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
        if (this.startTime != null && durationMinutes != null) {
            this.endTime = this.startTime.plusMinutes(durationMinutes);
        }
    }

    @Column(name = "IsBooked", columnDefinition = "BIT DEFAULT 0")
    private Boolean isBooked = false;

    @Column(name = "Notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(name = "CreatedAt", columnDefinition = "DATETIME2 DEFAULT GETDATE()", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt", columnDefinition = "DATETIME2 DEFAULT GETDATE()")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (startTime != null && durationMinutes != null && endTime == null) {
            endTime = startTime.plusMinutes(durationMinutes);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Transient // This field won't be persisted
    public Integer getDurationMinutes() {
        if (startTime == null || endTime == null) {
            return 0;
        }
        return (int) ChronoUnit.MINUTES.between(
            LocalTime.parse(startTime.toString()), 
            LocalTime.parse(endTime.toString())
        );
    }
}
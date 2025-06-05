package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing appointments in the system
 */
@Entity
@Table(name = "Appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AppointmentID")
    private Integer appointmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PatientUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User patientUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DoctorUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User doctorUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AvailabilitySlotID")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private DoctorAvailabilitySlot availabilitySlot;

    @Column(name = "AppointmentDateTime", nullable = false)
    private LocalDateTime appointmentDateTime;

    @Column(name = "DurationMinutes", columnDefinition = "INT DEFAULT 30")
    private Integer durationMinutes = 30;

    @Column(name = "Status", nullable = false, length = 50, columnDefinition = "VARCHAR(50) DEFAULT 'Scheduled'")
    private String status = "Scheduled";

    @Column(name = "PatientCancellationReason", columnDefinition = "NVARCHAR(MAX)")
    private String patientCancellationReason;

    @Column(name = "DoctorCancellationReason", columnDefinition = "NVARCHAR(MAX)")
    private String doctorCancellationReason;

    @Column(name = "CreatedAt", columnDefinition = "DATETIME2 DEFAULT GETDATE()", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt", columnDefinition = "DATETIME2 DEFAULT GETDATE()")
    private LocalDateTime updatedAt;

    @Column(name = "AppointmentNotes", columnDefinition = "NVARCHAR(MAX)")
    private String appointmentNotes;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
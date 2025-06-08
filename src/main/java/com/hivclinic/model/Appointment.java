package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing an appointment between a patient and doctor
 */
@Entity
@Table(name = "Appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AppointmentID")
    private Integer appointmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PatientUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "appointments"})
    private User patientUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DoctorUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "appointments", "availabilitySlots"})
    private User doctorUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AvailabilitySlotID")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "appointment", "doctorUser"})
    private DoctorAvailabilitySlot availabilitySlot;

    @Column(name = "AppointmentDateTime", nullable = false)
    private LocalDateTime appointmentDateTime;

    @Column(name = "DurationMinutes")
    private Integer durationMinutes = 30;

    @Column(name = "Status", length = 50, columnDefinition = "VARCHAR(50) DEFAULT 'Scheduled'")
    private String status = "Scheduled";

    @Column(name = "PatientCancellationReason", columnDefinition = "NVARCHAR(MAX)")
    private String patientCancellationReason;

    @Column(name = "DoctorCancellationReason", columnDefinition = "NVARCHAR(MAX)")
    private String doctorCancellationReason;

    @Column(name = "CreatedAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt", nullable = false)
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
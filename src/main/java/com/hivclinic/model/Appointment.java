package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Appointment entity with improved date/time handling
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
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime appointmentDateTime;

    @Column(name = "DurationMinutes")
    private Integer durationMinutes = 30;

    @Column(name = "Status", nullable = false, length = 50)
    private String status = "Scheduled";

    @Column(name = "PatientCancellationReason", columnDefinition = "NVARCHAR(MAX)")
    private String patientCancellationReason;

    @Column(name = "DoctorCancellationReason", columnDefinition = "NVARCHAR(MAX)")
    private String doctorCancellationReason;

    @Column(name = "AppointmentNotes", columnDefinition = "NVARCHAR(MAX)")
    private String appointmentNotes;

    @Column(name = "CreatedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

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
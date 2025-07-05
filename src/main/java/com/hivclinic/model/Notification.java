package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "Notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "NotificationID")
    private Integer notificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DoctorUserID", nullable = false)
    private User doctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PatientUserID", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "AppointmentID")
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MedicationRoutineID")
    private MedicationRoutine medicationRoutine;

    @Column(name = "Type", nullable = false, length = 50)
    private String type;

    @Column(name = "Status", nullable = false, length = 20)
    private String status = "Sent";

    @Column(name = "Message", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;

    @Column(name = "Payload", columnDefinition = "NVARCHAR(MAX)")
    private String payload;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;

    @Column(name = "DeliveredAt")
    private LocalDateTime deliveredAt;

    @Column(name = "SeenAt")
    private LocalDateTime seenAt;

    @Column(name = "ReadAt")
    private LocalDateTime readAt;

    @Column(name = "RetractedAt")
    private LocalDateTime retractedAt;

    @Column(name = "RetractionReason", columnDefinition = "NVARCHAR(MAX)")
    private String retractionReason;

    @Column(name = "FailureReason", columnDefinition = "NVARCHAR(MAX)")
    private String failureReason;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}

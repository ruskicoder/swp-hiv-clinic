package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Appointment entity with improved date/time handling
 */
@Entity
@Table(name = "Appointments")
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

    public Appointment() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Integer appointmentId) {
        this.appointmentId = appointmentId;
    }

    public User getPatientUser() {
        return patientUser;
    }

    public void setPatientUser(User patientUser) {
        this.patientUser = patientUser;
    }

    public User getDoctorUser() {
        return doctorUser;
    }

    public void setDoctorUser(User doctorUser) {
        this.doctorUser = doctorUser;
    }

    public DoctorAvailabilitySlot getAvailabilitySlot() {
        return availabilitySlot;
    }

    public void setAvailabilitySlot(DoctorAvailabilitySlot availabilitySlot) {
        this.availabilitySlot = availabilitySlot;
    }

    public LocalDateTime getAppointmentDateTime() {
        return appointmentDateTime;
    }

    public void setAppointmentDateTime(LocalDateTime appointmentDateTime) {
        this.appointmentDateTime = appointmentDateTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPatientCancellationReason() {
        return patientCancellationReason;
    }

    public void setPatientCancellationReason(String reason) {
        this.patientCancellationReason = reason;
    }

    public String getDoctorCancellationReason() {
        return doctorCancellationReason;
    }

    public void setDoctorCancellationReason(String reason) {
        this.doctorCancellationReason = reason;
    }

    public String getAppointmentNotes() {
        return appointmentNotes;
    }

    public void setAppointmentNotes(String notes) {
        this.appointmentNotes = notes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
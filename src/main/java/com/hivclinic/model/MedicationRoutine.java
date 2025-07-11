package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

@Entity
@Table(name = "MedicationRoutines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationRoutine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer routineId;

    @Column(name = "PatientUserID", nullable = false)
    private Integer patientUserId;

    @Column(name = "DoctorUserID", nullable = false)
    private Integer doctorUserId;

    @Column(name = "ARVTreatmentID")
    private Integer arvTreatmentId;

    @Column(name = "MedicationName", nullable = false)
    private String medicationName;

    @Column(name = "Dosage", nullable = false, length = 100)
    private String dosage;

    @Column(name = "Instructions", columnDefinition = "NVARCHAR(MAX)")
    private String instructions;

    @Column(name = "StartDate", nullable = false)
    private LocalDate startDate;

    @Column(name = "EndDate")
    private LocalDate endDate;

    @Column(name = "TimeOfDay", nullable = false)
    private LocalTime timeOfDay;

    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;

    @Column(name = "ReminderEnabled", nullable = false)
    private Boolean reminderEnabled = true;

    @Column(name = "ReminderMinutesBefore")
    private Integer reminderMinutesBefore = 30;

    @Column(name = "LastReminderSentAt")
    private LocalDateTime lastReminderSentAt;

    @Column(name = "CreatedAt")
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt")
    private LocalDateTime updatedAt;

    // --- Explicit Getters and Setters for NotificationSchedulingService compatibility ---
    public Integer getRoutineId() { return routineId; }
    public void setRoutineId(Integer routineId) { this.routineId = routineId; }

    public Integer getPatientUserId() { return patientUserId; }
    public void setPatientUserId(Integer patientUserId) { this.patientUserId = patientUserId; }

    public Integer getDoctorUserId() { return doctorUserId; }
    public void setDoctorUserId(Integer doctorUserId) { this.doctorUserId = doctorUserId; }

    public Integer getArvTreatmentId() { return arvTreatmentId; }
    public void setArvTreatmentId(Integer arvTreatmentId) { this.arvTreatmentId = arvTreatmentId; }

    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }

    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }

    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public LocalTime getTimeOfDay() { return timeOfDay; }
    public void setTimeOfDay(LocalTime timeOfDay) { this.timeOfDay = timeOfDay; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getReminderEnabled() { return reminderEnabled; }
    public void setReminderEnabled(Boolean reminderEnabled) { this.reminderEnabled = reminderEnabled; }

    public Integer getReminderMinutesBefore() { return reminderMinutesBefore; }
    public void setReminderMinutesBefore(Integer reminderMinutesBefore) { this.reminderMinutesBefore = reminderMinutesBefore; }

    public LocalDateTime getLastReminderSentAt() { return lastReminderSentAt; }
    public void setLastReminderSentAt(LocalDateTime lastReminderSentAt) { this.lastReminderSentAt = lastReminderSentAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

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

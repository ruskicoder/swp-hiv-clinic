package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * PatientRecord entity for storing patient medical records
 */
@Entity
@Table(name = "PatientRecords")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RecordID")
    private Integer recordID;

    @Column(name = "PatientUserID", nullable = false)
    private Integer patientUserID;

    @Column(name = "AppointmentId")
    private Integer appointmentId;

    @Column(name = "MedicalHistory", columnDefinition = "NVARCHAR(MAX)")
    private String medicalHistory;

    @Column(name = "Allergies", columnDefinition = "NVARCHAR(MAX)")
    private String allergies;

    @Column(name = "CurrentMedications", columnDefinition = "NVARCHAR(MAX)")
    private String currentMedications;

    @Column(name = "Notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(name = "BloodType", length = 10)
    private String bloodType;

    @Column(name = "EmergencyContact")
    private String emergencyContact;

    @Column(name = "EmergencyPhone", length = 20)
    private String emergencyPhone;

    @Column(name = "ProfileImageBase64", columnDefinition = "NVARCHAR(MAX)")
    private String profileImageBase64;

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

    // Custom getter methods for compatibility
    public Integer getRecordID() {
        return recordID;
    }

    public void setRecordID(Integer recordID) {
        this.recordID = recordID;
    }
}
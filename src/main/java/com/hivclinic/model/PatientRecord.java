package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity representing a patient's medical record
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
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt")
    private LocalDateTime updatedAt;

    /**
     * Constructor with patient user ID
     */
    public PatientRecord(Integer patientUserID) {
        this.patientUserID = patientUserID;
        this.medicalHistory = "";
        this.allergies = "";
        this.currentMedications = "";
        this.notes = "";
        this.bloodType = "";
        this.emergencyContact = "";
        this.emergencyPhone = "";
    }

    /**
     * Set timestamps before persisting
     */
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    /**
     * Update timestamp before updating
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Integer getRecordId() {  // Changed from getRecordID() to getRecordId()
        return recordID;
    }

    public void setRecordId(Integer recordId) {  // Added setter
        this.recordID = recordId;
    }
}
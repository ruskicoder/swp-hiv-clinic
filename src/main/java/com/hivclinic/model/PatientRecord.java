package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * PatientRecord entity for storing patient medical records
 */
@Entity
@Table(name = "PatientRecords")
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

    // Constructors
    public PatientRecord() {}

    public PatientRecord(Integer recordID, Integer patientUserID, Integer appointmentId, String medicalHistory, String allergies, String currentMedications, String notes, String bloodType, String emergencyContact, String emergencyPhone, String profileImageBase64, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.recordID = recordID;
        this.patientUserID = patientUserID;
        this.appointmentId = appointmentId;
        this.medicalHistory = medicalHistory;
        this.allergies = allergies;
        this.currentMedications = currentMedications;
        this.notes = notes;
        this.bloodType = bloodType;
        this.emergencyContact = emergencyContact;
        this.emergencyPhone = emergencyPhone;
        this.profileImageBase64 = profileImageBase64;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and setters
    public Integer getRecordID() { return recordID; }
    public void setRecordID(Integer recordID) { this.recordID = recordID; }
    public Integer getPatientUserID() { return patientUserID; }
    public void setPatientUserID(Integer patientUserID) { this.patientUserID = patientUserID; }
    public Integer getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }
    public String getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    public String getCurrentMedications() { return currentMedications; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getBloodType() { return bloodType; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }
    public String getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public String getEmergencyPhone() { return emergencyPhone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }
    public String getProfileImageBase64() { return profileImageBase64; }
    public void setProfileImageBase64(String profileImageBase64) { this.profileImageBase64 = profileImageBase64; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
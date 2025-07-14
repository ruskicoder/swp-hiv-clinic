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

    // Getters
    public Integer getRecordID() { return recordID; }
    public Integer getPatientUserID() { return patientUserID; }
    public Integer getAppointmentId() { return appointmentId; }
    public String getMedicalHistory() { return medicalHistory; }
    public String getAllergies() { return allergies; }
    public String getCurrentMedications() { return currentMedications; }
    public String getNotes() { return notes; }
    public String getBloodType() { return bloodType; }
    public String getEmergencyContact() { return emergencyContact; }
    public String getEmergencyPhone() { return emergencyPhone; }
    public String getProfileImageBase64() { return profileImageBase64; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setRecordID(Integer recordID) { this.recordID = recordID; }
    public void setPatientUserID(Integer patientUserID) { this.patientUserID = patientUserID; }
    public void setAppointmentId(Integer appointmentId) { this.appointmentId = appointmentId; }
    public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }
    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }
    public void setProfileImageBase64(String profileImageBase64) { this.profileImageBase64 = profileImageBase64; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
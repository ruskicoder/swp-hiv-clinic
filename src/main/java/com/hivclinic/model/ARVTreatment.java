package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ARVTreatment entity for storing ARV treatment records
 */
@Entity
@Table(name = "ARVTreatments")
public class ARVTreatment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ARVTreatmentID")
    private Integer arvTreatmentID;
    @Column(name = "PatientUserID", nullable = false)
    private Integer patientUserID;
    @Column(name = "DoctorUserID")
    private Integer doctorUserID;
    @Column(name = "AppointmentID")
    private Integer appointmentID;
    @Column(name = "Regimen", nullable = false)
    private String regimen;
    @Column(name = "StartDate", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    @Column(name = "EndDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    @Column(name = "Adherence")
    private String adherence;
    @Column(name = "SideEffects", columnDefinition = "NVARCHAR(MAX)")
    private String sideEffects;
    @Column(name = "Notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;
    @Column(name = "IsActive")
    private Boolean isActive = true;
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
    public ARVTreatment() {}
    public ARVTreatment(Integer arvTreatmentID, Integer patientUserID, Integer doctorUserID, Integer appointmentID, String regimen, LocalDate startDate, LocalDate endDate, String adherence, String sideEffects, String notes, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.arvTreatmentID = arvTreatmentID;
        this.patientUserID = patientUserID;
        this.doctorUserID = doctorUserID;
        this.appointmentID = appointmentID;
        this.regimen = regimen;
        this.startDate = startDate;
        this.endDate = endDate;
        this.adherence = adherence;
        this.sideEffects = sideEffects;
        this.notes = notes;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters and setters
    public Integer getArvTreatmentID() { return arvTreatmentID; }
    public void setArvTreatmentID(Integer arvTreatmentID) { this.arvTreatmentID = arvTreatmentID; }
    public Integer getPatientUserID() { return patientUserID; }
    public void setPatientUserID(Integer patientUserID) { this.patientUserID = patientUserID; }
    public Integer getDoctorUserID() { return doctorUserID; }
    public void setDoctorUserID(Integer doctorUserID) { this.doctorUserID = doctorUserID; }
    public Integer getAppointmentID() { return appointmentID; }
    public void setAppointmentID(Integer appointmentID) { this.appointmentID = appointmentID; }
    public String getRegimen() { return regimen; }
    public void setRegimen(String regimen) { this.regimen = regimen; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getAdherence() { return adherence; }
    public void setAdherence(String adherence) { this.adherence = adherence; }
    public String getSideEffects() { return sideEffects; }
    public void setSideEffects(String sideEffects) { this.sideEffects = sideEffects; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
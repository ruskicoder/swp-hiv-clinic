package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ARVTreatment entity for storing ARV treatment records
 */
@Entity
@Table(name = "ARVTreatments")
@Data
@NoArgsConstructor
@AllArgsConstructor
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

    // Getters
    public Integer getArvTreatmentID() { return arvTreatmentID; }
    public Integer getPatientUserID() { return patientUserID; }
    public Integer getDoctorUserID() { return doctorUserID; }
    public Integer getAppointmentID() { return appointmentID; }
    public String getRegimen() { return regimen; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getAdherence() { return adherence; }
    public String getSideEffects() { return sideEffects; }
    public String getNotes() { return notes; }
    public Boolean getIsActive() { return isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setArvTreatmentID(Integer arvTreatmentID) { this.arvTreatmentID = arvTreatmentID; }
    public void setPatientUserID(Integer patientUserID) { this.patientUserID = patientUserID; }
    public void setDoctorUserID(Integer doctorUserID) { this.doctorUserID = doctorUserID; }
    public void setAppointmentID(Integer appointmentID) { this.appointmentID = appointmentID; }
    public void setRegimen(String regimen) { this.regimen = regimen; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setAdherence(String adherence) { this.adherence = adherence; }
    public void setSideEffects(String sideEffects) { this.sideEffects = sideEffects; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
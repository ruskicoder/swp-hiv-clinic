package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * ARVTreatment entity for storing ARV treatment records.
 * Maps to the ARVTreatments table in the database.
 */
@Entity
@Table(name = "ARVTreatments") // Table name must match schema: ARVTreatments
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

    @Column(name = "DoctorUserID", nullable = false)
    private Integer doctorUserID;

    @Column(name = "StartDate", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @Column(name = "EndDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    @Column(name = "DrugName", nullable = false, length = 100)
    private String drugName;

    @Column(name = "DrugQuantity", nullable = false)
    private Integer drugQuantity;

    @Column(name = "Notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(name = "CreatedAt", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @Column(name = "Regimen", length = 200)
    private String regimen;

    @Column(name = "Adherence")
    private String adherence;

    @Column(name = "SideEffects", columnDefinition = "NVARCHAR(MAX)")
    private String sideEffects;

    @Column(name = "AppointmentID")
    private Integer appointmentID;

    @Column(name = "IsActive")
    private Boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters
    public Integer getArvTreatmentID() { return arvTreatmentID; }
    public Integer getPatientUserID() { return patientUserID; }
    public Integer getDoctorUserID() { return doctorUserID; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getDrugName() { return drugName; }
    public Integer getDrugQuantity() { return drugQuantity; }
    public String getNotes() { return notes != null ? notes : ""; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getRegimen() { return regimen != null ? regimen : ""; }
    public String getAdherence() { return adherence != null ? adherence : ""; }
    public String getSideEffects() { return sideEffects != null ? sideEffects : ""; }
    public Integer getAppointmentID() { return appointmentID; }
    public Boolean getIsActive() { return isActive != null ? isActive : true; }

    // Setters
    public void setArvTreatmentID(Integer id) { this.arvTreatmentID = id; }
    public void setPatientUserID(Integer id) { this.patientUserID = id; }
    public void setDoctorUserID(Integer id) { this.doctorUserID = id; }
    public void setStartDate(LocalDate date) { this.startDate = date; }
    public void setEndDate(LocalDate date) { this.endDate = date; }
    public void setDrugName(String name) { this.drugName = name; }
    public void setDrugQuantity(Integer quantity) { this.drugQuantity = quantity; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCreatedAt(LocalDateTime date) { this.createdAt = date; }
    public void setUpdatedAt(LocalDateTime date) { this.updatedAt = date; }
    public void setRegimen(String regimen) { this.regimen = regimen; }
    public void setAdherence(String adherence) { this.adherence = adherence; }
    public void setSideEffects(String sideEffects) { this.sideEffects = sideEffects; }
    public void setAppointmentID(Integer appointmentID) { this.appointmentID = appointmentID; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive != null ? isActive : true; }
}
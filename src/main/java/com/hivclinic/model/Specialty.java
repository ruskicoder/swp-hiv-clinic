package com.hivclinic.model;

import jakarta.persistence.*;

/**
 * Entity representing medical specialties
 */
@Entity
@Table(name = "Specialties")
public class Specialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SpecialtyID")
    private Integer specialtyId;

    @Column(name = "SpecialtyName", nullable = false, unique = true, length = 255)
    private String specialtyName;

    @Column(name = "Description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "IsActive", columnDefinition = "BIT DEFAULT 1")
    private Boolean isActive = true;

    // Getters
    public Integer getSpecialtyId() { return specialtyId; }
    public String getSpecialtyName() { return specialtyName; }
    public String getDescription() { return description; }
    public Boolean getIsActive() { return isActive; }

    // Setters
    public void setSpecialtyId(Integer specialtyId) { this.specialtyId = specialtyId; }
    public void setSpecialtyName(String specialtyName) { this.specialtyName = specialtyName; }
    public void setDescription(String description) { this.description = description; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
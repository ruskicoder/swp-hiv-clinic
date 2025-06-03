package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing medical specialties
 */
@Entity
@Table(name = "Specialties")
@Data
@NoArgsConstructor
@AllArgsConstructor
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
}
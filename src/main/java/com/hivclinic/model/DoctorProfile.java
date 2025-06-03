package com.hivclinic.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity representing doctor profiles
 */
@Entity
@Table(name = "DoctorProfiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "DoctorProfileID")
    private Integer doctorProfileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false, unique = true)
    private User user;

    @Column(name = "FirstName", nullable = false, length = 100)
    private String firstName;

    @Column(name = "LastName", nullable = false, length = 100)
    private String lastName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "SpecialtyID", nullable = true)
    private Specialty specialty;

    @Column(name = "PhoneNumber", length = 20)
    private String phoneNumber;

    @Column(name = "Bio", columnDefinition = "NVARCHAR(MAX)")
    private String bio;

    @Lob
    @Column(name = "ProfileImageBase64", columnDefinition = "NVARCHAR(MAX)")
    private String profileImageBase64;
}
package com.hivclinic.model;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * Entity representing patient profiles
 */
@Entity
@Table(name = "PatientProfiles")
public class PatientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "PatientProfileID")
    private Integer patientProfileId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "UserID", nullable = false, unique = true)
    private User user;

    @Column(name = "FirstName", nullable = false, length = 100)
    private String firstName;

    @Column(name = "LastName", nullable = false, length = 100)
    private String lastName;

    @Column(name = "DateOfBirth")
    private LocalDate dateOfBirth;

    @Column(name = "PhoneNumber", length = 20)
    private String phoneNumber;

    @Column(name = "Address", columnDefinition = "NVARCHAR(MAX)")
    private String address;

    @Lob
    @Column(name = "ProfileImageBase64", columnDefinition = "NVARCHAR(MAX)")
    private String profileImageBase64;

    @Column(name = "IsPrivate", nullable = false)
    private boolean isPrivate = false;

    // Add explicit getters and setters for all fields
    public Integer getPatientProfileId() { return patientProfileId; }
    public void setPatientProfileId(Integer id) { this.patientProfileId = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public java.time.LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(java.time.LocalDate dob) { this.dateOfBirth = dob; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getProfileImageBase64() { return profileImageBase64; }
    public void setProfileImageBase64(String img) { this.profileImageBase64 = img; }
    public boolean getIsPrivate() { return isPrivate; }
    public void setIsPrivate(boolean isPrivate) { this.isPrivate = isPrivate; }
}
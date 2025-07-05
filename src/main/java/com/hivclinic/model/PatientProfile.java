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

    @Column(name = "PhoneNumber", length = 20)
    private String phoneNumber;

    @Column(name = "DateOfBirth")
    private LocalDate dateOfBirth;

    @Column(name = "Address", columnDefinition = "NVARCHAR(MAX)")
    private String address;

    @Column(name = "Gender", length = 10)
    private String gender;

    @Lob
    @Column(name = "ProfileImageBase64", columnDefinition = "NVARCHAR(MAX)")
    private String profileImageBase64;

    @Column(name = "IsPrivate", nullable = false)
    private Boolean isPrivate = false;

    @Column(name = "PreferredChannel", length = 20)
    private String preferredChannel;

    // Getters
    public Integer getPatientProfileId() { return patientProfileId; }
    public User getUser() { return user; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public String getAddress() { return address; }
    public String getGender() { return gender; }
    public String getProfileImageBase64() { return profileImageBase64; }
    public Boolean isPrivate() { return isPrivate; }
    public Boolean getIsPrivate() { return isPrivate; }
    public String getPreferredChannel() { return preferredChannel; }

    // Setters
    public void setPatientProfileId(Integer id) { this.patientProfileId = id; }
    public void setUser(User user) { this.user = user; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public void setAddress(String address) { this.address = address; }
    public void setGender(String gender) { this.gender = gender; }
    public void setProfileImageBase64(String profileImageBase64) { this.profileImageBase64 = profileImageBase64; }
    public void setIsPrivate(Boolean isPrivate) { this.isPrivate = isPrivate; }
    public void setPrivate(Boolean isPrivate) { this.isPrivate = isPrivate; }  // Added method to match service usage
    public void setPreferredChannel(String preferredChannel) { this.preferredChannel = preferredChannel; }
}
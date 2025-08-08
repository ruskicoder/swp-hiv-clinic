package com.hivclinic.model;

import jakarta.persistence.*;

/**
 * Entity representing doctor profiles
 */
@Entity
@Table(name = "DoctorProfiles")
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

    @Enumerated(EnumType.STRING)
    @Column(name = "Gender", length = 20)
    private Gender gender;

    @Lob
    @Column(name = "ProfileImageBase64", columnDefinition = "NVARCHAR(MAX)")
    private String profileImageBase64;

    // Getters
    public Integer getDoctorProfileId() { return doctorProfileId; }
    public User getUser() { return user; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public Specialty getSpecialty() { return specialty; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getBio() { return bio; }
    public Gender getGender() { return gender; }
    public String getProfileImageBase64() { return profileImageBase64; }

    // Setters
    public void setDoctorProfileId(Integer id) { this.doctorProfileId = id; }
    public void setUser(User user) { this.user = user; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setSpecialty(Specialty specialty) { this.specialty = specialty; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setBio(String bio) { this.bio = bio; }
    public void setGender(Gender gender) { this.gender = gender; }
    
    // Helper method for string conversion (for compatibility)
    public void setGenderFromString(String genderString) {
        this.gender = Gender.fromString(genderString);
    }
    
    // Helper method for string conversion (for compatibility)
    public String getGenderAsString() {
        return gender != null ? gender.getDisplayName() : null;
    }
    public void setProfileImageBase64(String profileImageBase64) { this.profileImageBase64 = profileImageBase64; }
    public void setSpecialty(Object specialty2) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setSpecialty'");
    }
}
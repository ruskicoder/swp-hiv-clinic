package com.hivclinic.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO for user profile responses
 */
public class UserProfileResponse {
    // User basic information
    private Integer userId;
    private String username;
    private String email;
    private String role;
    private Boolean isActive;
    private LocalDateTime createdAt;

    // Profile information (varies based on role)
    private String firstName;
    private String lastName;
    private String phoneNumber;
    
    // Patient-specific fields
    private LocalDate dateOfBirth;
    private String address;
    
    // Doctor-specific fields
    private String specialty;
    private String bio;
    
    // Profile image (Base64 string)
    private String profileImageBase64;

    // No-args constructor
    public UserProfileResponse() {}

    // Constructor for basic user info (common fields)
    public UserProfileResponse(Integer userId, String username, String email, String role, 
                              Boolean isActive, LocalDateTime createdAt, String firstName, 
                              String lastName, String phoneNumber) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
    }

    // Constructor for all fields (Patient or Doctor)
    public UserProfileResponse(Integer userId, String username, String email, String role,
                              Boolean isActive, LocalDateTime createdAt, String firstName,
                              String lastName, String phoneNumber, LocalDate dateOfBirth,
                              String address, String specialty, String bio, String profileImageBase64) {
        this.userId = userId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.dateOfBirth = dateOfBirth;
        this.address = address;
        this.specialty = specialty;
        this.bio = bio;
        this.profileImageBase64 = profileImageBase64;
    }

    // Getters and setters
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getProfileImageBase64() { return profileImageBase64; }
    public void setProfileImageBase64(String profileImageBase64) { this.profileImageBase64 = profileImageBase64; }
}
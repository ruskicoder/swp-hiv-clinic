package com.hivclinic.dto.response;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
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
}
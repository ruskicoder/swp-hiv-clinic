package com.hivclinic.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for change password requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    @Size(min = 6, max = 100, message = "New password must be between 6 and 100 characters")
    private String newPassword;

    // Getters
    public String getCurrentPassword() { return currentPassword; }
    public String getNewPassword() { return newPassword; }

    // Setters
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
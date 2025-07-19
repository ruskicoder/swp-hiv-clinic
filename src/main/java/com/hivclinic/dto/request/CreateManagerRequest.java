package com.hivclinic.dto.request;

// Bạn có thể thêm các annotation validation nếu muốn
// import jakarta.validation.constraints.NotBlank;
// import jakarta.validation.constraints.Email;

public class CreateManagerRequest {

    // @NotBlank // Ví dụ validation
    private String username;

    // @NotBlank
    // @Email
    private String email;

    // @NotBlank
    private String password;

    // @NotBlank
    private String firstName;

    // @NotBlank
    private String lastName;

    // --- Bắt buộc phải có Getters và Setters để Jackson (thư viện JSON) hoạt động ---

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}
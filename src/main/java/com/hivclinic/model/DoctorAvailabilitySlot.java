package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DoctorAvailabilitySlot entity for managing doctor availability
 */
@Entity
@Table(name = "DoctorAvailabilitySlots")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorAvailabilitySlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "AvailabilitySlotID")
    private Integer availabilitySlotId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DoctorUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User doctorUser;

    @Column(name = "SlotDate", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate slotDate;

    @Column(name = "StartTime", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    @Temporal(TemporalType.TIME)
    private LocalTime startTime;

    @Column(name = "EndTime", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    @Temporal(TemporalType.TIME)
    private LocalTime endTime;

    @Column(name = "IsBooked")
    private Boolean isBooked = false;

    @Column(name = "Notes", columnDefinition = "NVARCHAR(MAX)")
    private String notes;

    @Column(name = "CreatedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    // Transient field for safe appointment details
    @Transient
    private Appointment appointment;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters
    public Integer getAvailabilitySlotId() { return availabilitySlotId; }
    public User getDoctorUser() { return doctorUser; }
    public LocalDate getSlotDate() { return slotDate; }
    public LocalTime getStartTime() { return startTime; }
    public LocalTime getEndTime() { return endTime; }
    public Boolean getIsBooked() { return isBooked; }
    public String getNotes() { return notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Appointment getAppointment() { return appointment; }

    // Setters
    public void setAvailabilitySlotId(Integer availabilitySlotId) { this.availabilitySlotId = availabilitySlotId; }
    public void setDoctorUser(User doctorUser) { this.doctorUser = doctorUser; }
    public void setSlotDate(LocalDate slotDate) { this.slotDate = slotDate; }
    public void setStartTime(LocalTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalTime endTime) { this.endTime = endTime; }
    public void setIsBooked(Boolean isBooked) { this.isBooked = isBooked; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setAppointment(Appointment appointment) { this.appointment = appointment; }
}
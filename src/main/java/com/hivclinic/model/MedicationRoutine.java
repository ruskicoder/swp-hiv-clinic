package com.hivclinic.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "MedicationRoutines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationRoutine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RoutineID")
    private Integer routineId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "PatientUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User patientUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "DoctorUserID", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private User doctorUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ARVTreatmentID")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ARVTreatment arvTreatment;

    @NotBlank(message = "Medication name is required")
    @Size(max = 255, message = "Medication name must not exceed 255 characters")
    @Column(name = "MedicationName", nullable = false, length = 255)
    private String medicationName;

    @NotBlank(message = "Dosage is required")
    @Size(max = 100, message = "Dosage must not exceed 100 characters")
    @Column(name = "Dosage", nullable = false, length = 100)
    private String dosage;

    @Column(name = "Instructions", columnDefinition = "NVARCHAR(MAX)")
    private String instructions;

    @NotNull(message = "Start date is required")
    @Column(name = "StartDate", nullable = false)
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @Column(name = "EndDate")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    @NotNull(message = "Frequency type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "FrequencyType", nullable = false, length = 20)
    private FrequencyType frequencyType = FrequencyType.DAILY;

    @NotNull(message = "Time of day is required")
    @Column(name = "TimeOfDay", nullable = false)
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime timeOfDay;

    @Column(name = "SecondaryTimes", length = 500)
    private String secondaryTimes; // JSON array of additional times

    @Column(name = "WeekDays", length = 20)
    private String weekDays; // Comma-separated days (Mon,Wed,Fri)

    @Column(name = "MonthDays", length = 100)
    private String monthDays; // Comma-separated days (1,15,30)

    @Column(name = "IsActive", nullable = false)
    private Boolean isActive = true;

    @Column(name = "ReminderEnabled", nullable = false)
    private Boolean reminderEnabled = true;

    @Min(value = 0, message = "Reminder minutes before must be non-negative")
    @Column(name = "ReminderMinutesBefore")
    private Integer reminderMinutesBefore = 30;

    @Column(name = "LastReminderSentAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastReminderSentAt;

    @Column(name = "NextReminderDue")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime nextReminderDue;

    @Enumerated(EnumType.STRING)
    @Column(name = "MedicationCategory", length = 100)
    private MedicationCategory medicationCategory;

    @Column(name = "SideEffectsToMonitor", columnDefinition = "NVARCHAR(MAX)")
    private String sideEffectsToMonitor;

    @Enumerated(EnumType.STRING)
    @Column(name = "FoodRequirement", length = 50)
    private FoodRequirement foodRequirement;

    @Column(name = "CreatedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @Column(name = "UpdatedAt")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Convenience methods for compatibility with existing services
    public Integer getDoctorUserId() {
        return doctorUser != null ? doctorUser.getUserId() : null;
    }

    public Integer getPatientUserId() {
        return patientUser != null ? patientUser.getUserId() : null;
    }

    public Integer getARVTreatmentId() {
        return arvTreatment != null ? arvTreatment.getArvTreatmentID() : null;
    }

    // Convenience setter methods for compatibility with existing services
    public void setPatientUserId(Integer patientUserId) {
        // This method is for compatibility - actual User object should be set via setPatientUser()
        // The service layer should handle the User object assignment
        if (patientUserId != null) {
            User user = new User();
            user.setUserId(patientUserId);
            this.patientUser = user;
        }
    }

    public void setDoctorUserId(Integer doctorUserId) {
        // This method is for compatibility - actual User object should be set via setDoctorUser()
        // The service layer should handle the User object assignment
        if (doctorUserId != null) {
            User user = new User();
            user.setUserId(doctorUserId);
            this.doctorUser = user;
        }
    }

    public void setARVTreatmentId(Integer arvTreatmentId) {
        // This method is for compatibility - actual ARVTreatment object should be set via setArvTreatment()
        // The service layer should handle the ARVTreatment object assignment
        if (arvTreatmentId != null) {
            ARVTreatment treatment = new ARVTreatment();
            treatment.setArvTreatmentID(arvTreatmentId);
            this.arvTreatment = treatment;
        }
    }

    // Enum definitions
    public enum FrequencyType {
        DAILY("Daily"),
        WEEKLY("Weekly"),
        MONTHLY("Monthly"),
        AS_NEEDED("As-Needed");

        private final String displayName;

        FrequencyType(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum MedicationCategory {
        ARV("ARV"),
        SUPPLEMENT("Supplement"),
        PAIN_MANAGEMENT("Pain Management"),
        ANTIBIOTIC("Antibiotic"),
        ANTIVIRAL("Antiviral"),
        IMMUNE_SUPPORT("Immune Support"),
        OTHER("Other");

        private final String displayName;

        MedicationCategory(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    public enum FoodRequirement {
        WITH_FOOD("With Food"),
        EMPTY_STOMACH("Empty Stomach"),
        NO_RESTRICTION("No Restriction");

        private final String displayName;

        FoodRequirement(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }
}

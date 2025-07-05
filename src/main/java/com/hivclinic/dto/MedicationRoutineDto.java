package com.hivclinic.dto;

import com.hivclinic.model.MedicationRoutine;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationRoutineDto {

    private Integer routineId;
    private Integer patientUserId;
    private String patientName;
    private Integer doctorUserId;
    private String doctorName;
    private Integer arvTreatmentId;
    private String medicationName;
    private String dosage;
    private String instructions;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate startDate;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate endDate;
    
    private String frequencyType;
    private String frequencyTypeDisplayName;
    
    @JsonFormat(pattern = "HH:mm:ss")
    private LocalTime timeOfDay;
    
    private String secondaryTimes;
    private String weekDays;
    private String monthDays;
    private Boolean isActive;
    private Boolean reminderEnabled;
    private Integer reminderMinutesBefore;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastReminderSentAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime nextReminderDue;
    
    private String medicationCategory;
    private String medicationCategoryDisplayName;
    private String sideEffectsToMonitor;
    private String foodRequirement;
    private String foodRequirementDisplayName;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;

    public static MedicationRoutineDto fromEntity(MedicationRoutine routine) {
        MedicationRoutineDto dto = new MedicationRoutineDto();
        dto.setRoutineId(routine.getRoutineId());
        dto.setPatientUserId(routine.getPatientUserId());
        dto.setDoctorUserId(routine.getDoctorUserId());
        dto.setArvTreatmentId(routine.getARVTreatmentId());
        dto.setMedicationName(routine.getMedicationName());
        dto.setDosage(routine.getDosage());
        dto.setInstructions(routine.getInstructions());
        dto.setStartDate(routine.getStartDate());
        dto.setEndDate(routine.getEndDate());
        dto.setTimeOfDay(routine.getTimeOfDay());
        dto.setSecondaryTimes(routine.getSecondaryTimes());
        dto.setWeekDays(routine.getWeekDays());
        dto.setMonthDays(routine.getMonthDays());
        dto.setIsActive(routine.getIsActive());
        dto.setReminderEnabled(routine.getReminderEnabled());
        dto.setReminderMinutesBefore(routine.getReminderMinutesBefore());
        dto.setLastReminderSentAt(routine.getLastReminderSentAt());
        dto.setNextReminderDue(routine.getNextReminderDue());
        dto.setSideEffectsToMonitor(routine.getSideEffectsToMonitor());
        dto.setCreatedAt(routine.getCreatedAt());
        dto.setUpdatedAt(routine.getUpdatedAt());

        // Set frequency type and display name
        if (routine.getFrequencyType() != null) {
            dto.setFrequencyType(routine.getFrequencyType().name());
            dto.setFrequencyTypeDisplayName(routine.getFrequencyType().getDisplayName());
        }

        // Set medication category and display name
        if (routine.getMedicationCategory() != null) {
            dto.setMedicationCategory(routine.getMedicationCategory().name());
            dto.setMedicationCategoryDisplayName(routine.getMedicationCategory().getDisplayName());
        }

        // Set food requirement and display name
        if (routine.getFoodRequirement() != null) {
            dto.setFoodRequirement(routine.getFoodRequirement().name());
            dto.setFoodRequirementDisplayName(routine.getFoodRequirement().getDisplayName());
        }

        // Set patient and doctor names if available
        if (routine.getPatientUser() != null) {
            dto.setPatientName(routine.getPatientUser().getFirstName() + " " + routine.getPatientUser().getLastName());
        }
        if (routine.getDoctorUser() != null) {
            dto.setDoctorName(routine.getDoctorUser().getFirstName() + " " + routine.getDoctorUser().getLastName());
        }

        return dto;
    }

    public MedicationRoutine toEntity() {
        MedicationRoutine routine = new MedicationRoutine();
        routine.setRoutineId(this.routineId);
        routine.setMedicationName(this.medicationName);
        routine.setDosage(this.dosage);
        routine.setInstructions(this.instructions);
        routine.setStartDate(this.startDate);
        routine.setEndDate(this.endDate);
        routine.setTimeOfDay(this.timeOfDay);
        routine.setSecondaryTimes(this.secondaryTimes);
        routine.setWeekDays(this.weekDays);
        routine.setMonthDays(this.monthDays);
        routine.setIsActive(this.isActive);
        routine.setReminderEnabled(this.reminderEnabled);
        routine.setReminderMinutesBefore(this.reminderMinutesBefore);
        routine.setLastReminderSentAt(this.lastReminderSentAt);
        routine.setNextReminderDue(this.nextReminderDue);
        routine.setSideEffectsToMonitor(this.sideEffectsToMonitor);
        routine.setCreatedAt(this.createdAt);
        routine.setUpdatedAt(this.updatedAt);

        // Set enum values
        if (this.frequencyType != null) {
            routine.setFrequencyType(MedicationRoutine.FrequencyType.valueOf(this.frequencyType));
        }
        if (this.medicationCategory != null) {
            routine.setMedicationCategory(MedicationRoutine.MedicationCategory.valueOf(this.medicationCategory));
        }
        if (this.foodRequirement != null) {
            routine.setFoodRequirement(MedicationRoutine.FoodRequirement.valueOf(this.foodRequirement));
        }

        // Note: User and ARVTreatment objects should be set by the service layer
        // using the provided IDs
        return routine;
    }
}

package com.hivclinic.dto;

import com.hivclinic.model.MedicationRoutine;
// Removed unused Lombok imports

import java.time.LocalDate;
import java.time.LocalTime;

public class MedicationRoutineDto {
    private Integer routineId;
    private Integer patientUserId;
    private Integer doctorUserId;
    private Integer arvTreatmentId;
    private String medicationName;
    private String dosage;
    private String instructions;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime timeOfDay;
    private Boolean isActive;
    private Boolean reminderEnabled;

    public MedicationRoutineDto() {}

    public MedicationRoutineDto(Integer routineId, Integer patientUserId, Integer doctorUserId, Integer arvTreatmentId, String medicationName, String dosage, String instructions, LocalDate startDate, LocalDate endDate, LocalTime timeOfDay, Boolean isActive, Boolean reminderEnabled) {
        this.routineId = routineId;
        this.patientUserId = patientUserId;
        this.doctorUserId = doctorUserId;
        this.arvTreatmentId = arvTreatmentId;
        this.medicationName = medicationName;
        this.dosage = dosage;
        this.instructions = instructions;
        this.startDate = startDate;
        this.endDate = endDate;
        this.timeOfDay = timeOfDay;
        this.isActive = isActive;
        this.reminderEnabled = reminderEnabled;
    }

    public Integer getRoutineId() { return routineId; }
    public void setRoutineId(Integer routineId) { this.routineId = routineId; }
    public Integer getPatientUserId() { return patientUserId; }
    public void setPatientUserId(Integer patientUserId) { this.patientUserId = patientUserId; }
    public Integer getDoctorUserId() { return doctorUserId; }
    public void setDoctorUserId(Integer doctorUserId) { this.doctorUserId = doctorUserId; }
    public Integer getArvTreatmentId() { return arvTreatmentId; }
    public void setArvTreatmentId(Integer arvTreatmentId) { this.arvTreatmentId = arvTreatmentId; }
    public String getMedicationName() { return medicationName; }
    public void setMedicationName(String medicationName) { this.medicationName = medicationName; }
    public String getDosage() { return dosage; }
    public void setDosage(String dosage) { this.dosage = dosage; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String instructions) { this.instructions = instructions; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public LocalTime getTimeOfDay() { return timeOfDay; }
    public void setTimeOfDay(LocalTime timeOfDay) { this.timeOfDay = timeOfDay; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public Boolean getReminderEnabled() { return reminderEnabled; }
    public void setReminderEnabled(Boolean reminderEnabled) { this.reminderEnabled = reminderEnabled; }

    public static MedicationRoutineDto fromEntity(MedicationRoutine routine) {
        return new MedicationRoutineDto(
                routine.getRoutineId(),
                routine.getPatientUserId(),
                routine.getDoctorUserId(),
                routine.getArvTreatmentId(),
                routine.getMedicationName(),
                routine.getDosage(),
                routine.getInstructions(),
                routine.getStartDate(),
                routine.getEndDate(),
                routine.getTimeOfDay(),
                routine.getIsActive(),
                routine.getReminderEnabled()
        );
    }
}

package com.hivclinic.dto;

import com.hivclinic.model.MedicationRoutine;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicationRoutineDto {
    private Integer routineId;
    private Integer patientUserId;
    private Integer doctorUserId;
    private String medicationName;
    private String dosage;
    private String instructions;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalTime timeOfDay;
    private Boolean isActive;
    private Boolean reminderEnabled;

    public static MedicationRoutineDto fromEntity(MedicationRoutine routine) {
        return new MedicationRoutineDto(
                routine.getRoutineId(),
                routine.getPatientUserId(),
                routine.getDoctorUserId(),
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

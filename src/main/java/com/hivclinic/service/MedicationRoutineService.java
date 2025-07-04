package com.hivclinic.service;

import com.hivclinic.dto.MedicationRoutineDto;
import com.hivclinic.model.MedicationRoutine;
import com.hivclinic.repository.MedicationRoutineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicationRoutineService {

    @Autowired
    private MedicationRoutineRepository medicationRoutineRepository;

    @Autowired
    private NotificationService notificationService;

    public List<MedicationRoutineDto> getAllMedicationRoutines() {
        return medicationRoutineRepository.findAll().stream()
                .map(MedicationRoutineDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public MedicationRoutineDto createMedicationRoutine(MedicationRoutineDto routineDto) {
        MedicationRoutine routine = new MedicationRoutine();
        routine.setPatientUserId(routineDto.getPatientUserId());
        routine.setDoctorUserId(routineDto.getDoctorUserId());
        routine.setMedicationName(routineDto.getMedicationName());
        routine.setDosage(routineDto.getDosage());
        routine.setInstructions(routineDto.getInstructions());
        routine.setStartDate(routineDto.getStartDate());
        routine.setEndDate(routineDto.getEndDate());
        routine.setTimeOfDay(routineDto.getTimeOfDay());
        routine.setIsActive(routineDto.getIsActive());
        routine.setReminderEnabled(routineDto.getReminderEnabled());
        MedicationRoutine savedRoutine = medicationRoutineRepository.save(routine);
        return MedicationRoutineDto.fromEntity(savedRoutine);
    }

    @Transactional
    public MedicationRoutineDto updateMedicationRoutine(Integer routineId, MedicationRoutineDto routineDto) {
        return medicationRoutineRepository.findById(routineId)
                .map(routine -> {
                    routine.setPatientUserId(routineDto.getPatientUserId());
                    routine.setDoctorUserId(routineDto.getDoctorUserId());
                    routine.setMedicationName(routineDto.getMedicationName());
                    routine.setDosage(routineDto.getDosage());
                    routine.setInstructions(routineDto.getInstructions());
                    routine.setStartDate(routineDto.getStartDate());
                    routine.setEndDate(routineDto.getEndDate());
                    routine.setTimeOfDay(routineDto.getTimeOfDay());
                    routine.setIsActive(routineDto.getIsActive());
                    routine.setReminderEnabled(routineDto.getReminderEnabled());
                    MedicationRoutine updatedRoutine = medicationRoutineRepository.save(routine);
                    return MedicationRoutineDto.fromEntity(updatedRoutine);
                }).orElse(null);
    }

    @Transactional
    public void sendMedicationReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<MedicationRoutine> routines = medicationRoutineRepository.findByIsActiveTrueAndTimeOfDayBetween(now.toLocalTime(), now.toLocalTime().plusMinutes(1));
        for (MedicationRoutine routine : routines) {
            if (routine.getLastReminderSentAt() == null || routine.getLastReminderSentAt().toLocalDate().isBefore(now.toLocalDate())) {
                notificationService.createMedicationReminder(
                        routine.getPatientUserId(),
                        routine.getRoutineId(),
                        routine.getMedicationName(),
                        routine.getDosage()
                );
                routine.setLastReminderSentAt(now);
                medicationRoutineRepository.save(routine);
            }
        }
    }
}

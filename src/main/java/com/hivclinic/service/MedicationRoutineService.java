package com.hivclinic.service;

import com.hivclinic.dto.MedicationRoutineDto;
import com.hivclinic.model.ARVTreatment;
import com.hivclinic.model.MedicationRoutine;
import com.hivclinic.repository.ARVTreatmentRepository;
import com.hivclinic.repository.MedicationRoutineRepository;
import com.hivclinic.repository.UserRepository;
import com.hivclinic.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MedicationRoutineService {
    
    private static final Logger logger = LoggerFactory.getLogger(MedicationRoutineService.class);

    @Autowired
    private MedicationRoutineRepository medicationRoutineRepository;
    
    @Autowired
    private ARVTreatmentRepository arvTreatmentRepository;

    /**
     * ENHANCED CRUD OPERATIONS - Get all medication routines
     */
    public List<MedicationRoutineDto> getAllMedicationRoutines() {
        return medicationRoutineRepository.findAll().stream()
                .map(MedicationRoutineDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Get medication routine by ID
     */
    public Optional<MedicationRoutineDto> getMedicationRoutineById(Integer routineId) {
        return medicationRoutineRepository.findById(routineId)
                .map(MedicationRoutineDto::fromEntity);
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Get medication routines by patient
     */
    public List<MedicationRoutineDto> getMedicationRoutinesByPatient(Integer patientUserId) {
        return medicationRoutineRepository.findByPatientUserUserIdOrderByCreatedAtDesc(patientUserId).stream()
                .map(MedicationRoutineDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Get active medication routines by patient
     */
    public List<MedicationRoutineDto> getActiveMedicationRoutinesByPatient(Integer patientUserId) {
        return medicationRoutineRepository.findByPatientUserUserIdAndIsActiveTrue(patientUserId).stream()
                .map(MedicationRoutineDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Get medication routines by doctor
     */
    public List<MedicationRoutineDto> getMedicationRoutinesByDoctor(Integer doctorUserId) {
        return medicationRoutineRepository.findByDoctorUserUserIdOrderByCreatedAtDesc(doctorUserId).stream()
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
    
    /**
     * ENHANCED CRUD OPERATIONS - Delete medication routine
     */
    @Transactional
    public void deleteMedicationRoutine(Integer routineId) {
        MedicationRoutine routine = medicationRoutineRepository.findById(routineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication routine not found"));
        medicationRoutineRepository.delete(routine);
        logger.info("Deleted medication routine with ID: {}", routineId);
    }
    
    /**
     * ARV TREATMENT INTEGRATION - Link medication routine to ARV treatment
     */
    @Transactional
    public MedicationRoutineDto linkToARVTreatment(Integer routineId, Integer arvTreatmentId) {
        MedicationRoutine routine = medicationRoutineRepository.findById(routineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication routine not found"));
        
        ARVTreatment arvTreatment = arvTreatmentRepository.findById(arvTreatmentId)
                .orElseThrow(() -> new ResourceNotFoundException("ARV treatment not found"));
        
        routine.setArvTreatment(arvTreatment);
        MedicationRoutine savedRoutine = medicationRoutineRepository.save(routine);
        
        logger.info("Linked medication routine {} to ARV treatment {}", routineId, arvTreatmentId);
        return MedicationRoutineDto.fromEntity(savedRoutine);
    }
    
    /**
     * ARV TREATMENT INTEGRATION - Get medication routines by ARV treatment
     */
    public List<MedicationRoutineDto> getMedicationRoutinesByARVTreatment(Integer arvTreatmentId) {
        return medicationRoutineRepository.findByArvTreatmentArvTreatmentIDAndIsActiveTrue(arvTreatmentId).stream()
                .map(MedicationRoutineDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * AUTOMATED REMINDER PROCESSING - Find due medication reminders
     */
    public List<MedicationRoutine> findDueMedicationReminders() {
        LocalTime now = LocalTime.now();
        LocalTime windowStart = now.minusMinutes(5);
        LocalTime windowEnd = now.plusMinutes(5);
        
        List<MedicationRoutine> dueRoutines = medicationRoutineRepository
                .findByIsActiveTrueAndTimeOfDayBetween(windowStart, windowEnd);
        
        // Filter out routines that already sent reminders today
        LocalDate today = LocalDate.now();
        return dueRoutines.stream()
                .filter(routine -> routine.getLastReminderSentAt() == null ||
                        !routine.getLastReminderSentAt().toLocalDate().equals(today))
                .collect(Collectors.toList());
    }
    
    /**
     * AUTOMATED REMINDER PROCESSING - Get overdue medication routines
     */
    public List<MedicationRoutine> getOverdueMedicationRoutines() {
        return medicationRoutineRepository.findOverdueMedicationRoutines(LocalDateTime.now());
    }
    
    /**
     * SCHEDULE MANAGEMENT - Handle different frequency types
     */
    public List<MedicationRoutine> getMedicationRoutinesByFrequency(MedicationRoutine.FrequencyType frequencyType) {
        return medicationRoutineRepository.findByFrequencyTypeAndIsActiveTrue(frequencyType);
    }
    
    /**
     * SCHEDULE MANAGEMENT - Get medication routines due today
     */
    public List<MedicationRoutine> getMedicationRoutinesDueToday() {
        LocalDate today = LocalDate.now();
        return medicationRoutineRepository.findByStartDateAndIsActiveTrue(today);
    }
    
    /**
     * SCHEDULE MANAGEMENT - Calculate next reminder due time
     */
    @Transactional
    public void calculateNextReminderDue(Integer routineId) {
        MedicationRoutine routine = medicationRoutineRepository.findById(routineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication routine not found"));
        
        LocalDateTime nextReminder = calculateNextReminderTime(routine);
        routine.setNextReminderDue(nextReminder);
        medicationRoutineRepository.save(routine);
        
        logger.debug("Calculated next reminder for routine {}: {}", routineId, nextReminder);
    }
    
    /**
     * Helper method to calculate next reminder time based on frequency
     */
    private LocalDateTime calculateNextReminderTime(MedicationRoutine routine) {
        LocalDateTime now = LocalDateTime.now();
        LocalTime timeOfDay = routine.getTimeOfDay();
        
        switch (routine.getFrequencyType()) {
            case DAILY:
                LocalDateTime nextDaily = now.toLocalDate().atTime(timeOfDay);
                if (nextDaily.isBefore(now)) {
                    nextDaily = nextDaily.plusDays(1);
                }
                return nextDaily;
                
            case WEEKLY:
                LocalDateTime nextWeekly = now.toLocalDate().atTime(timeOfDay);
                if (nextWeekly.isBefore(now)) {
                    nextWeekly = nextWeekly.plusWeeks(1);
                }
                return nextWeekly;
                
            case MONTHLY:
                LocalDateTime nextMonthly = now.toLocalDate().atTime(timeOfDay);
                if (nextMonthly.isBefore(now)) {
                    nextMonthly = nextMonthly.plusMonths(1);
                }
                return nextMonthly;
                
            default:
                return null; // For AS_NEEDED type
        }
    }
    
    /**
     * SCHEDULE MANAGEMENT - Update reminder sent timestamp
     */
    @Transactional
    public void updateReminderSentTimestamp(Integer routineId) {
        MedicationRoutine routine = medicationRoutineRepository.findById(routineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medication routine not found"));
        
        routine.setLastReminderSentAt(LocalDateTime.now());
        // Calculate and set next reminder due
        routine.setNextReminderDue(calculateNextReminderTime(routine));
        medicationRoutineRepository.save(routine);
        
        logger.debug("Updated reminder sent timestamp for routine: {}", routineId);
    }
    
    /**
     * Get medication routines needing reminder calculation update
     */
    public List<MedicationRoutine> getRoutinesNeedingReminderCalculation() {
        return medicationRoutineRepository.findRoutinesNeedingReminderCalculation();
    }
    
    /**
     * Batch update next reminder due times for all active routines
     */
    @Transactional
    public void batchUpdateNextReminderDue() {
        List<MedicationRoutine> routines = medicationRoutineRepository.findRoutinesNeedingReminderCalculation();
        
        for (MedicationRoutine routine : routines) {
            try {
                LocalDateTime nextReminder = calculateNextReminderTime(routine);
                routine.setNextReminderDue(nextReminder);
                medicationRoutineRepository.save(routine);
            } catch (Exception e) {
                logger.error("Error updating next reminder for routine {}: {}",
                           routine.getRoutineId(), e.getMessage());
            }
        }
        
        logger.info("Batch updated next reminder due times for {} routines", routines.size());
    }

}

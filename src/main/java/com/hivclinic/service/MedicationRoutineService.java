package com.hivclinic.service;

import com.hivclinic.dto.MedicationRoutineDto;
import com.hivclinic.model.ARVTreatment;
import com.hivclinic.model.MedicationRoutine;
import com.hivclinic.repository.ARVTreatmentRepository;
import com.hivclinic.repository.MedicationRoutineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private NotificationService notificationService;
    
    @Autowired
    private ARVTreatmentRepository arvTreatmentRepository;
    
    @Autowired
    private NotificationSchedulingService notificationSchedulingService;

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
        routine.setArvTreatmentId(routineDto.getArvTreatmentId());
        MedicationRoutine savedRoutine = medicationRoutineRepository.save(routine);
        
        // Schedule recurring medication reminders if enabled
        if (savedRoutine.getReminderEnabled() && savedRoutine.getIsActive()) {
            notificationSchedulingService.scheduleRecurringMedicationReminders(savedRoutine);
        }
        
        return MedicationRoutineDto.fromEntity(savedRoutine);
    }

    @Transactional
    public MedicationRoutineDto updateMedicationRoutine(Integer routineId, MedicationRoutineDto routineDto) {
        return medicationRoutineRepository.findById(routineId)
                .map(routine -> {
                    routine.setPatientUserId(routineDto.getPatientUserId());
                    routine.setDoctorUserId(routineDto.getDoctorUserId());
                    routine.setArvTreatmentId(routineDto.getArvTreatmentId());
                    routine.setMedicationName(routineDto.getMedicationName());
                    routine.setDosage(routineDto.getDosage());
                    routine.setInstructions(routineDto.getInstructions());
                    routine.setStartDate(routineDto.getStartDate());
                    routine.setEndDate(routineDto.getEndDate());
                    routine.setTimeOfDay(routineDto.getTimeOfDay());
                    routine.setIsActive(routineDto.getIsActive());
                    routine.setReminderEnabled(routineDto.getReminderEnabled());
                    MedicationRoutine updatedRoutine = medicationRoutineRepository.save(routine);
                    
                    // Update recurring medication reminders if enabled
                    if (updatedRoutine.getReminderEnabled() && updatedRoutine.getIsActive()) {
                        notificationSchedulingService.scheduleRecurringMedicationReminders(updatedRoutine);
                    }
                    
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
    
    /**
     * Create medication routine from ARV treatment
     */
    @Transactional
    public MedicationRoutineDto createMedicationRoutineFromARVTreatment(Long arvTreatmentId) {
        try {
            logger.info("Creating medication routine from ARV treatment ID: {}", arvTreatmentId);
            
            Optional<ARVTreatment> arvTreatmentOpt = arvTreatmentRepository.findById(arvTreatmentId.intValue());
            if (arvTreatmentOpt.isEmpty()) {
                logger.error("ARV treatment not found with ID: {}", arvTreatmentId);
                throw new RuntimeException("ARV treatment not found");
            }
            
            ARVTreatment arvTreatment = arvTreatmentOpt.get();
            
            // Check if medication routine already exists for this ARV treatment
            List<MedicationRoutine> existingRoutines = medicationRoutineRepository.findAll().stream()
                .filter(routine -> routine.getArvTreatmentId() != null &&
                                 routine.getArvTreatmentId().equals(arvTreatmentId.intValue()))
                .toList();
            
            if (!existingRoutines.isEmpty()) {
                logger.warn("Medication routine already exists for ARV treatment ID: {}", arvTreatmentId);
                return MedicationRoutineDto.fromEntity(existingRoutines.get(0));
            }
            
            // Create new medication routine based on ARV treatment
            MedicationRoutine routine = new MedicationRoutine();
            routine.setPatientUserId(arvTreatment.getPatientUserID());
            routine.setDoctorUserId(arvTreatment.getDoctorUserID());
            routine.setArvTreatmentId(arvTreatmentId.intValue());
            routine.setMedicationName(arvTreatment.getRegimen());
            routine.setDosage("As prescribed"); // Default dosage
            routine.setInstructions(arvTreatment.getNotes() != null ? arvTreatment.getNotes() : "Take as prescribed");
            routine.setStartDate(arvTreatment.getStartDate());
            routine.setEndDate(arvTreatment.getEndDate());
            routine.setTimeOfDay(LocalTime.of(8, 0)); // Default to 8 AM
            routine.setIsActive(arvTreatment.getIsActive());
            routine.setReminderEnabled(true); // Enable reminders by default
            routine.setReminderMinutesBefore(30); // Default reminder 30 minutes before
            
            MedicationRoutine savedRoutine = medicationRoutineRepository.save(routine);
            
            // Schedule recurring medication reminders
            if (savedRoutine.getReminderEnabled() && savedRoutine.getIsActive()) {
                notificationSchedulingService.scheduleRecurringMedicationReminders(savedRoutine);
            }
            
            logger.info("Created medication routine ID: {} from ARV treatment ID: {}",
                       savedRoutine.getRoutineId(), arvTreatmentId);
            
            return MedicationRoutineDto.fromEntity(savedRoutine);
            
        } catch (Exception e) {
            logger.error("Error creating medication routine from ARV treatment ID {}: {}",
                        arvTreatmentId, e.getMessage(), e);
            throw new RuntimeException("Failed to create medication routine from ARV treatment: " + e.getMessage());
        }
    }
    
    /**
     * Get medication routines by ARV treatment ID
     */
    @Transactional(readOnly = true)
    public List<MedicationRoutineDto> getMedicationRoutinesByARVTreatment(Long arvTreatmentId) {
        try {
            List<MedicationRoutine> routines = medicationRoutineRepository.findAll().stream()
                .filter(routine -> routine.getArvTreatmentId() != null &&
                                 routine.getArvTreatmentId().equals(arvTreatmentId.intValue()))
                .toList();
            
            return routines.stream()
                .map(MedicationRoutineDto::fromEntity)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            logger.error("Error getting medication routines for ARV treatment ID {}: {}",
                        arvTreatmentId, e.getMessage(), e);
            return List.of();
        }
    }
}

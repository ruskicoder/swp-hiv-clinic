package com.hivclinic.controller;

import com.hivclinic.config.CustomUserDetailsService.UserPrincipal;
import com.hivclinic.dto.MedicationRoutineDto;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.MedicationRoutine;
import com.hivclinic.service.MedicationRoutineService;
import com.hivclinic.service.ReminderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/medication-routines")
@CrossOrigin(origins = "*", maxAge = 3600)
public class MedicationRoutineController {

    private static final Logger logger = LoggerFactory.getLogger(MedicationRoutineController.class);

    @Autowired
    private MedicationRoutineService medicationRoutineService;
    
    @Autowired
    private ReminderService reminderService;

    // ================== ENHANCED CRUD OPERATIONS ==================
    
    /**
     * Get all medication routines (Admin/Manager access)
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getAllMedicationRoutines() {
        try {
            logger.debug("Fetching all medication routines");
            List<MedicationRoutineDto> routines = medicationRoutineService.getAllMedicationRoutines();
            logger.info("Retrieved {} medication routines", routines.size());
            return ResponseEntity.ok(routines);
        } catch (Exception e) {
            logger.error("Error fetching all medication routines: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch medication routines: " + e.getMessage()));
        }
    }
    
    /**
     * Get medication routine by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<?> getMedicationRoutineById(@PathVariable Integer id) {
        try {
            logger.debug("Fetching medication routine with ID: {}", id);
            Optional<MedicationRoutineDto> routine = medicationRoutineService.getMedicationRoutineById(id);
            if (routine.isPresent()) {
                logger.info("Retrieved medication routine: {}", routine.get().getMedicationName());
                return ResponseEntity.ok(routine.get());
            } else {
                logger.warn("Medication routine not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error fetching medication routine {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch medication routine: " + e.getMessage()));
        }
    }
    
    /**
     * Get medication routines by patient
     */
    @GetMapping("/patient/{patientId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<?> getMedicationRoutinesByPatient(@PathVariable Integer patientId) {
        try {
            logger.debug("Fetching medication routines for patient: {}", patientId);
            List<MedicationRoutineDto> routines = medicationRoutineService.getMedicationRoutinesByPatient(patientId);
            logger.info("Retrieved {} medication routines for patient: {}", routines.size(), patientId);
            return ResponseEntity.ok(routines);
        } catch (Exception e) {
            logger.error("Error fetching medication routines for patient {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch medication routines: " + e.getMessage()));
        }
    }
    
    /**
     * Get active medication routines by patient
     */
    @GetMapping("/patient/{patientId}/active")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('PATIENT') or hasRole('ADMIN')")
    public ResponseEntity<?> getActiveMedicationRoutinesByPatient(@PathVariable Integer patientId) {
        try {
            logger.debug("Fetching active medication routines for patient: {}", patientId);
            List<MedicationRoutineDto> routines = medicationRoutineService.getActiveMedicationRoutinesByPatient(patientId);
            logger.info("Retrieved {} active medication routines for patient: {}", routines.size(), patientId);
            return ResponseEntity.ok(routines);
        } catch (Exception e) {
            logger.error("Error fetching active medication routines for patient {}: {}", patientId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch active medication routines: " + e.getMessage()));
        }
    }
    
    /**
     * Get medication routines by doctor
     */
    @GetMapping("/doctor/{doctorId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getMedicationRoutinesByDoctor(@PathVariable Integer doctorId) {
        try {
            logger.debug("Fetching medication routines for doctor: {}", doctorId);
            List<MedicationRoutineDto> routines = medicationRoutineService.getMedicationRoutinesByDoctor(doctorId);
            logger.info("Retrieved {} medication routines for doctor: {}", routines.size(), doctorId);
            return ResponseEntity.ok(routines);
        } catch (Exception e) {
            logger.error("Error fetching medication routines for doctor {}: {}", doctorId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch medication routines: " + e.getMessage()));
        }
    }

    /**
     * Create medication routine
     */
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> createMedicationRoutine(@RequestBody MedicationRoutineDto medicationRoutineDto) {
        try {
            logger.info("Creating medication routine: {}", medicationRoutineDto.getMedicationName());
            MedicationRoutineDto createdRoutine = medicationRoutineService.createMedicationRoutine(medicationRoutineDto);
            logger.info("Medication routine created successfully with ID: {}", createdRoutine.getRoutineId());
            return ResponseEntity.ok(createdRoutine);
        } catch (Exception e) {
            logger.error("Error creating medication routine: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create medication routine: " + e.getMessage()));
        }
    }

    /**
     * Update medication routine
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> updateMedicationRoutine(@PathVariable Integer id, @RequestBody MedicationRoutineDto medicationRoutineDto) {
        try {
            logger.info("Updating medication routine with ID: {}", id);
            MedicationRoutineDto updatedRoutine = medicationRoutineService.updateMedicationRoutine(id, medicationRoutineDto);
            if (updatedRoutine != null) {
                logger.info("Medication routine updated successfully");
                return ResponseEntity.ok(updatedRoutine);
            } else {
                logger.warn("Medication routine not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error updating medication routine {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update medication routine: " + e.getMessage()));
        }
    }
    
    /**
     * Delete medication routine
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteMedicationRoutine(@PathVariable Integer id) {
        try {
            logger.info("Deleting medication routine with ID: {}", id);
            medicationRoutineService.deleteMedicationRoutine(id);
            logger.info("Medication routine deleted successfully");
            return ResponseEntity.ok(MessageResponse.success("Medication routine deleted successfully"));
        } catch (Exception e) {
            logger.error("Error deleting medication routine {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to delete medication routine: " + e.getMessage()));
        }
    }

    // ================== BATCH OPERATIONS ==================
    
    /**
     * Batch create medication routines
     */
    @PostMapping("/batch")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> createBatchMedicationRoutines(@RequestBody List<MedicationRoutineDto> routines) {
        try {
            logger.info("Creating batch of {} medication routines", routines.size());
            List<MedicationRoutineDto> createdRoutines = routines.stream()
                    .map(medicationRoutineService::createMedicationRoutine)
                    .toList();
            logger.info("Successfully created {} medication routines", createdRoutines.size());
            return ResponseEntity.ok(createdRoutines);
        } catch (Exception e) {
            logger.error("Error creating batch medication routines: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to create batch medication routines: " + e.getMessage()));
        }
    }
    
    /**
     * Batch update medication routines
     */
    @PutMapping("/batch")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> updateBatchMedicationRoutines(@RequestBody List<MedicationRoutineDto> routines) {
        try {
            logger.info("Updating batch of {} medication routines", routines.size());
            List<MedicationRoutineDto> updatedRoutines = routines.stream()
                    .map(routine -> medicationRoutineService.updateMedicationRoutine(routine.getRoutineId(), routine))
                    .filter(routine -> routine != null)
                    .toList();
            logger.info("Successfully updated {} medication routines", updatedRoutines.size());
            return ResponseEntity.ok(updatedRoutines);
        } catch (Exception e) {
            logger.error("Error updating batch medication routines: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update batch medication routines: " + e.getMessage()));
        }
    }

    // ================== SCHEDULING CONTROLS ==================
    
    /**
     * Enable/disable automated reminders for a routine
     */
    @PutMapping("/{id}/reminder-automation")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> updateReminderAutomation(@PathVariable Integer id, @RequestBody Map<String, Boolean> request) {
        try {
            Boolean enabled = request.get("enabled");
            if (enabled == null) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Enabled flag is required"));
            }
            
            logger.info("Updating reminder automation for routine {}: {}", id, enabled);
            
            Optional<MedicationRoutineDto> routineOpt = medicationRoutineService.getMedicationRoutineById(id);
            if (routineOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            MedicationRoutineDto routine = routineOpt.get();
            routine.setReminderEnabled(enabled);
            
            MedicationRoutineDto updatedRoutine = medicationRoutineService.updateMedicationRoutine(id, routine);
            
            logger.info("Reminder automation updated successfully for routine {}", id);
            return ResponseEntity.ok(updatedRoutine);
            
        } catch (Exception e) {
            logger.error("Error updating reminder automation for routine {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update reminder automation: " + e.getMessage()));
        }
    }
    
    /**
     * Get due medication reminders
     */
    @GetMapping("/due-reminders")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getDueMedicationReminders() {
        try {
            logger.debug("Fetching due medication reminders");
            List<MedicationRoutine> dueRoutines = medicationRoutineService.findDueMedicationReminders();
            logger.info("Retrieved {} due medication reminders", dueRoutines.size());
            return ResponseEntity.ok(dueRoutines);
        } catch (Exception e) {
            logger.error("Error fetching due medication reminders: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch due medication reminders: " + e.getMessage()));
        }
    }
    
    /**
     * Get overdue medication routines
     */
    @GetMapping("/overdue-routines")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getOverdueMedicationRoutines() {
        try {
            logger.debug("Fetching overdue medication routines");
            List<MedicationRoutine> overdueRoutines = medicationRoutineService.getOverdueMedicationRoutines();
            logger.info("Retrieved {} overdue medication routines", overdueRoutines.size());
            return ResponseEntity.ok(overdueRoutines);
        } catch (Exception e) {
            logger.error("Error fetching overdue medication routines: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch overdue medication routines: " + e.getMessage()));
        }
    }
    
    /**
     * Manual trigger for batch reminder calculation update
     */
    @PostMapping("/batch-update-reminders")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> batchUpdateNextReminderDue() {
        try {
            logger.info("Triggering batch update of next reminder due times");
            medicationRoutineService.batchUpdateNextReminderDue();
            logger.info("Batch update of next reminder due times completed");
            return ResponseEntity.ok(MessageResponse.success("Batch update of reminder due times completed"));
        } catch (Exception e) {
            logger.error("Error in batch update of reminder due times: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to update reminder due times: " + e.getMessage()));
        }
    }

    // ================== ARV TREATMENT INTEGRATION ==================
    
    /**
     * Link medication routine to ARV treatment
     */
    @PostMapping("/{routineId}/link-arv/{arvTreatmentId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> linkToARVTreatment(@PathVariable Integer routineId, @PathVariable Integer arvTreatmentId) {
        try {
            logger.info("Linking medication routine {} to ARV treatment {}", routineId, arvTreatmentId);
            MedicationRoutineDto linkedRoutine = medicationRoutineService.linkToARVTreatment(routineId, arvTreatmentId);
            logger.info("Successfully linked routine to ARV treatment");
            return ResponseEntity.ok(linkedRoutine);
        } catch (Exception e) {
            logger.error("Error linking routine {} to ARV treatment {}: {}", routineId, arvTreatmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to link routine to ARV treatment: " + e.getMessage()));
        }
    }
    
    /**
     * Get medication routines by ARV treatment
     */
    @GetMapping("/arv-treatment/{arvTreatmentId}")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<?> getMedicationRoutinesByARVTreatment(@PathVariable Integer arvTreatmentId) {
        try {
            logger.debug("Fetching medication routines for ARV treatment: {}", arvTreatmentId);
            List<MedicationRoutineDto> routines = medicationRoutineService.getMedicationRoutinesByARVTreatment(arvTreatmentId);
            logger.info("Retrieved {} medication routines for ARV treatment: {}", routines.size(), arvTreatmentId);
            return ResponseEntity.ok(routines);
        } catch (Exception e) {
            logger.error("Error fetching medication routines for ARV treatment {}: {}", arvTreatmentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to fetch medication routines for ARV treatment: " + e.getMessage()));
        }
    }
    
    // ================== MANUAL REMINDER SENDING ==================
    
    /**
     * Send manual medication reminder
     */
    @PostMapping("/{routineId}/send-reminder")
    @PreAuthorize("hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<?> sendManualMedicationReminder(
            @PathVariable Integer routineId,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        try {
            Integer patientId = (Integer) request.get("patientId");
            String customMessage = (String) request.get("message");
            
            if (patientId == null) {
                return ResponseEntity.badRequest()
                        .body(MessageResponse.error("Patient ID is required"));
            }
            
            logger.info("Sending manual medication reminder for routine {} to patient {}", routineId, patientId);
            
            reminderService.sendManualMedicationReminder(userPrincipal.getId(), patientId, routineId, customMessage);
            
            logger.info("Manual medication reminder sent successfully");
            return ResponseEntity.ok(MessageResponse.success("Manual medication reminder sent successfully"));
            
        } catch (Exception e) {
            logger.error("Error sending manual medication reminder for routine {}: {}", routineId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MessageResponse.error("Failed to send manual medication reminder: " + e.getMessage()));
        }
    }
}
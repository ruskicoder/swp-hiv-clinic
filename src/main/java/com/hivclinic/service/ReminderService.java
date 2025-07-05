package com.hivclinic.service;

import com.hivclinic.model.Appointment;
import com.hivclinic.model.MedicationRoutine;
import com.hivclinic.model.Notification;
import com.hivclinic.repository.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderService {

    private static final Logger logger = LoggerFactory.getLogger(ReminderService.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private MedicationRoutineService medicationRoutineService;

    /**
     * Daily job to send appointment reminders for appointments scheduled the next day
     */
    @Scheduled(cron = "0 0 9 * * ?") // Run every day at 9 AM
    public void sendAutomatedAppointmentReminders() {
        logger.info("Running automated appointment reminder job...");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);

        List<Appointment> upcomingAppointments = appointmentRepository.findByAppointmentDateTimeBetween(now, tomorrow);

        for (Appointment appointment : upcomingAppointments) {
            if ("Scheduled".equals(appointment.getStatus())) {
                try {
                    String message = "Reminder: You have an appointment tomorrow at " + appointment.getAppointmentDateTime().toLocalTime();
                    notificationService.sendNotification(
                        appointment.getDoctorUser().getUserId(),
                        appointment.getPatientUser().getUserId(),
                        message,
                        "APPOINTMENT_REMINDER"
                    );
                    logger.info("Sent reminder for appointment ID: {}", appointment.getAppointmentId());
                } catch (Exception e) {
                    logger.error("Failed to send reminder for appointment ID: {}", appointment.getAppointmentId(), e);
                }
            }
        }
        logger.info("Automated appointment reminder job finished.");
    }
    
    /**
     * Run medication reminders every 10 minutes
     * This checks for medication routines scheduled within a 10-minute window
     * and sends reminders to patients
     */
    @Scheduled(fixedRate = 600000) // Run every 10 minutes (600,000 ms)
    public void processMedicationReminders() {
        logger.info("Processing medication reminders...");
        try {
            notificationService.processAutomatedMedicationReminders();
            logger.info("Medication reminder processing completed successfully");
        } catch (Exception e) {
            logger.error("Error processing medication reminders", e);
        }
    }
    
    /**
     * MANUAL REMINDER SENDING - Allow doctors to manually send medication reminders
     */
    @Transactional
    public Notification sendManualMedicationReminder(Integer doctorId, Integer patientId, Integer routineId, String customMessage) {
        try {
            logger.info("Sending manual medication reminder from doctor {} to patient {} for routine {}",
                       doctorId, patientId, routineId);
            
            String message = customMessage;
            if (message == null || message.trim().isEmpty()) {
                // Use default message from routine
                message = generateDefaultReminderMessage(routineId);
            }
            
            Notification notification = notificationService.sendMedicationReminder(doctorId, patientId, routineId, message);
            
            // Update the routine's reminder timestamp
            medicationRoutineService.updateReminderSentTimestamp(routineId);
            
            logger.info("Manual medication reminder sent successfully");
            return notification;
            
        } catch (Exception e) {
            logger.error("Error sending manual medication reminder", e);
            throw new RuntimeException("Failed to send manual medication reminder: " + e.getMessage());
        }
    }
    
    /**
     * MANUAL REMINDER SENDING - Send batch medication reminders
     */
    @Transactional
    public List<Notification> sendBatchMedicationReminders(Integer doctorId, List<Integer> patientIds, String message, String medicationDetails) {
        try {
            logger.info("Sending batch medication reminders from doctor {} to {} patients", doctorId, patientIds.size());
            
            List<Notification> notifications = notificationService.sendBatchMedicationReminders(
                doctorId, patientIds, message, medicationDetails);
            
            logger.info("Batch medication reminders sent: {} successful", notifications.size());
            return notifications;
            
        } catch (Exception e) {
            logger.error("Error sending batch medication reminders", e);
            throw new RuntimeException("Failed to send batch medication reminders: " + e.getMessage());
        }
    }
    
    /**
     * AUTOMATED PROCESSING - Enhanced medication reminder processing using MedicationRoutineService
     */
    @Scheduled(fixedRate = 300000) // Run every 5 minutes (300,000 ms)
    public void processEnhancedMedicationReminders() {
        logger.info("Processing enhanced medication reminders...");
        try {
            List<MedicationRoutine> dueRoutines = medicationRoutineService.findDueMedicationReminders();
            
            int successCount = 0;
            int failureCount = 0;
            
            for (MedicationRoutine routine : dueRoutines) {
                try {
                    String message = generateDefaultReminderMessage(routine.getRoutineId());
                    
                    notificationService.sendMedicationReminder(
                        routine.getDoctorUserId(),
                        routine.getPatientUserId(),
                        routine.getRoutineId(),
                        message
                    );
                    
                    // Update reminder timestamp using the service
                    medicationRoutineService.updateReminderSentTimestamp(routine.getRoutineId());
                    
                    successCount++;
                    logger.debug("Sent reminder for routine {}", routine.getRoutineId());
                    
                } catch (Exception e) {
                    failureCount++;
                    logger.error("Failed to send reminder for routine {}: {}",
                               routine.getRoutineId(), e.getMessage());
                }
            }
            
            logger.info("Enhanced medication reminder processing completed. Success: {}, Failures: {}",
                       successCount, failureCount);
            
        } catch (Exception e) {
            logger.error("Error in enhanced medication reminder processing", e);
        }
    }
    
    /**
     * AUTOMATED PROCESSING - Process overdue medication reminders
     */
    @Scheduled(cron = "0 0 12 * * ?") // Run daily at noon
    public void processOverdueMedicationReminders() {
        logger.info("Processing overdue medication reminders...");
        try {
            List<MedicationRoutine> overdueRoutines = medicationRoutineService.getOverdueMedicationRoutines();
            
            for (MedicationRoutine routine : overdueRoutines) {
                try {
                    String message = "OVERDUE: " + generateDefaultReminderMessage(routine.getRoutineId());
                    
                    notificationService.sendMedicationReminder(
                        routine.getDoctorUserId(),
                        routine.getPatientUserId(),
                        routine.getRoutineId(),
                        message
                    );
                    
                    logger.info("Sent overdue reminder for routine {}", routine.getRoutineId());
                    
                } catch (Exception e) {
                    logger.error("Failed to send overdue reminder for routine {}: {}",
                               routine.getRoutineId(), e.getMessage());
                }
            }
            
            logger.info("Overdue medication reminder processing completed for {} routines", overdueRoutines.size());
            
        } catch (Exception e) {
            logger.error("Error processing overdue medication reminders", e);
        }
    }
    
    /**
     * Helper method to generate default reminder message
     */
    private String generateDefaultReminderMessage(Integer routineId) {
        try {
            return medicationRoutineService.getMedicationRoutineById(routineId)
                .map(routine -> String.format("Time to take your medication: %s (%s)%s",
                    routine.getMedicationName(),
                    routine.getDosage(),
                    routine.getInstructions() != null && !routine.getInstructions().isEmpty()
                        ? ". " + routine.getInstructions()
                        : ""))
                .orElse("Time to take your medication");
        } catch (Exception e) {
            logger.error("Error generating default message for routine {}: {}", routineId, e.getMessage());
            return "Time to take your medication";
        }
    }
    
    /**
     * Weekly job to send medication adherence summary to doctors
     * Runs every Monday at 8 AM
     */
    @Scheduled(cron = "0 0 8 * * MON") // Run every Monday at 8 AM
    public void generateMedicationAdherenceReports() {
        logger.info("Generating medication adherence reports...");
        try {
            // This could be implemented in the future to provide doctors with
            // summaries of patient medication adherence based on notification status
            logger.info("Medication adherence report generation completed");
        } catch (Exception e) {
            logger.error("Error generating medication adherence reports", e);
        }
    }
    
    /**
     * Daily job to update next reminder due times
     */
    @Scheduled(cron = "0 0 1 * * ?") // Run daily at 1 AM
    public void updateNextReminderDueTimes() {
        logger.info("Updating next reminder due times...");
        try {
            medicationRoutineService.batchUpdateNextReminderDue();
            logger.info("Next reminder due times update completed");
        } catch (Exception e) {
            logger.error("Error updating next reminder due times", e);
        }
    }
}
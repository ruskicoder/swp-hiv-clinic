package com.hivclinic.service;

import com.hivclinic.model.Appointment;
import com.hivclinic.model.MedicationRoutine;
import com.hivclinic.model.Notification;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.MedicationRoutineRepository;
import com.hivclinic.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class NotificationSchedulingService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationSchedulingService.class);
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private MedicationRoutineRepository medicationRoutineRepository;
    
    /**
     * Schedule appointment reminders at different intervals
     */
    @Transactional
    public void scheduleAppointmentReminders(Appointment appointment) {
        logger.info("Scheduling appointment reminders for appointment ID: {}", appointment.getAppointmentId());
        
        LocalDateTime appointmentTime = appointment.getAppointmentDateTime();
        String patientName = appointment.getPatientUser().getUsername();
        String doctorName = appointment.getDoctorUser().getUsername();
        
        // 24-hour reminder
        LocalDateTime reminder24h = appointmentTime.minusDays(1);
        if (reminder24h.isAfter(LocalDateTime.now())) {
            createScheduledNotification(
                appointment.getPatientUser().getUserId(),
                Notification.NotificationType.APPOINTMENT_REMINDER,
                "Appointment Reminder - Tomorrow",
                String.format("You have an appointment with Dr. %s tomorrow at %s", doctorName, appointmentTime.toString()),
                reminder24h,
                appointment.getAppointmentId(),
                "APPOINTMENT",
                "HIGH"
            );
        }
        
        // 1-hour reminder
        LocalDateTime reminder1h = appointmentTime.minusHours(1);
        if (reminder1h.isAfter(LocalDateTime.now())) {
            createScheduledNotification(
                appointment.getPatientUser().getUserId(),
                Notification.NotificationType.APPOINTMENT_REMINDER,
                "Appointment Reminder - 1 Hour",
                String.format("Your appointment with Dr. %s is in 1 hour at %s", doctorName, appointmentTime.toString()),
                reminder1h,
                appointment.getAppointmentId(),
                "APPOINTMENT",
                "HIGH"
            );
        }
        
        // 30-minute reminder
        LocalDateTime reminder30m = appointmentTime.minusMinutes(30);
        if (reminder30m.isAfter(LocalDateTime.now())) {
            createScheduledNotification(
                appointment.getPatientUser().getUserId(),
                Notification.NotificationType.APPOINTMENT_REMINDER,
                "Appointment Reminder - 30 Minutes",
                String.format("Your appointment with Dr. %s is in 30 minutes at %s", doctorName, appointmentTime.toString()),
                reminder30m,
                appointment.getAppointmentId(),
                "APPOINTMENT",
                "HIGH"
            );
        }
        
        logger.info("Scheduled appointment reminders for appointment ID: {}", appointment.getAppointmentId());
    }
    
    /**
     * Schedule recurring medication reminders
     */
    @Transactional
    public void scheduleRecurringMedicationReminders(MedicationRoutine routine) {
        logger.info("Scheduling recurring medication reminders for routine ID: {}", routine.getRoutineId());
        
        if (!routine.getReminderEnabled() || !routine.getIsActive()) {
            logger.debug("Skipping reminder scheduling for inactive or disabled routine ID: {}", routine.getRoutineId());
            return;
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = routine.getEndDate() != null ? 
            routine.getEndDate().atTime(LocalTime.MAX) : 
            now.plusMonths(3); // Default to 3 months if no end date
        
        LocalDateTime current = now.toLocalDate().atTime(routine.getTimeOfDay());
        
        // Schedule for next 30 days or until end date
        while (current.isBefore(endDate) && current.isBefore(now.plusDays(30))) {
            if (current.isAfter(now)) {
                // Schedule reminder at the specified time
                createScheduledNotification(
                    routine.getPatientUserId(),
                    Notification.NotificationType.MEDICATION_REMINDER,
                    "Medication Reminder",
                    String.format("Time to take your medication: %s (%s)", routine.getMedicationName(), routine.getDosage()),
                    current,
                    routine.getRoutineId(),
                    "MEDICATION_ROUTINE",
                    "MEDIUM"
                );
                
                // Also schedule a reminder before the medication time if configured
                if (routine.getReminderMinutesBefore() != null && routine.getReminderMinutesBefore() > 0) {
                    LocalDateTime reminderTime = current.minusMinutes(routine.getReminderMinutesBefore());
                    if (reminderTime.isAfter(now)) {
                        createScheduledNotification(
                            routine.getPatientUserId(),
                            Notification.NotificationType.MEDICATION_REMINDER,
                            "Medication Reminder - Upcoming",
                            String.format("Reminder: Take your medication %s (%s) in %d minutes", 
                                routine.getMedicationName(), routine.getDosage(), routine.getReminderMinutesBefore()),
                            reminderTime,
                            routine.getRoutineId(),
                            "MEDICATION_ROUTINE",
                            "MEDIUM"
                        );
                    }
                }
            }
            current = current.plusDays(1);
        }
        
        logger.info("Scheduled recurring medication reminders for routine ID: {}", routine.getRoutineId());
    }
    
    /**
     * Create a scheduled notification
     */
    private void createScheduledNotification(Integer userId, Notification.NotificationType type, 
                                           String title, String message, LocalDateTime scheduledFor,
                                           Integer relatedEntityId, String relatedEntityType, String priority) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setScheduledFor(scheduledFor);
        notification.setRelatedEntityId(relatedEntityId);
        notification.setRelatedEntityType(relatedEntityType);
        notification.setPriority(priority);
        notification.setIsRead(false);
        
        notificationRepository.save(notification);
        logger.debug("Created scheduled notification for user {} at {}", userId, scheduledFor);
    }
    
    /**
     * Process scheduled notifications - runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void processScheduledNotifications() {
        logger.debug("Processing scheduled notifications");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime processingWindow = now.plusMinutes(5);
        
        // Find notifications that should be sent now
        List<Notification> dueNotifications = notificationRepository.findAll().stream()
            .filter(n -> n.getScheduledFor() != null && 
                        n.getSentAt() == null && 
                        n.getScheduledFor().isBefore(processingWindow))
            .toList();
        
        logger.debug("Found {} notifications due for processing", dueNotifications.size());
        
        for (Notification notification : dueNotifications) {
            try {
                // Mark as sent
                notification.setSentAt(now);
                notificationRepository.save(notification);
                
                logger.info("Processed scheduled notification ID: {} for user: {}", 
                           notification.getNotificationId(), notification.getUserId());
            } catch (Exception e) {
                logger.error("Error processing scheduled notification ID: {}", 
                           notification.getNotificationId(), e);
            }
        }
    }
    
    /**
     * Process daily medication reminders - runs every hour
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void processDailyMedicationReminders() {
        logger.debug("Processing daily medication reminders");
        
        LocalDateTime now = LocalDateTime.now();
        LocalTime currentTime = now.toLocalTime();
        
        // Find medication routines that should trigger reminders within the next hour
        List<MedicationRoutine> routines = medicationRoutineRepository.findByIsActiveTrueAndTimeOfDayBetween(
            currentTime, currentTime.plusHours(1)
        );
        
        for (MedicationRoutine routine : routines) {
            try {
                // Check if we already sent a reminder today
                if (routine.getLastReminderSentAt() == null || 
                    routine.getLastReminderSentAt().toLocalDate().isBefore(now.toLocalDate())) {
                    
                    // Create immediate medication reminder
                    createScheduledNotification(
                        routine.getPatientUserId(),
                        Notification.NotificationType.MEDICATION_REMINDER,
                        "Medication Reminder",
                        String.format("Time to take your medication: %s (%s)", 
                                    routine.getMedicationName(), routine.getDosage()),
                        now,
                        routine.getRoutineId(),
                        "MEDICATION_ROUTINE",
                        "MEDIUM"
                    );
                    
                    // Update last reminder sent time
                    routine.setLastReminderSentAt(now);
                    medicationRoutineRepository.save(routine);
                    
                    logger.info("Sent medication reminder for routine ID: {}", routine.getRoutineId());
                }
            } catch (Exception e) {
                logger.error("Error processing medication reminder for routine ID: {}", 
                           routine.getRoutineId(), e);
            }
        }
    }
    
    /**
     * Cleanup old processed notifications - runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
    @Transactional
    public void cleanupOldNotifications() {
        logger.info("Starting cleanup of old notifications");
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        
        List<Notification> oldNotifications = notificationRepository.findAll().stream()
            .filter(n -> n.getSentAt() != null && n.getSentAt().isBefore(cutoffDate))
            .toList();
        
        if (!oldNotifications.isEmpty()) {
            notificationRepository.deleteAll(oldNotifications);
            logger.info("Cleaned up {} old notifications", oldNotifications.size());
        }
    }
}
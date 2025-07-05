package com.hivclinic.service;

import com.hivclinic.model.Appointment;
import com.hivclinic.model.MedicationRoutine;
import com.hivclinic.model.Notification;
import com.hivclinic.model.NotificationTemplate;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.MedicationRoutineRepository;
import com.hivclinic.repository.NotificationRepository;
import com.hivclinic.repository.NotificationTemplateRepository;
import com.hivclinic.repository.UserRepository;
import com.hivclinic.dto.NotificationDto;
import com.hivclinic.dto.PatientAppointmentDTO;
import com.hivclinic.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class NotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationTemplateRepository notificationTemplateRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private MedicationRoutineRepository medicationRoutineRepository;
    
    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Get notifications for a doctor with all patients that have appointments
     */
    public List<NotificationDto> getNotificationsForDoctor(Integer doctorId) {
        return notificationRepository.findByDoctorAndPatientInDoctorAppointments(doctorId).stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Get notifications for a doctor sorted by appointment status priority
     * Order: In Progress, Completed, Scheduled
     */
    public List<NotificationDto> getNotificationsForDoctorPrioritized(Integer doctorId) {
        return notificationRepository.findByDoctorOrderedByAppointmentStatusPriority(doctorId).stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * MANAGER FUNCTIONALITY - Get all patients with appointments sorted by status
     * Order: In Progress, Completed, Scheduled
     */
    public List<PatientAppointmentDTO> getAllPatientsWithAppointmentsSortedByStatus(Integer doctorId) {
        List<Appointment> appointments = appointmentRepository.findByDoctorUserId(doctorId);
        
        return appointments.stream()
                .map(appointment -> {
                    PatientAppointmentDTO dto = new PatientAppointmentDTO();
                    dto.setAppointmentId(appointment.getAppointmentId());
                    dto.setPatientName(appointment.getPatientUser().getFirstName() + " " + appointment.getPatientUser().getLastName());
                    dto.setStatus(appointment.getStatus());
                    dto.setAppointmentDateTime(appointment.getAppointmentDateTime());
                    dto.setPatientUserId(appointment.getPatientUser().getUserId());
                    
                    // Get notification count for this patient
                    long notificationCount = notificationRepository.countByMedicationRoutineRoutineIdAndRetractedAtIsNull(appointment.getAppointmentId());
                    dto.setNotificationCount((int) notificationCount);
                    
                    return dto;
                })
                .sorted((a, b) -> {
                    // Sort by status priority: In Progress, Completed, Scheduled
                    int priorityA = getStatusPriority(a.getStatus());
                    int priorityB = getStatusPriority(b.getStatus());
                    
                    if (priorityA != priorityB) {
                        return Integer.compare(priorityA, priorityB);
                    }
                    
                    // If same priority, sort by appointment date descending
                    return b.getAppointmentDateTime().compareTo(a.getAppointmentDateTime());
                })
                .collect(Collectors.toList());
    }
    
    private int getStatusPriority(String status) {
        switch (status) {
            case "In Progress": return 1;
            case "Completed": return 2;
            case "Scheduled": return 3;
            default: return 4;
        }
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Create notification
     */
    @Transactional
    public Notification createNotification(Integer doctorId, Integer patientId, String type, String message, String payload) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        
        Notification notification = new Notification();
        notification.setDoctor(doctor);
        notification.setPatient(patient);
        notification.setType(type);
        notification.setMessage(message);
        notification.setPayload(payload);
        notification.setStatus("Sent");
        notification.setCreatedAt(LocalDateTime.now());
        
        return notificationRepository.save(notification);
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Read notification by ID
     */
    public Optional<Notification> getNotificationById(Integer notificationId) {
        return notificationRepository.findById(notificationId);
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Update notification
     */
    @Transactional
    public Notification updateNotification(Integer notificationId, String type, String message, String payload) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        if (type != null) notification.setType(type);
        if (message != null) notification.setMessage(message);
        if (payload != null) notification.setPayload(payload);
        
        return notificationRepository.save(notification);
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Delete notification
     */
    @Transactional
    public void deleteNotification(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        notificationRepository.delete(notification);
    }
    
    /**
     * ENHANCED CRUD OPERATIONS - Get all notifications
     */
    public List<NotificationDto> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Send a notification from a doctor to a patient
     */
    @Transactional
    public Notification sendNotification(Integer doctorId, Integer patientId, String message, String type) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        Notification notification = new Notification();
        notification.setDoctor(doctor);
        notification.setPatient(patient);
        notification.setType(type);
        notification.setMessage(message);
        notification.setStatus("Sent");
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }
    
    /**
     * Send a medication reminder notification
     */
    @Transactional
    public Notification sendMedicationReminder(Integer doctorId, Integer patientId, Integer routineId, String message) {
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        MedicationRoutine routine = medicationRoutineRepository.findById(routineId)
                .orElseThrow(() -> new RuntimeException("Medication routine not found"));

        Notification notification = new Notification();
        notification.setDoctor(doctor);
        notification.setPatient(patient);
        notification.setType("MEDICATION_REMINDER");
        notification.setMessage(message);
        notification.setStatus("Sent");
        notification.setCreatedAt(LocalDateTime.now());
        
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("routineId", routineId);
            payload.put("medicationName", routine.getMedicationName());
            payload.put("dosage", routine.getDosage());
            payload.put("instructions", routine.getInstructions());
            
            notification.setPayload(objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize payload", e);
        }
        
        // Update the last reminder sent timestamp
        routine.setLastReminderSentAt(LocalDateTime.now());
        medicationRoutineRepository.save(routine);
        
        return notificationRepository.save(notification);
    }
    
    /**
     * Send appointment reminder notification
     */
    @Transactional
    public Notification sendAppointmentReminder(Integer appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        User doctor = appointment.getDoctorUser();
        User patient = appointment.getPatientUser();
        
        Notification notification = new Notification();
        notification.setDoctor(doctor);
        notification.setPatient(patient);
        notification.setAppointment(appointment);
        notification.setType("APPOINTMENT_REMINDER");
        notification.setMessage("You have an upcoming appointment with Dr. " +
                doctor.getFirstName() + " " + doctor.getLastName() +
                " on " + appointment.getAppointmentDateTime().toString());
        notification.setStatus("Sent");
        notification.setCreatedAt(LocalDateTime.now());
        
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("appointmentId", appointmentId);
            payload.put("appointmentDateTime", appointment.getAppointmentDateTime().toString());
            
            notification.setPayload(objectMapper.writeValueAsString(payload));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize payload", e);
        }
        
        return notificationRepository.save(notification);
    }
    
    /**
     * Send batch medication reminders to multiple patients
     */
    @Transactional
    public List<Notification> sendBatchMedicationReminders(Integer doctorId, List<Integer> patientIds, String message, String medicationDetails) {
        return patientIds.stream()
                .map(patientId -> {
                    try {
                        User doctor = userRepository.findById(doctorId)
                                .orElseThrow(() -> new RuntimeException("Doctor not found"));
                        User patient = userRepository.findById(patientId)
                                .orElseThrow(() -> new RuntimeException("Patient not found"));

                        Notification notification = new Notification();
                        notification.setDoctor(doctor);
                        notification.setPatient(patient);
                        notification.setType("MEDICATION_REMINDER");
                        notification.setMessage(message);
                        notification.setStatus("Sent");
                        notification.setCreatedAt(LocalDateTime.now());
                        
                        try {
                            Map<String, Object> payload = new HashMap<>();
                            payload.put("medicationDetails", medicationDetails);
                            payload.put("isBatchReminder", true);
                            
                            notification.setPayload(objectMapper.writeValueAsString(payload));
                        } catch (Exception e) {
                            throw new RuntimeException("Failed to serialize payload", e);
                        }
                        
                        return notificationRepository.save(notification);
                    } catch (Exception e) {
                        logger.error("Error sending notification to patient ID {}: {}", patientId, e.getMessage());
                        return null;
                    }
                })
                .filter(notification -> notification != null)
                .collect(Collectors.toList());
    }

    /**
     * UNSEND NOTIFICATION FUNCTIONALITY - Retract a notification with reason tracking
     */
    @Transactional
    public void retractNotification(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setStatus("Retracted");
        notification.setRetractedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }
    
    /**
     * UNSEND NOTIFICATION FUNCTIONALITY - Retract a notification with reason
     */
    @Transactional
    public void retractNotificationWithReason(Integer notificationId, String reason) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        // Check if notification can be retracted (not yet seen by patient)
        if (notification.getSeenAt() != null) {
            throw new RuntimeException("Cannot retract notification that has already been seen by patient");
        }
        
        notification.setStatus("Retracted");
        notification.setRetractedAt(LocalDateTime.now());
        notification.setRetractionReason(reason);
        notificationRepository.save(notification);
        
        logger.info("Notification {} retracted with reason: {}", notificationId, reason);
    }
    
    /**
     * Check if notification can be retracted (not yet seen by patient)
     */
    public boolean canRetractNotification(Integer notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isEmpty()) {
            return false;
        }
        
        Notification notification = notificationOpt.get();
        return notification.getSeenAt() == null && notification.getRetractedAt() == null;
    }

    /**
     * ENHANCED STATUS TRACKING - Update notification status with proper timestamp tracking
     */
    @Transactional
    public void updateNotificationStatus(Integer notificationId, String status) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        LocalDateTime now = LocalDateTime.now();
        String previousStatus = notification.getStatus();
        
        notification.setStatus(status);
        
        switch (status) {
            case "Delivered":
                if (notification.getDeliveredAt() == null) {
                    notification.setDeliveredAt(now);
                }
                break;
            case "Seen":
                if (notification.getSeenAt() == null) {
                    notification.setSeenAt(now);
                }
                // Auto-set delivered if not already set
                if (notification.getDeliveredAt() == null) {
                    notification.setDeliveredAt(now);
                }
                break;
            case "Read":
                if (notification.getReadAt() == null) {
                    notification.setReadAt(now);
                }
                // Auto-set seen and delivered if not already set
                if (notification.getSeenAt() == null) {
                    notification.setSeenAt(now);
                }
                if (notification.getDeliveredAt() == null) {
                    notification.setDeliveredAt(now);
                }
                break;
            case "Failed":
                // Set failure timestamp and reason if needed
                if (notification.getFailureReason() == null) {
                    notification.setFailureReason("Delivery failed");
                }
                break;
        }
        
        notificationRepository.save(notification);
        
        logger.info("Notification {} status updated from {} to {}",
                   notificationId, previousStatus, status);
    }
    
    /**
     * ENHANCED STATUS TRACKING - Update notification status with failure reason
     */
    @Transactional
    public void updateNotificationStatusWithFailureReason(Integer notificationId, String status, String failureReason) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        
        notification.setStatus(status);
        if ("Failed".equals(status)) {
            notification.setFailureReason(failureReason);
        }
        
        notificationRepository.save(notification);
        
        logger.warn("Notification {} marked as failed: {}", notificationId, failureReason);
    }
    
    /**
     * Mark notification as seen (when opened by patient)
     */
    @Transactional
    public void markNotificationAsSeen(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (notification.getSeenAt() == null) {
            notification.setSeenAt(LocalDateTime.now());
            notification.setStatus("Seen");
            notificationRepository.save(notification);
        }
    }
    
    /**
     * Mark notification as read (when fully viewed or acknowledged by patient)
     */
    @Transactional
    public void markNotificationAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
            notification.setStatus("Read");
            if (notification.getSeenAt() == null) {
                notification.setSeenAt(LocalDateTime.now());
            }
            notificationRepository.save(notification);
        }
    }
    
    /**
     * Get all unread notifications for a patient
     */
    public List<NotificationDto> getUnreadNotificationsForPatient(Integer patientId) {
        return notificationRepository.findByPatientUserIdAndRetractedAtIsNullOrderByCreatedAtDesc(patientId).stream()
                .filter(n -> n.getReadAt() == null)
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Count unread notifications for a patient
     */
    public long countUnreadNotificationsForPatient(Integer patientId) {
        return notificationRepository.findByPatientUserIdAndRetractedAtIsNullOrderByCreatedAtDesc(patientId).stream()
                .filter(n -> n.getReadAt() == null)
                .count();
    }

    /**
     * Get all notification templates
     */
    public List<NotificationTemplate> getAllTemplates() {
        return notificationTemplateRepository.findAll();
    }

    /**
     * Create a new notification template
     */
    public NotificationTemplate createTemplate(String name, String content, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        NotificationTemplate template = new NotificationTemplate();
        template.setTemplateName(name);
        template.setTemplateContent(content);
        template.setCreatedByUser(user);
        return notificationTemplateRepository.save(template);
    }

    /**
     * Update an existing notification template
     */
    public NotificationTemplate updateTemplate(Integer templateId, String name, String content) {
        NotificationTemplate template = notificationTemplateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("Template not found"));
        template.setTemplateName(name);
        template.setTemplateContent(content);
        return notificationTemplateRepository.save(template);
    }

    /**
     * Delete a notification template
     */
    public void deleteTemplate(Integer templateId) {
        notificationTemplateRepository.deleteById(templateId);
    }

    /**
     * Get notification history for a patient
     */
    public List<NotificationDto> getNotificationHistory(Integer patientId) {
        return notificationRepository.findByPatientUserIdOrderByCreatedAtDesc(patientId).stream()
                .map(NotificationDto::fromEntity)
                .collect(Collectors.toList());
    }
    
    /**
     * Process automated medication reminders
     * This method should be called by a scheduler
     */
    @Transactional
    public void processAutomatedMedicationReminders() {
        try {
            logger.info("Processing automated medication reminders");
            LocalTime now = LocalTime.now();
            LocalTime windowStart = now.minusMinutes(5);
            LocalTime windowEnd = now.plusMinutes(5);
            
            List<MedicationRoutine> routinesToRemind;
            try {
                routinesToRemind = medicationRoutineRepository
                    .findByIsActiveTrueAndTimeOfDayBetween(windowStart, windowEnd);
                logger.info("Found {} medication routines to process", routinesToRemind.size());
            } catch (Exception e) {
                logger.error("Error querying medication routines: {}", e.getMessage(), e);
                return;
            }
            
            int successCount = 0;
            int failureCount = 0;
            
            for (MedicationRoutine routine : routinesToRemind) {
                try {
                    // Check if reminder already sent today
                    if (routine.getLastReminderSentAt() != null &&
                        routine.getLastReminderSentAt().toLocalDate().equals(LocalDateTime.now().toLocalDate())) {
                        logger.debug("Skipping reminder for routine ID {} - already sent today", routine.getRoutineId());
                        continue;
                    }
                    
                    logger.info("Sending medication reminder for routine ID: {}, medication: {}", 
                        routine.getRoutineId(), routine.getMedicationName());
                    
                    String message = String.format("Time to take your medication: %s (%s)%s",
                            routine.getMedicationName(),
                            routine.getDosage(),
                            routine.getInstructions() != null && !routine.getInstructions().isEmpty()
                                ? ". " + routine.getInstructions()
                                : "");
                    
                    sendMedicationReminder(
                        routine.getDoctorUserId(),
                        routine.getPatientUserId(),
                        routine.getRoutineId(),
                        message
                    );
                    
                    successCount++;
                } catch (Exception e) {
                    failureCount++;
                    // Log exception but continue processing other routines
                    logger.error("Error sending medication reminder for routine ID {}: {}", 
                        routine.getRoutineId(), e.getMessage(), e);
                }
            }
            
            logger.info("Medication reminder processing completed. Success: {}, Failures: {}", 
                successCount, failureCount);
            
        } catch (Exception e) {
            logger.error("Unexpected error in medication reminder processing: {}", e.getMessage(), e);
            throw e; // Rethrow to allow transaction management to handle it
        }
    }
}

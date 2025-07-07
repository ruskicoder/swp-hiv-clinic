package com.hivclinic.service;

import com.hivclinic.model.Appointment;
import com.hivclinic.model.Notification;
import com.hivclinic.model.NotificationTemplate;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.NotificationRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DoctorNotificationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DoctorNotificationService.class);
    
    @Autowired
    private NotificationTemplateService notificationTemplateService;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private com.hivclinic.repository.PatientProfileRepository patientProfileRepository;
    
    /**
     * Get notification templates by type
     */
    @Transactional(readOnly = true)
    public List<NotificationTemplate> getNotificationTemplatesByType(String type) {
        try {
            NotificationTemplate.NotificationType notificationType = 
                NotificationTemplate.NotificationType.valueOf(type.toUpperCase());
            return notificationTemplateService.getTemplatesByType(notificationType);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid notification type: {}", type);
            return List.of();
        }
    }
    
    /**
     * Send notification to patient using template
     */
    @Transactional
    public boolean sendNotificationToPatient(Long doctorId, Long patientId, Long templateId, 
                                           Map<String, String> variables) {
        try {
            logger.info("Doctor {} sending notification to patient {} using template {}", 
                       doctorId, patientId, templateId);
            
            // Validate doctor exists
            Optional<User> doctorOpt = userRepository.findById(doctorId.intValue());
            if (doctorOpt.isEmpty() || !"Doctor".equalsIgnoreCase(doctorOpt.get().getRole().getRoleName())) {
                logger.error("Doctor not found or invalid role: {}", doctorId);
                return false;
            }
            
            // Validate patient exists
            Optional<User> patientOpt = userRepository.findById(patientId.intValue());
            if (patientOpt.isEmpty() || !"Patient".equalsIgnoreCase(patientOpt.get().getRole().getRoleName())) {
                logger.error("Patient not found or invalid role: {}", patientId);
                return false;
            }
            
            // Validate doctor has permission to send notifications to this patient
            if (!canDoctorContactPatient(doctorId.intValue(), patientId.intValue())) {
                logger.error("Doctor {} does not have permission to contact patient {}", doctorId, patientId);
                return false;
            }
            
            // Get template
            Optional<NotificationTemplate> templateOpt = notificationTemplateService.getTemplateById(templateId);
            if (templateOpt.isEmpty() || !templateOpt.get().getIsActive()) {
                logger.error("Template not found or inactive: {}", templateId);
                return false;
            }
            
            NotificationTemplate template = templateOpt.get();
            User doctor = doctorOpt.get();
            User patient = patientOpt.get();
            
            // Automatically populate common template variables
            Map<String, String> allVariables = new java.util.HashMap<>();
            if (variables != null) {
                allVariables.putAll(variables);
            }
            
            // Add patient information
            String patientFirstName = "Unknown";
            String patientLastName = "Patient";
            try {
                Optional<com.hivclinic.model.PatientProfile> profileOpt =
                    patientProfileRepository.findByUser(patient);
                if (profileOpt.isPresent()) {
                    com.hivclinic.model.PatientProfile profile = profileOpt.get();
                    patientFirstName = profile.getFirstName() != null ? profile.getFirstName() : patient.getFirstName();
                    patientLastName = profile.getLastName() != null ? profile.getLastName() : patient.getLastName();
                } else {
                    patientFirstName = patient.getFirstName() != null ? patient.getFirstName() : patient.getUsername();
                    patientLastName = patient.getLastName() != null ? patient.getLastName() : "";
                }
            } catch (Exception e) {
                logger.warn("Error fetching patient profile: {}", e.getMessage());
            }
            
            allVariables.put("patientName", patientFirstName + " " + patientLastName);
            allVariables.put("patientFirstName", patientFirstName);
            allVariables.put("patientLastName", patientLastName);
            
            // Add doctor information
            String doctorFirstName = doctor.getFirstName() != null ? doctor.getFirstName() : doctor.getUsername();
            String doctorLastName = doctor.getLastName() != null ? doctor.getLastName() : "";
            allVariables.put("doctorName", doctorFirstName + " " + doctorLastName);
            allVariables.put("doctorFirstName", doctorFirstName);
            allVariables.put("doctorLastName", doctorLastName);
            
            // Add current date/time
            allVariables.put("currentDate", java.time.LocalDate.now().toString());
            allVariables.put("currentTime", java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")));
            
            // Add appointment information if available
            try {
                // Try to find the most recent appointment between doctor and patient
                List<com.hivclinic.model.Appointment> appointments = appointmentRepository.findByDoctorUserAndPatientUser(doctor, patient);
                if (!appointments.isEmpty()) {
                    // Get the most recent appointment
                    com.hivclinic.model.Appointment recentAppointment = appointments.stream()
                        .max(java.util.Comparator.comparing(com.hivclinic.model.Appointment::getAppointmentDateTime))
                        .orElse(null);
                    
                    if (recentAppointment != null) {
                        java.time.LocalDateTime appointmentDateTime = recentAppointment.getAppointmentDateTime();
                        java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd");
                        java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
                        java.time.format.DateTimeFormatter readableDateFormatter = java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy");
                        java.time.format.DateTimeFormatter readableTimeFormatter = java.time.format.DateTimeFormatter.ofPattern("h:mm a");
                        
                        allVariables.put("appointmentDate", appointmentDateTime.format(dateFormatter));
                        allVariables.put("appointmentTime", appointmentDateTime.format(timeFormatter));
                        allVariables.put("appointmentDateReadable", appointmentDateTime.format(readableDateFormatter));
                        allVariables.put("appointmentTimeReadable", appointmentDateTime.format(readableTimeFormatter));
                        allVariables.put("appointmentDateTime", appointmentDateTime.toString());
                        allVariables.put("appointmentStatus", recentAppointment.getStatus());
                        
                        logger.debug("Added appointment variables: date={}, time={}, status={}",
                                   appointmentDateTime.format(dateFormatter),
                                   appointmentDateTime.format(timeFormatter),
                                   recentAppointment.getStatus());
                    }
                }
            } catch (Exception e) {
                logger.warn("Error fetching appointment information for template variables: {}", e.getMessage());
            }
            
            // Add clinic information
            allVariables.put("clinicName", "HIV Clinic"); // Default clinic name
            allVariables.put("clinicAddress", "123 Healthcare Avenue");
            allVariables.put("clinicPhone", "(555) 123-4567");
            allVariables.put("clinicEmail", "info@hivclinic.com");
            
            // Add custom message if provided
            if (variables != null && variables.containsKey("message")) {
                allVariables.put("message", variables.get("message"));
            } else {
                allVariables.put("message", ""); // Empty fallback
            }
            
            // Add additional commonly used variables
            allVariables.put("todayDate", java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMMM d, yyyy")));
            allVariables.put("currentYear", String.valueOf(java.time.Year.now().getValue()));
            allVariables.put("currentMonth", java.time.LocalDate.now().getMonth().name());
            allVariables.put("currentDay", String.valueOf(java.time.LocalDate.now().getDayOfMonth()));
            
            logger.debug("Template variables populated: {}", allVariables);
            logger.info("Processing template with {} variables for patient {} and doctor {}",
                       allVariables.size(), patientId, doctorId);
            
            // Process template variables
            String processedSubject = notificationTemplateService.processTemplate(template.getSubject(), allVariables);
            String processedBody = notificationTemplateService.processTemplate(template.getBody(), allVariables);
            
            // Create notification
            Notification notification = new Notification();
            notification.setUserId(patientId.intValue());
            notification.setType(Notification.NotificationType.valueOf(template.getType().name()));
            notification.setTitle(processedSubject);
            notification.setMessage(processedBody);
            notification.setPriority(template.getPriority().name());
            notification.setIsRead(false);
            notification.setSentAt(LocalDateTime.now());
            notification.setRelatedEntityType("TEMPLATE");
            notification.setRelatedEntityId(templateId.intValue());
            
            notification.setStatus("SENT");
            notificationRepository.save(notification);
            
            logger.info("Notification sent successfully from doctor {} to patient {}", doctorId, patientId);
            return true;
            
        } catch (Exception e) {
            logger.error("Error sending notification from doctor {} to patient {}: {}", 
                        doctorId, patientId, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get notification history for a patient (doctor access)
     */
    @Transactional(readOnly = true)
    public List<Notification> getNotificationHistory(Long doctorId, Long patientId) {
        try {
            logger.debug("Doctor {} requesting notification history for patient {}", doctorId, patientId);
            
            // Validate doctor has permission to access this patient's notifications
            if (!canDoctorContactPatient(doctorId.intValue(), patientId.intValue())) {
                logger.error("Doctor {} does not have permission to access patient {} notifications", 
                           doctorId, patientId);
                return List.of();
            }
            
            List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(patientId.intValue());
            logger.debug("Found {} notifications for patient {}", notifications.size(), patientId);
            
            return notifications;
            
        } catch (Exception e) {
            logger.error("Error retrieving notification history for patient {}: {}", patientId, e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Get notification history for a doctor (all notifications sent by this doctor)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getNotificationHistoryForDoctor(Long doctorId) {
        try {
            logger.debug("Doctor {} requesting all notification history", doctorId);
            
            // Get all notifications sent by this doctor to their patients
            List<Notification> allNotifications = notificationRepository.findAll();
            
            // Filter for notifications sent to patients who have appointments with this doctor
            List<Map<String, Object>> notificationHistory = new java.util.ArrayList<>();
            
            for (Notification notification : allNotifications) {
                if (canDoctorContactPatient(doctorId.intValue(), notification.getUserId())) {
                    Map<String, Object> notificationData = new java.util.HashMap<>();
                    
                    // Add notification details
                    notificationData.put("notificationId", notification.getNotificationId());
                    notificationData.put("title", notification.getTitle());
                    notificationData.put("message", notification.getMessage());
                    notificationData.put("type", notification.getType().name());
                    notificationData.put("priority", notification.getPriority());
                    notificationData.put("isRead", notification.getIsRead());
                    notificationData.put("sentAt", notification.getSentAt());
                    notificationData.put("createdAt", notification.getCreatedAt());
                    
                    // Add patient information
                    try {
                        Optional<User> patientOpt = userRepository.findById(notification.getUserId());
                        if (patientOpt.isPresent()) {
                            User patient = patientOpt.get();
                            
                            String patientFirstName = "Unknown";
                            String patientLastName = "Patient";
                            
                            // Try to get name from PatientProfile first
                            try {
                                Optional<com.hivclinic.model.PatientProfile> profileOpt =
                                    patientProfileRepository.findByUser(patient);
                                if (profileOpt.isPresent()) {
                                    com.hivclinic.model.PatientProfile profile = profileOpt.get();
                                    patientFirstName = profile.getFirstName() != null ? profile.getFirstName() : patient.getFirstName();
                                    patientLastName = profile.getLastName() != null ? profile.getLastName() : patient.getLastName();
                                } else {
                                    patientFirstName = patient.getFirstName() != null ? patient.getFirstName() : patient.getUsername();
                                    patientLastName = patient.getLastName() != null ? patient.getLastName() : "";
                                }
                            } catch (Exception e) {
                                logger.warn("Error fetching patient profile for notification history: {}", e.getMessage());
                            }
                            
                            notificationData.put("patientName", patientFirstName + " " + patientLastName);
                            notificationData.put("patientEmail", patient.getEmail());
                            notificationData.put("patientId", patient.getUserId());
                        } else {
                            notificationData.put("patientName", "Unknown Patient");
                            notificationData.put("patientEmail", "");
                            notificationData.put("patientId", notification.getUserId());
                        }
                    } catch (Exception e) {
                        logger.warn("Error fetching patient details for notification {}: {}",
                                   notification.getNotificationId(), e.getMessage());
                        notificationData.put("patientName", "Unknown Patient");
                        notificationData.put("patientEmail", "");
                        notificationData.put("patientId", notification.getUserId());
                    }
                    
                    // Use actual status field from database
                    String status = notification.getStatus();
                    if (status == null || status.trim().isEmpty()) {
                        // Fallback to dynamic calculation only if status is null
                        status = "PENDING";
                        if (notification.getSentAt() != null) {
                            status = notification.getIsRead() ? "READ" : "DELIVERED";
                        }
                    }
                    notificationData.put("status", status);
                    
                    notificationHistory.add(notificationData);
                }
            }
            
            // Sort by creation date descending
            notificationHistory.sort((a, b) -> {
                java.time.LocalDateTime dateA = (java.time.LocalDateTime) a.get("createdAt");
                java.time.LocalDateTime dateB = (java.time.LocalDateTime) b.get("createdAt");
                return dateB.compareTo(dateA);
            });
            
            logger.debug("Found {} notifications for doctor {}", notificationHistory.size(), doctorId);
            return notificationHistory;
            
        } catch (Exception e) {
            logger.error("Error retrieving notification history for doctor {}: {}", doctorId, e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Unsend/cancel a notification if it hasn't been sent yet
     */
    @Transactional
    public boolean unsendNotification(Long notificationId, Long doctorId) {
        try {
            logger.info("Doctor {} attempting to unsend notification {}", doctorId, notificationId);
            
            Optional<Notification> notificationOpt = notificationRepository.findById(notificationId.intValue());
            if (notificationOpt.isEmpty()) {
                logger.error("Notification not found: {}", notificationId);
                return false;
            }
            
            Notification notification = notificationOpt.get();
            
            // Check if notification has already been sent
            if (notification.getSentAt() != null) {
                logger.warn("Cannot unsend notification {} - already sent at {}", 
                           notificationId, notification.getSentAt());
                return false;
            }
            
            // Validate doctor has permission to unsend this notification
            if (!canDoctorContactPatient(doctorId.intValue(), notification.getUserId())) {
                logger.error("Doctor {} does not have permission to unsend notification for patient {}", 
                           doctorId, notification.getUserId());
                return false;
            }
            
            // Mark as cancelled instead of deleting
            notification.setMessage(notification.getMessage() + " [CANCELLED]");
            notification.setTitle(notification.getTitle() + " [CANCELLED]");
            notification.setStatus("CANCELLED");
            notificationRepository.save(notification);
            
            logger.info("Notification {} cancelled by doctor {}", notificationId, doctorId);
            return true;
            
        } catch (Exception e) {
            logger.error("Error unsending notification {}: {}", notificationId, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Delete a notification if doctor has permission
     */
    @Transactional
    public boolean deleteNotification(Long notificationId, Long doctorId) {
        try {
            logger.info("Doctor {} attempting to delete notification {}", doctorId, notificationId);
            
            Optional<Notification> notificationOpt = notificationRepository.findById(notificationId.intValue());
            if (notificationOpt.isEmpty()) {
                logger.error("Notification not found: {}", notificationId);
                return false;
            }
            
            Notification notification = notificationOpt.get();
            
            // Validate doctor has permission to delete this notification
            if (!canDoctorContactPatient(doctorId.intValue(), notification.getUserId())) {
                logger.error("Doctor {} does not have permission to delete notification for patient {}",
                           doctorId, notification.getUserId());
                return false;
            }
            
            // Delete the notification
            notificationRepository.delete(notification);
            
            logger.info("Notification {} deleted by doctor {}", notificationId, doctorId);
            return true;
            
        } catch (Exception e) {
            logger.error("Error deleting notification {}: {}", notificationId, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get patients with appointments for a doctor
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPatientsWithAppointments(Long doctorId) {
        try {
            logger.debug("Getting patients with appointments for doctor {}", doctorId);
            logger.debug("Expected frontend structure: userId, firstName, lastName, email");
            
            Optional<User> doctorOpt = userRepository.findById(doctorId.intValue());
            if (doctorOpt.isEmpty()) {
                logger.error("Doctor not found: {}", doctorId);
                return List.of();
            }
            
            List<Appointment> appointments = appointmentRepository.findByDoctorUser(doctorOpt.get());
            
            // Get unique patients from appointments with enhanced mapping
            Map<Integer, Map<String, Object>> uniquePatients = new java.util.HashMap<>();
            
            for (Appointment appointment : appointments) {
                User patient = appointment.getPatientUser();
                Integer patientId = patient.getUserId();
                
                if (!uniquePatients.containsKey(patientId)) {
                    Map<String, Object> patientMap = new java.util.HashMap<>();
                    
                    // Frontend expects: userId, firstName, lastName, email
                    patientMap.put("userId", patient.getUserId());
                    
                    // Try to get name from PatientProfile first, then from User entity
                    String firstName = "Unknown";
                    String lastName = "Patient";
                    
                    try {
                        Optional<com.hivclinic.model.PatientProfile> profileOpt =
                            patientProfileRepository.findByUser(patient);
                        
                        if (profileOpt.isPresent()) {
                            com.hivclinic.model.PatientProfile profile = profileOpt.get();
                            firstName = profile.getFirstName() != null ? profile.getFirstName() : firstName;
                            lastName = profile.getLastName() != null ? profile.getLastName() : lastName;
                            logger.debug("Found PatientProfile for user {}: {} {}",
                                        patientId, firstName, lastName);
                        } else {
                            // Fallback to User entity names
                            if (patient.getFirstName() != null && !patient.getFirstName().trim().isEmpty()) {
                                firstName = patient.getFirstName();
                            } else if (patient.getUsername() != null && !patient.getUsername().trim().isEmpty()) {
                                firstName = patient.getUsername();
                            }
                            
                            if (patient.getLastName() != null && !patient.getLastName().trim().isEmpty()) {
                                lastName = patient.getLastName();
                            }
                            logger.debug("No PatientProfile found for user {}, using User entity: {} {}",
                                        patientId, firstName, lastName);
                        }
                    } catch (Exception e) {
                        logger.warn("Error fetching PatientProfile for user {}: {}", patientId, e.getMessage());
                        // Use fallback values already set
                    }
                    
                    patientMap.put("firstName", firstName);
                    patientMap.put("lastName", lastName);
                    patientMap.put("email", patient.getEmail() != null ? patient.getEmail() : "");
                    
                    logger.debug("Final mapping for patient: userId={}, username={}, email={}, firstName={}, lastName={}",
                                patient.getUserId(), patient.getUsername(), patient.getEmail(),
                                firstName, lastName);
                    
                    patientMap.put("lastAppointment", appointment.getAppointmentDateTime());
                    patientMap.put("appointmentStatus", appointment.getStatus());
                    
                    uniquePatients.put(patientId, patientMap);
                } else {
                    // Update last appointment if this appointment is more recent
                    Map<String, Object> existingPatient = uniquePatients.get(patientId);
                    java.time.LocalDateTime existingLastAppt = (java.time.LocalDateTime) existingPatient.get("lastAppointment");
                    if (appointment.getAppointmentDateTime().isAfter(existingLastAppt)) {
                        existingPatient.put("lastAppointment", appointment.getAppointmentDateTime());
                        existingPatient.put("appointmentStatus", appointment.getStatus());
                    }
                }
            }
            List<Map<String, Object>> result = new java.util.ArrayList<>(uniquePatients.values());
            logger.info("Successfully fetched {} unique patients with appointments for doctor {}",
                       result.size(), doctorId);
            
            return result;
                
        } catch (Exception e) {
            logger.error("Error getting patients for doctor {}: {}", doctorId, e.getMessage(), e);
            return List.of();
        }
    }
    
    /**
     * Check if doctor has permission to contact patient
     * This is based on whether they have had appointments together
     */
    private boolean canDoctorContactPatient(Integer doctorId, Integer patientId) {
        try {
            Optional<User> doctorOpt = userRepository.findById(doctorId);
            Optional<User> patientOpt = userRepository.findById(patientId);
            
            if (doctorOpt.isEmpty() || patientOpt.isEmpty()) {
                return false;
            }
            
            // Check if doctor and patient have had appointments together
            List<Appointment> appointments = appointmentRepository.findByDoctorUserAndPatientUser(
                doctorOpt.get(), patientOpt.get()
            );
            
            boolean hasAppointments = !appointments.isEmpty();
            logger.debug("Doctor {} has {} appointments with patient {}", 
                        doctorId, appointments.size(), patientId);
            
            return hasAppointments;
            
        } catch (Exception e) {
            logger.error("Error checking doctor-patient relationship: {}", e.getMessage(), e);
            return false;
        }
    }
}
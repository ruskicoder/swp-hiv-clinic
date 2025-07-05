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
            
            // Process template variables
            String processedSubject = notificationTemplateService.processTemplate(template.getSubject(), variables);
            String processedBody = notificationTemplateService.processTemplate(template.getBody(), variables);
            
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
            notificationRepository.save(notification);
            
            logger.info("Notification {} cancelled by doctor {}", notificationId, doctorId);
            return true;
            
        } catch (Exception e) {
            logger.error("Error unsending notification {}: {}", notificationId, e.getMessage(), e);
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
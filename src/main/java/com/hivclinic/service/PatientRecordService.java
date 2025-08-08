package com.hivclinic.service;

import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.PatientRecord;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.PatientRecordRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing patient medical records
 */
@Service
@Transactional(readOnly = true)
public class PatientRecordService {

    private static final Logger logger = LoggerFactory.getLogger(PatientRecordService.class);

    @Autowired
    private PatientRecordRepository patientRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientPrivacyService patientPrivacyService;

    /**
     * Get patient record by ID with enhanced validation
     */
    public Optional<PatientRecord> getPatientRecord(Integer patientUserId) {
        if (patientUserId == null) {
            logger.warn("Attempt to get patient record with null ID");
            return Optional.empty();
        }

        try {
            Optional<PatientRecord> record = patientRecordRepository.findByPatientUserID(patientUserId);
            
            if (record.isPresent()) {
                // Load user details separately
                userRepository.findById(patientUserId).ifPresent(user -> {
                    record.get().setPatientUserID(user.getUserId());
                });
            }

            return record;
        } catch (Exception e) {
            logger.error("Error retrieving patient record: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Get complete patient record with all related data
     */
    public Map<String, Object> getPatientRecordAsMap(Integer patientUserId) {
        try {
            logger.debug("Fetching patient record for patient ID: {}", patientUserId);
            
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            
            if (recordOpt.isPresent()) {
                PatientRecord record = recordOpt.get();
                Map<String, Object> response = mapRecordToResponse(record);
                response.put("success", true);
                response.put("message", "Patient record retrieved successfully");
                return response;
            } else {
                // Create new patient record if none exists
                logger.info("Creating new patient record for patient ID: {}", patientUserId);
                PatientRecord newRecord = new PatientRecord();
                newRecord.setPatientUserID(patientUserId);
                newRecord.setMedicalHistory("");
                newRecord.setAllergies("");
                newRecord.setCurrentMedications("");
                newRecord.setNotes("");
                newRecord.setBloodType("");
                newRecord.setEmergencyContact("");
                newRecord.setEmergencyPhone("");
                
                PatientRecord savedRecord = patientRecordRepository.save(newRecord);
                Map<String, Object> response = mapRecordToResponse(savedRecord);
                response.put("success", true);
                response.put("message", "New patient record created successfully");
                return response;
            }
        } catch (Exception e) {
            logger.error("Error getting patient record: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to retrieve patient record: " + e.getMessage());
            return errorResponse;
        }
    }

    /**
     * Get patient record for appointment with doctor access control
     */
    public Map<String, Object> getPatientRecordForAppointment(Integer appointmentId, Integer doctorUserId) {
        try {
            logger.debug("Doctor {} fetching patient record for appointment {}", doctorUserId, appointmentId);

            // First verify the appointment exists and belongs to the doctor
            Optional<Appointment> appointmentOpt = appointmentRepository.findByIdWithPatient(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return Map.of(
                        "success", false,
                        "message", "Appointment not found"
                );
            }

            Appointment appointment = appointmentOpt.get();
            if (!appointment.getDoctorUser().getUserId().equals(doctorUserId)) {
                throw new SecurityException("Doctor does not have access to this appointment");
            }

            if ("Completed".equalsIgnoreCase(appointment.getStatus())) {
                return Map.of(
                        "success", false,
                        "message", "Cannot access record for completed appointment"
                );
            }

            // Get patient record using patient user ID
            Integer patientUserId = appointment.getPatientUser().getUserId();
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);

            PatientRecord record;
            if (recordOpt.isPresent()) {
                record = recordOpt.get();
                logger.debug("Found existing patient record for appointment {}", appointmentId);
            } else {
                // Create new record if none exists
                logger.info("Creating new patient record for appointment {}", appointmentId);
                record = new PatientRecord();
                record.setPatientUserID(patientUserId);
                record.setAppointmentId(appointmentId);
                record.setMedicalHistory("");
                record.setAllergies("");
                record.setCurrentMedications("");
                record.setNotes("");
                record.setBloodType("");
                record.setEmergencyContact("");
                record.setEmergencyPhone("");
                record = patientRecordRepository.save(record);
            }

            Map<String, Object> response = mapRecordToResponse(record);

            // Add appointment details
            response.put("appointmentId", appointment.getAppointmentId());
            response.put("appointmentDateTime", appointment.getAppointmentDateTime());
            response.put("appointmentStatus", appointment.getStatus());

            // Add patient basic info
            User patient = appointment.getPatientUser();
            response.put("patientUsername", patient.getUsername());
            response.put("patientEmail", patient.getEmail());

            // Add empty ARV treatments list (since we removed the dependency)
            response.put("arvTreatments", List.of());

            response.put("success", true);
            return response;

        } catch (SecurityException e) {
            logger.warn("Security violation: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Error getting patient record for appointment {}: {}", appointmentId, e.getMessage(), e);
            return Map.of(
                    "success", false,
                    "message", "Failed to retrieve patient record: " + e.getMessage()
            );
        }
    }

    /**
     * Update patient record with response
     */
    @Transactional
    public MessageResponse updatePatientRecordWithResponse(Integer patientUserId, Map<String, Object> recordData) {
        try {
            logger.debug("Updating patient record for patient ID: {}", patientUserId);

            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            PatientRecord record;

            if (recordOpt.isPresent()) {
                record = recordOpt.get();
                logger.debug("Updating existing patient record");
            } else {
                // Create new record if none exists
                logger.info("Creating new patient record for patient ID: {}", patientUserId);
                record = new PatientRecord();
                record.setPatientUserID(patientUserId);
            }

            // Update record fields
            if (recordData.containsKey("medicalHistory")) {
                record.setMedicalHistory((String) recordData.get("medicalHistory"));
            }
            if (recordData.containsKey("allergies")) {
                record.setAllergies((String) recordData.get("allergies"));
            }
            if (recordData.containsKey("currentMedications")) {
                record.setCurrentMedications((String) recordData.get("currentMedications"));
            }
            if (recordData.containsKey("notes")) {
                record.setNotes((String) recordData.get("notes"));
            }
            if (recordData.containsKey("bloodType")) {
                record.setBloodType((String) recordData.get("bloodType"));
            }
            if (recordData.containsKey("emergencyContact")) {
                record.setEmergencyContact((String) recordData.get("emergencyContact"));
            }
            if (recordData.containsKey("emergencyPhone")) {
                record.setEmergencyPhone((String) recordData.get("emergencyPhone"));
            }

            patientRecordRepository.save(record);

            logger.info("Patient record updated successfully for patient ID: {}", patientUserId);
            return MessageResponse.success("Patient record updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating patient record: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update patient record: " + e.getMessage());
        }
    }

    /**
     * Update profile image
     */    
    @Transactional
    public MessageResponse updateProfileImage(Integer patientUserId, String base64Image) {
        try {
            logger.debug("Processing image upload for patient ID: {}", patientUserId);
            
            if (patientUserId == null) {
                logger.error("Patient ID is null");
                return MessageResponse.error("Patient ID is required");
            }

            if (base64Image == null || base64Image.trim().isEmpty()) {
                logger.error("Image data is empty");
                return MessageResponse.error("Image data is required");
            }

            // Validate base64 format
            if (!base64Image.startsWith("data:image/")) {
                logger.error("Invalid image format provided");
                return MessageResponse.error("Invalid image format. Must be a data URL (data:image/...)");
            }

            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            PatientRecord record;

            if (recordOpt.isPresent()) {
                record = recordOpt.get();
                logger.debug("Updating existing patient record image");
            } else {
                // Create new record if none exists
                logger.info("Creating new patient record for image upload");
                record = new PatientRecord();
                record.setPatientUserID(patientUserId);
                record.setMedicalHistory("");
                record.setAllergies("");
                record.setCurrentMedications("");
                record.setNotes("");
                record.setBloodType("");
                record.setEmergencyContact("");
                record.setEmergencyPhone("");
            }

            // Store the image
            record.setProfileImageBase64(base64Image);
            patientRecordRepository.save(record);
            
            logger.info("Profile image successfully updated for patient ID: {}", patientUserId);
            return MessageResponse.success("Profile image updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating profile image: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update profile image: " + e.getMessage());
        }
    }

    /**
     * Map PatientRecord to response format
     */
    private Map<String, Object> mapRecordToResponse(PatientRecord record) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Patient record retrieved successfully");
        response.put("recordId", record.getRecordID());
        response.put("patientUserId", record.getPatientUserID());
        response.put("appointmentId", record.getAppointmentId());
        response.put("medicalHistory", record.getMedicalHistory());
        response.put("allergies", record.getAllergies());
        response.put("currentMedications", record.getCurrentMedications());
        response.put("notes", record.getNotes());
        response.put("bloodType", record.getBloodType());
        response.put("emergencyContact", record.getEmergencyContact());
        response.put("emergencyPhone", record.getEmergencyPhone());
        response.put("profileImageBase64", record.getProfileImageBase64());
        response.put("createdAt", record.getCreatedAt());
        response.put("updatedAt", record.getUpdatedAt());

        // Add patient username and email if available
        if (record.getPatientUserID() != null) {
            try {
                Optional<User> userOpt = userRepository.findById(record.getPatientUserID());
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    response.put("patientUsername", user.getUsername());
                    response.put("patientEmail", user.getEmail());
                }
            } catch (Exception e) {
                logger.warn("Failed to load user details for patient {}: {}", record.getPatientUserID(), e.getMessage());
            }
            
            // Add privacy setting
            try {
                boolean isPrivate = patientPrivacyService.getPrivacySettings(record.getPatientUserID());
                response.put("isPrivate", isPrivate);
            } catch (Exception e) {
                logger.warn("Failed to load privacy settings for patient {}: {}", record.getPatientUserID(), e.getMessage());
                response.put("isPrivate", false); // Default to non-private if we can't determine
            }
        }

        return response;
    }
}
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
    private ARVTreatmentService arvTreatmentService;

    @Autowired
    private AppointmentRepository appointmentRepository;

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
            logger.debug("Fetching patient record for user ID: {}", patientUserId);
            
            // Check if user exists
            Optional<User> userOpt = userRepository.findById(patientUserId);
            if (userOpt.isEmpty()) {
                return Map.of(
                    "success", false,
                    "message", "Patient not found"
                );
            }

            // Get or create patient record
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            PatientRecord record;
            
            if (recordOpt.isPresent()) {
                record = recordOpt.get();
                logger.debug("Found existing patient record for user ID: {}", patientUserId);
            } else {
                // Create new record if none exists
                logger.info("Creating new patient record for user ID: {}", patientUserId);
                record = new PatientRecord();
                record.setPatientUserID(patientUserId);
                record.setMedicalHistory("");
                record.setAllergies("");
                record.setCurrentMedications("");
                record.setNotes("");
                record.setBloodType("");
                record.setEmergencyContact("");
                record.setEmergencyPhone("");
                record = patientRecordRepository.save(record);
            }

            return mapRecordToResponse(record);

        } catch (Exception e) {
            logger.error("Error fetching patient record as map: {}", e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "Failed to fetch patient record: " + e.getMessage()
            );
        }
    }

    /**
     * Get patient record for a specific appointment
     */
    public Map<String, Object> getPatientRecordForAppointment(Integer appointmentId, Integer doctorUserId) {
        try {
            logger.debug("Fetching patient record for appointment {} by doctor {}", appointmentId, doctorUserId);
            
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

            // Add ARV treatments to response
            List<Map<String, Object>> treatments = arvTreatmentService.getPatientTreatments(patientUserId);
            response.put("arvTreatments", treatments);

            return response;

        } catch (SecurityException e) {
            throw e; // Re-throw security exceptions for proper handling
        } catch (Exception e) {
            logger.error("Error fetching patient record for appointment {}: {}", appointmentId, e.getMessage(), e);
            return Map.of(
                "success", false,
                "message", "Failed to fetch patient record: " + e.getMessage()
            );
        }
    }

    /**
     * Update patient record with response
     */
    @Transactional
    public MessageResponse updatePatientRecordWithResponse(Integer patientUserId, Map<String, Object> recordData) {
        try {
            logger.debug("Updating patient record for user ID: {}", patientUserId);
            
            // Get or create patient record
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            PatientRecord record;
            
            if (recordOpt.isPresent()) {
                record = recordOpt.get();
            } else {
                // Create new record if none exists
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

            // Save the record
            patientRecordRepository.save(record);
            
            logger.info("Patient record updated successfully for user ID: {}", patientUserId);
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
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            PatientRecord record;
            
            if (recordOpt.isPresent()) {
                record = recordOpt.get();
            } else {
                record = new PatientRecord();
                record.setPatientUserID(patientUserId);
            }

            record.setProfileImageBase64(base64Image);
            patientRecordRepository.save(record);

            return MessageResponse.success("Profile image updated successfully!");
        } catch (Exception e) {
            logger.error("Error updating profile image: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update profile image: " + e.getMessage());
        }
    }

    /**
     * Helper method to map PatientRecord to response map
     */
    private Map<String, Object> mapRecordToResponse(PatientRecord record) {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("message", "Patient record retrieved successfully");
        response.put("recordId", record.getRecordId());  // Changed from getRecordID() to getRecordId()
        response.put("patientUserId", record.getPatientUserID());
        response.put("appointmentId", record.getAppointmentId());
        response.put("medicalHistory", record.getMedicalHistory() != null ? record.getMedicalHistory() : "");
        response.put("allergies", record.getAllergies() != null ? record.getAllergies() : "");
        response.put("currentMedications", record.getCurrentMedications() != null ? record.getCurrentMedications() : "");
        response.put("notes", record.getNotes() != null ? record.getNotes() : "");
        response.put("bloodType", record.getBloodType() != null ? record.getBloodType() : "");
        response.put("emergencyContact", record.getEmergencyContact() != null ? record.getEmergencyContact() : "");
        response.put("emergencyPhone", record.getEmergencyPhone() != null ? record.getEmergencyPhone() : "");
        response.put("profileImageBase64", record.getProfileImageBase64());
        response.put("createdAt", record.getCreatedAt());
        response.put("updatedAt", record.getUpdatedAt());

        // Add user details if available
        if (record.getPatientUserID() != null) {
            userRepository.findById(record.getPatientUserID()).ifPresent(user -> {
                response.put("patientUsername", user.getUsername());
                response.put("patientEmail", user.getEmail());
            });
        }

        return response;
    }
}
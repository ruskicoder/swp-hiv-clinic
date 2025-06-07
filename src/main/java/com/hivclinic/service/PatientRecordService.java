package com.hivclinic.service;

import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.PatientRecord;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.PatientRecordRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);

            if (recordOpt.isEmpty()) {
                // Check if user exists before creating new record
                if (!userRepository.existsById(patientUserId)) {
                    logger.warn("Patient with ID {} not found", patientUserId);
                    return Map.of(
                            "success", false,
                            "message", "Patient not found"
                    );
                }

                // Create new record if none exists
                PatientRecord newRecord = new PatientRecord(patientUserId);
                patientRecordRepository.save(newRecord);
                return enrichRecordWithUserData(newRecord);
            }

            return enrichRecordWithUserData(recordOpt.get());

        } catch (Exception e) {
            logger.error("Error getting patient record: {}", e.getMessage(), e);
            return Map.of(
                    "success", false,
                    "message", "Failed to get patient record: " + e.getMessage()
            );
        }
    }

    /**
     * Get patient record for appointment with access control and data validation
     */
    public Map<String, Object> getPatientRecordForAppointment(Integer appointmentId, Integer doctorUserId) throws SecurityException {
        try {
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

            // Get patient record using correct repository method
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByAppointmentId(appointmentId);

            if (recordOpt.isEmpty()) {
                // Create new record if none exists
                PatientRecord newRecord = new PatientRecord(appointment.getPatientUser().getUserId());
                newRecord.setAppointmentId(appointmentId);
                patientRecordRepository.save(newRecord);
                return mapRecordToResponse(newRecord);
            }

            Map<String, Object> response = mapRecordToResponse(recordOpt.get());

            // Add ARV treatments to response
            List<Map<String, Object>> treatments = arvTreatmentService.getPatientTreatments(
                appointment.getPatientUser().getUserId());
            response.put("arvTreatments", treatments);

            return response;

        } catch (SecurityException e) {
            throw e; // Re-throw security exceptions for proper handling
        } catch (Exception e) {
            logger.error("Error getting patient record for appointment: {}", e.getMessage(), e);
            return Map.of(
                    "success", false,
                    "message", "Failed to get patient record: " + e.getMessage()
            );
        }
    }

    /**
     * Helper method to enrich record with user data
     */
    private Map<String, Object> enrichRecordWithUserData(PatientRecord record) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("recordId", record.getRecordID());
        response.put("patientUserID", record.getPatientUserID());
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

        // Add user details with null checks
        userRepository.findById(record.getPatientUserID()).ifPresent(user -> {
            response.put("patientUsername", user.getUsername());
            response.put("patientEmail", user.getEmail());
            response.put("patientName", String.format("%s %s",
                    user.getFirstName() != null ? user.getFirstName() : "",
                    user.getLastName() != null ? user.getLastName() : "").trim());
            if (user.getRole() != null) {
                response.put("patientRole", user.getRole().getRoleName());
            }
        });

        return response;
    }

    /**
     * Update patient record with validation and response
     */
    @Transactional
    public MessageResponse updatePatientRecordWithResponse(Integer patientUserId, Map<String, Object> recordData) {
        try {
            logger.debug("Updating patient record for patient ID: {}", patientUserId);

            Optional<PatientRecord> recordOpt = getPatientRecord(patientUserId);
            PatientRecord record = recordOpt.orElseGet(() -> new PatientRecord(patientUserId));

            // Update fields if present in recordData
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
            logger.info("Successfully updated patient record for patient ID: {}", patientUserId);

            return MessageResponse.success("Patient record updated successfully");
        } catch (Exception e) {
            logger.error("Error updating patient record: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update patient record: " + e.getMessage());
        }
    }

    /**
     * Update patient profile image
     */
    @Transactional
    public void updateProfileImage(Integer patientUserId, String base64Image) {
        logger.debug("Updating profile image for patient ID: {}", patientUserId);

        Optional<PatientRecord> recordOpt = getPatientRecord(patientUserId);
        PatientRecord record = recordOpt.orElseGet(() -> new PatientRecord(patientUserId));

        record.setProfileImageBase64(base64Image);
        record.setUpdatedAt(LocalDateTime.now());

        patientRecordRepository.save(record);
        logger.info("Successfully updated profile image for patient ID: {}", patientUserId);
    }

    /**
     * Helper method to map PatientRecord to response map
     */
    private Map<String, Object> mapRecordToResponse(PatientRecord record) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("recordId", record.getRecordID());
        response.put("patientUserID", record.getPatientUserID());
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

        // Add user details with null checks
        userRepository.findById(record.getPatientUserID()).ifPresent(user -> {
            response.put("patientUsername", user.getUsername());
            response.put("patientEmail", user.getEmail());
            response.put("patientName", String.format("%s %s",
                    user.getFirstName() != null ? user.getFirstName() : "",
                    user.getLastName() != null ? user.getLastName() : "").trim());
            if (user.getRole() != null) {
                response.put("patientRole", user.getRole().getRoleName());
            }
        });

        return response;
    }
}

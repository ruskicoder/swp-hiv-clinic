package com.hivclinic.service;

import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.PatientProfile;
import com.hivclinic.model.PatientRecord;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.PatientProfileRepository;
import com.hivclinic.repository.PatientRecordRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing patient medical records
 */
@Service
public class PatientRecordService {

    private static final Logger logger = LoggerFactory.getLogger(PatientRecordService.class);

    @Autowired
    private PatientRecordRepository patientRecordRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    /**
     * Get patient record by user ID
     */
    public Map<String, Object> getPatientRecord(Integer userId) {
        logger.debug("Fetching patient record for user ID: {}", userId);
        
        try {
            // Verify user exists and is a patient
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                logger.error("User not found with ID: {}", userId);
                throw new RuntimeException("User not found");
            }
            
            User user = userOpt.get();
            if (!"Patient".equalsIgnoreCase(user.getRole().getRoleName())) {
                logger.error("User {} is not a patient", userId);
                throw new RuntimeException("User is not a patient");
            }

            // Get or create patient record
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(userId);
            PatientRecord record = recordOpt.orElseGet(() -> {
                PatientRecord newRecord = new PatientRecord(userId);
                return patientRecordRepository.save(newRecord);
            });

            // Convert to map
            Map<String, Object> result = new HashMap<>();
            result.put("recordId", record.getRecordID());
            result.put("medicalHistory", record.getMedicalHistory());
            result.put("allergies", record.getAllergies());
            result.put("currentMedications", record.getCurrentMedications());
            result.put("notes", record.getNotes());
            result.put("bloodType", record.getBloodType());
            result.put("emergencyContact", record.getEmergencyContact());
            result.put("emergencyPhone", record.getEmergencyPhone());
            result.put("profileImageBase64", record.getProfileImageBase64());
            result.put("createdAt", record.getCreatedAt());
            result.put("updatedAt", record.getUpdatedAt());

            return result;

        } catch (Exception e) {
            logger.error("Error fetching patient record for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to get patient record: " + e.getMessage());
        }
    }

    /**
     * Update patient record
     */
    @Transactional
    public MessageResponse updatePatientRecord(Integer userId, Map<String, Object> recordData) {
        logger.debug("Updating patient record for user ID: {} with data: {}", userId, recordData);

        try {
            // Fetch or create PatientRecord entity directly
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(userId);
            PatientRecord record = recordOpt.orElseGet(() -> {
                PatientRecord newRecord = new PatientRecord(userId);
                return patientRecordRepository.save(newRecord);
            });

            // Update fields if provided
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

            record.setUpdatedAt(LocalDateTime.now());
            PatientRecord savedRecord = patientRecordRepository.save(record);

            // Wrap in MessageResponse
            return MessageResponse.success("Patient record updated successfully", savedRecord);

        } catch (Exception e) {
            logger.error("Error updating patient record for user {}: {}", userId, e.getMessage(), e);
            return MessageResponse.error("Failed to update patient record: " + e.getMessage());
        }
    }

    /**
     * Update patient profile image
     */
    @Transactional
    public MessageResponse updateProfileImage(Integer userId, String base64Image) {
        logger.debug("Updating profile image for user ID: {}", userId);

        try {
            // Fetch or create PatientRecord entity directly
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(userId);
            PatientRecord record = recordOpt.orElseGet(() -> {
                PatientRecord newRecord = new PatientRecord(userId);
                return patientRecordRepository.save(newRecord);
            });
            record.setProfileImageBase64(base64Image);
            record.setUpdatedAt(LocalDateTime.now());
            patientRecordRepository.save(record);
            return MessageResponse.success("Profile image uploaded successfully");
        } catch (Exception e) {
            logger.error("Error updating profile image for user {}: {}", userId, e.getMessage(), e);
            return MessageResponse.error("Failed to update profile image: " + e.getMessage());
        }
    }

    /**
     * Get patient record for appointment
     */
    public Map<String, Object> getPatientRecordForAppointment(Integer appointmentId, Integer doctorUserId) {
        try {
            logger.debug("Getting patient record for appointment ID: {} by doctor ID: {}", appointmentId, doctorUserId);
            
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                logger.error("Appointment not found with ID: {}", appointmentId);
                throw new RuntimeException("Appointment not found");
            }

            Appointment appointment = appointmentOpt.get();

            // Check if doctor has permission to access
            if (!appointment.getDoctorUser().getUserId().equals(doctorUserId)) {
                logger.error("Doctor {} unauthorized to access appointment {}", doctorUserId, appointmentId);
                throw new RuntimeException("Access denied");
            }

            // Get patient record
            Integer patientUserId = appointment.getPatientUser().getUserId();
            logger.debug("Fetching record for patient ID: {}", patientUserId);
            
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            Optional<PatientProfile> profileOpt = patientProfileRepository.findByUser(appointment.getPatientUser());
            
            Map<String, Object> result = new HashMap<>();
            
            // Add patient basic info first
            User patient = appointment.getPatientUser();
            result.put("patientId", patient.getUserId());
            result.put("patientUsername", patient.getUsername());
            result.put("patientEmail", patient.getEmail());

            // Add profile information if exists
            if (profileOpt.isPresent()) {
                PatientProfile profile = profileOpt.get();
                result.put("firstName", profile.getFirstName());
                result.put("lastName", profile.getLastName());
                result.put("dateOfBirth", profile.getDateOfBirth());
                result.put("phoneNumber", profile.getPhoneNumber());
                result.put("address", profile.getAddress());
                result.put("profileImageBase64", profile.getProfileImageBase64());
            }
            
            // Add medical record if exists
            if (recordOpt.isPresent()) {
                PatientRecord record = recordOpt.get();
                result.put("recordId", record.getRecordID());
                result.put("medicalHistory", record.getMedicalHistory());
                result.put("allergies", record.getAllergies());
                result.put("currentMedications", record.getCurrentMedications());
                result.put("notes", record.getNotes());
                result.put("bloodType", record.getBloodType());
                result.put("emergencyContact", record.getEmergencyContact());
                result.put("emergencyPhone", record.getEmergencyPhone());
                result.put("createdAt", record.getCreatedAt());
                result.put("updatedAt", record.getUpdatedAt());
            } else {
                // Create placeholder for medical record
                logger.debug("No medical record found for patient {}, creating placeholder", patientUserId);
                result.put("recordId", null);
                result.put("medicalHistory", "");
                result.put("allergies", "");
                result.put("currentMedications", "");
                result.put("notes", "");
                result.put("bloodType", "");
                result.put("emergencyContact", "");
                result.put("emergencyPhone", "");
            }

            return result;

        } catch (Exception e) {
            logger.error("Error getting patient record for appointment {}: {}", appointmentId, e.getMessage(), e);
            throw new RuntimeException("Failed to get patient record: " + e.getMessage());
        }
    }

    public PatientRecord getPatientRecordByAppointment(Integer appointmentId) {
        return patientRecordRepository.findByAppointmentId(appointmentId)
            .orElseThrow(() -> new RuntimeException("Patient record not found"));
    }

    public PatientRecord getPatientRecordByPatientId(Integer patientId) {
        return patientRecordRepository.findByPatientUserID(patientId)
            .orElseThrow(() -> new RuntimeException("Patient record not found"));
    }
}

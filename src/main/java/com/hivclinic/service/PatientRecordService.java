package com.hivclinic.service;

import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.PatientProfile;
import com.hivclinic.model.PatientRecord;
import com.hivclinic.model.User;
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

    /**
     * Get patient record by user ID
     */
    public Map<String, Object> getPatientRecord(Integer userId) {
        logger.debug("Fetching patient record for user ID: {}", userId);

        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();
        
        // Get or create patient record
        Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(userId);
        PatientRecord record;
        
        if (recordOpt.isEmpty()) {
            // Create new record if doesn't exist
            record = new PatientRecord();
            record.setPatientUserID(userId);
            record.setCreatedAt(LocalDateTime.now());
            record.setUpdatedAt(LocalDateTime.now());
            record = patientRecordRepository.save(record);
            logger.info("Created new patient record for user ID: {}", userId);
        } else {
            record = recordOpt.get();
        }

        // Get patient profile
        Optional<PatientProfile> profileOpt = patientProfileRepository.findByUser(user);
        
        Map<String, Object> result = new HashMap<>();
        result.put("recordId", record.getRecordID());
        result.put("patientUserId", record.getPatientUserID());
        result.put("medicalHistory", record.getMedicalHistory());
        result.put("allergies", record.getAllergies());
        result.put("currentMedications", record.getCurrentMedications());
        result.put("notes", record.getNotes());
        result.put("bloodType", record.getBloodType());
        result.put("emergencyContact", record.getEmergencyContact());
        result.put("emergencyPhone", record.getEmergencyPhone());
        result.put("createdAt", record.getCreatedAt());
        result.put("updatedAt", record.getUpdatedAt());
        
        // Add profile information
        if (profileOpt.isPresent()) {
            PatientProfile profile = profileOpt.get();
            result.put("firstName", profile.getFirstName());
            result.put("lastName", profile.getLastName());
            result.put("dateOfBirth", profile.getDateOfBirth());
            result.put("phoneNumber", profile.getPhoneNumber());
            result.put("address", profile.getAddress());
            result.put("profileImageBase64", profile.getProfileImageBase64());
        }

        return result;
    }

    /**
     * Update patient record
     */
    @Transactional
    public MessageResponse updatePatientRecord(Integer userId, Map<String, Object> recordData) {
        try {
            logger.info("Updating patient record for user ID: {}", userId);

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return MessageResponse.error("User not found");
            }

            // Get or create patient record
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(userId);
            PatientRecord record;
            
            if (recordOpt.isEmpty()) {
                record = new PatientRecord();
                record.setPatientUserID(userId);
                record.setCreatedAt(LocalDateTime.now());
            } else {
                record = recordOpt.get();
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

            record.setUpdatedAt(LocalDateTime.now());
            patientRecordRepository.save(record);

            logger.info("Patient record updated successfully for user ID: {}", userId);
            return MessageResponse.success("Patient record updated successfully");

        } catch (Exception e) {
            logger.error("Error updating patient record for user ID {}: {}", userId, e.getMessage(), e);
            return MessageResponse.error("Failed to update patient record: " + e.getMessage());
        }
    }

    /**
     * Update profile image
     */
    @Transactional
    public MessageResponse updateProfileImage(Integer userId, String base64Image) {
        try {
            logger.info("Updating profile image for user ID: {}", userId);

            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) {
                return MessageResponse.error("User not found");
            }

            User user = userOpt.get();
            Optional<PatientProfile> profileOpt = patientProfileRepository.findByUser(user);
            
            if (profileOpt.isEmpty()) {
                return MessageResponse.error("Patient profile not found");
            }

            PatientProfile profile = profileOpt.get();
            
            // Validate base64 image (basic validation)
            String trimmed = base64Image == null ? "" : base64Image.trim();
            if (trimmed.isEmpty() || !trimmed.startsWith("data:image/")) {
                return MessageResponse.error("Invalid image format");
            }

            profile.setProfileImageBase64(trimmed);
            patientProfileRepository.save(profile);

            logger.info("Profile image updated successfully for user ID: {}", userId);
            return MessageResponse.success("Profile image updated successfully");

        } catch (Exception e) {
            logger.error("Error updating profile image for user ID {}: {}", userId, e.getMessage(), e);
            return MessageResponse.error("Failed to update profile image: " + e.getMessage());
        }
    }
}

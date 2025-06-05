package com.hivclinic.service;

import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.ARVTreatment;
import com.hivclinic.model.User;
import com.hivclinic.repository.ARVTreatmentRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service for managing ARV treatments
 */
@Service
public class ARVTreatmentService {

    private static final Logger logger = LoggerFactory.getLogger(ARVTreatmentService.class);

    @Autowired
    private ARVTreatmentRepository arvTreatmentRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all ARV treatments for a patient
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPatientTreatments(Integer patientUserId) {
        logger.debug("Fetching ARV treatments for patient ID: {}", patientUserId);
        
        List<ARVTreatment> treatments = arvTreatmentRepository.findByPatientUserIDOrderByCreatedAtDesc(patientUserId);
        
        return treatments.stream()
                .map(this::mapTreatmentToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get active ARV treatments for a patient
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getActivePatientTreatments(Integer patientUserId) {
        logger.debug("Fetching active ARV treatments for patient ID: {}", patientUserId);
        
        List<ARVTreatment> treatments = arvTreatmentRepository.findActiveByPatientUserID(patientUserId);
        
        return treatments.stream()
                .map(this::mapTreatmentToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Add a new ARV treatment
     */
    @Transactional
    public MessageResponse addTreatment(Map<String, Object> treatmentData, Integer doctorUserId) {
        try {
            logger.info("Adding new ARV treatment by doctor ID: {}", doctorUserId);

            // Validate required fields
            if (!treatmentData.containsKey("patientUserId") || !treatmentData.containsKey("regimen") || 
                !treatmentData.containsKey("startDate")) {
                return MessageResponse.error("Patient ID, regimen, and start date are required");
            }

            Integer patientUserId = (Integer) treatmentData.get("patientUserId");

            // Verify patient exists
            Optional<User> patientOpt = userRepository.findById(patientUserId);
            if (patientOpt.isEmpty()) {
                return MessageResponse.error("Patient not found");
            }

            // Verify doctor exists
            Optional<User> doctorOpt = userRepository.findById(doctorUserId);
            if (doctorOpt.isEmpty()) {
                return MessageResponse.error("Doctor not found");
            }

            ARVTreatment treatment = new ARVTreatment();
            treatment.setPatientUserID(patientUserId);
            treatment.setDoctorUserID(doctorUserId);
            treatment.setRegimen((String) treatmentData.get("regimen"));

            // Parse start date
            String startDateStr = (String) treatmentData.get("startDate");
            treatment.setStartDate(LocalDate.parse(startDateStr));

            // Parse end date if provided
            if (treatmentData.containsKey("endDate") && treatmentData.get("endDate") != null) {
                String endDateStr = (String) treatmentData.get("endDate");
                if (!endDateStr.trim().isEmpty()) {
                    treatment.setEndDate(LocalDate.parse(endDateStr));
                }
            }

            // Set optional fields
            if (treatmentData.containsKey("adherence")) {
                treatment.setAdherence((String) treatmentData.get("adherence"));
            }

            if (treatmentData.containsKey("sideEffects")) {
                treatment.setSideEffects((String) treatmentData.get("sideEffects"));
            }

            if (treatmentData.containsKey("notes")) {
                treatment.setNotes((String) treatmentData.get("notes"));
            }

            // Set appointment ID if provided (for appointment-based treatments)
            if (treatmentData.containsKey("appointmentId") && treatmentData.get("appointmentId") != null) {
                treatment.setAppointmentID((Integer) treatmentData.get("appointmentId"));
            }

            // Set as active by default
            treatment.setIsActive(true);
            treatment.setCreatedAt(LocalDateTime.now());
            treatment.setUpdatedAt(LocalDateTime.now());

            arvTreatmentRepository.save(treatment);

            logger.info("ARV treatment added successfully for patient ID: {} by doctor ID: {}", patientUserId, doctorUserId);
            return MessageResponse.success("ARV treatment added successfully!");

        } catch (Exception e) {
            logger.error("Error adding ARV treatment: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to add ARV treatment: " + e.getMessage());
        }
    }

    /**
     * Update an existing ARV treatment
     */
    @Transactional
    public MessageResponse updateTreatment(Integer treatmentId, Map<String, Object> treatmentData, Integer doctorUserId) {
        try {
            logger.info("Updating ARV treatment ID: {} by doctor ID: {}", treatmentId, doctorUserId);

            Optional<ARVTreatment> treatmentOpt = arvTreatmentRepository.findById(treatmentId);
            if (treatmentOpt.isEmpty()) {
                return MessageResponse.error("ARV treatment not found");
            }

            ARVTreatment treatment = treatmentOpt.get();

            // Verify doctor has permission to update
            if (!treatment.getDoctorUserID().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to update this treatment");
            }

            // Update fields if provided
            if (treatmentData.containsKey("regimen")) {
                treatment.setRegimen((String) treatmentData.get("regimen"));
            }

            if (treatmentData.containsKey("startDate")) {
                String startDateStr = (String) treatmentData.get("startDate");
                treatment.setStartDate(LocalDate.parse(startDateStr));
            }

            if (treatmentData.containsKey("endDate")) {
                String endDateStr = (String) treatmentData.get("endDate");
                if (endDateStr != null && !endDateStr.trim().isEmpty()) {
                    treatment.setEndDate(LocalDate.parse(endDateStr));
                } else {
                    treatment.setEndDate(null);
                }
            }

            if (treatmentData.containsKey("adherence")) {
                treatment.setAdherence((String) treatmentData.get("adherence"));
            }

            if (treatmentData.containsKey("sideEffects")) {
                treatment.setSideEffects((String) treatmentData.get("sideEffects"));
            }

            if (treatmentData.containsKey("notes")) {
                treatment.setNotes((String) treatmentData.get("notes"));
            }

            treatment.setUpdatedAt(LocalDateTime.now());
            arvTreatmentRepository.save(treatment);

            logger.info("ARV treatment ID: {} updated successfully", treatmentId);
            return MessageResponse.success("ARV treatment updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating ARV treatment: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update ARV treatment: " + e.getMessage());
        }
    }

    /**
     * Deactivate an ARV treatment
     */
    @Transactional
    public MessageResponse deactivateTreatment(Integer treatmentId, Integer doctorUserId) {
        try {
            logger.info("Deactivating ARV treatment ID: {} by doctor ID: {}", treatmentId, doctorUserId);

            Optional<ARVTreatment> treatmentOpt = arvTreatmentRepository.findById(treatmentId);
            if (treatmentOpt.isEmpty()) {
                return MessageResponse.error("ARV treatment not found");
            }

            ARVTreatment treatment = treatmentOpt.get();

            // Verify doctor has permission to deactivate
            if (!treatment.getDoctorUserID().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to deactivate this treatment");
            }

            treatment.setIsActive(false);
            treatment.setEndDate(LocalDate.now());
            treatment.setUpdatedAt(LocalDateTime.now());

            arvTreatmentRepository.save(treatment);

            logger.info("ARV treatment ID: {} deactivated successfully", treatmentId);
            return MessageResponse.success("ARV treatment deactivated successfully!");

        } catch (Exception e) {
            logger.error("Error deactivating ARV treatment: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to deactivate ARV treatment: " + e.getMessage());
        }
    }

    /**
     * Get ARV treatments for a specific appointment
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTreatmentsByAppointment(Integer appointmentId) {
        logger.debug("Fetching ARV treatments for appointment ID: {}", appointmentId);
        
        List<ARVTreatment> treatments = arvTreatmentRepository.findByAppointmentID(appointmentId);
        
        return treatments.stream()
                .map(this::mapTreatmentToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Map ARVTreatment entity to response format
     */
    private Map<String, Object> mapTreatmentToResponse(ARVTreatment treatment) {
        Map<String, Object> response = new HashMap<>();
        response.put("arvTreatmentId", treatment.getArvTreatmentID());
        response.put("patientUserId", treatment.getPatientUserID());
        response.put("doctorUserId", treatment.getDoctorUserID());
        response.put("appointmentId", treatment.getAppointmentID());
        response.put("regimen", treatment.getRegimen());
        response.put("startDate", treatment.getStartDate());
        response.put("endDate", treatment.getEndDate());
        response.put("adherence", treatment.getAdherence());
        response.put("sideEffects", treatment.getSideEffects());
        response.put("notes", treatment.getNotes());
        response.put("isActive", treatment.getIsActive());
        response.put("createdAt", treatment.getCreatedAt());
        response.put("updatedAt", treatment.getUpdatedAt());

        // Add doctor name if available
        if (treatment.getDoctorUserID() != null) {
            Optional<User> doctorOpt = userRepository.findById(treatment.getDoctorUserID());
            if (doctorOpt.isPresent()) {
                User doctor = doctorOpt.get();
                response.put("doctorName", "Dr. " + doctor.getUsername());
            }
        }

        return response;
    }
}
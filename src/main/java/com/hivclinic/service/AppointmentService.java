package com.hivclinic.service;

import com.hivclinic.dto.request.AppointmentBookingRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.PatientRecord;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.DoctorAvailabilitySlotRepository;
import com.hivclinic.repository.DoctorProfileRepository;
import com.hivclinic.repository.PatientRecordRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing appointments
 */
@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DoctorAvailabilitySlotRepository availabilitySlotRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private PatientRecordRepository patientRecordRepository;

    /**
     * Book an appointment
     */
    @Transactional
    public MessageResponse bookAppointment(AppointmentBookingRequest request, Integer patientUserId) {
        try {
            // Validate patient exists
            Optional<User> patientOpt = userRepository.findById(patientUserId);
            if (patientOpt.isEmpty()) {
                return MessageResponse.error("Patient not found");
            }
            User patient = patientOpt.get();

            // Validate doctor exists
            Optional<User> doctorOpt = userRepository.findById(request.getDoctorUserId());
            if (doctorOpt.isEmpty()) {
                return MessageResponse.error("Doctor not found");
            }
            User doctor = doctorOpt.get();

            // Validate doctor role
            if (!"Doctor".equalsIgnoreCase(doctor.getRole().getRoleName())) {
                return MessageResponse.error("Selected user is not a doctor");
            }

            // Check if appointment time is in the future
            if (request.getAppointmentDateTime().isBefore(LocalDateTime.now())) {
                return MessageResponse.error("Appointment time must be in the future");
            }

            // Check for conflicting appointments for the patient
            List<Appointment> patientAppointments = appointmentRepository
                    .findByPatientUserAndAppointmentDateTimeAfter(patient, LocalDateTime.now());
            boolean hasConflict = patientAppointments.stream()
                    .anyMatch(apt -> Math.abs(apt.getAppointmentDateTime().compareTo(request.getAppointmentDateTime())) < 1);

            if (hasConflict) {
                return MessageResponse.error("You already have an appointment at this time");
            }

            // Check for conflicting appointments for the doctor
            List<Appointment> doctorAppointments = appointmentRepository.findByDoctorUser(doctor);
            boolean doctorHasConflict = doctorAppointments.stream()
                    .anyMatch(apt -> Math.abs(apt.getAppointmentDateTime().compareTo(request.getAppointmentDateTime())) < 1);

            if (doctorHasConflict) {
                return MessageResponse.error("Doctor is not available at this time");
            }

            // Handle availability slot if provided
            DoctorAvailabilitySlot availabilitySlot = null;
            if (request.getAvailabilitySlotId() != null) {
                Optional<DoctorAvailabilitySlot> slotOpt = availabilitySlotRepository
                        .findById(request.getAvailabilitySlotId());
                
                if (slotOpt.isPresent()) {
                    availabilitySlot = slotOpt.get();
                    
                    // Validate slot belongs to the doctor
                    if (!availabilitySlot.getDoctorUser().getUserId().equals(doctor.getUserId())) {
                        return MessageResponse.error("Availability slot does not belong to the selected doctor");
                    }
                    
                    // Check if slot is already booked
                    if (availabilitySlot.getIsBooked()) {
                        return MessageResponse.error("This time slot is already booked");
                    }
                    
                    // Mark slot as booked
                    availabilitySlot.setIsBooked(true);
                    availabilitySlotRepository.save(availabilitySlot);
                }
            }

            // Create appointment
            Appointment appointment = new Appointment();
            appointment.setPatientUser(patient);
            appointment.setDoctorUser(doctor);
            appointment.setAppointmentDateTime(request.getAppointmentDateTime());
            appointment.setDurationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 30);
            appointment.setStatus("Scheduled");
            appointment.setAvailabilitySlot(availabilitySlot);

            // Save appointment
            appointmentRepository.save(appointment);

            logger.info("Appointment booked successfully for patient: {} with doctor: {}", 
                        patient.getUsername(), doctor.getUsername());
            return MessageResponse.success("Appointment booked successfully!");

        } catch (Exception e) {
            logger.error("Error booking appointment: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to book appointment: " + e.getMessage());
        }
    }

    /**
     * Get all appointments for a patient
     */
    @Transactional(readOnly = true)
    public List<Appointment> getPatientAppointments(Integer patientUserId) {
        Optional<User> patientOpt = userRepository.findById(patientUserId);
        if (patientOpt.isEmpty()) {
            throw new RuntimeException("Patient not found");
        }
        
        List<Appointment> appointments = appointmentRepository.findByPatientUser(patientOpt.get());
        
        // Force initialization of lazy-loaded entities to prevent serialization issues
        appointments.forEach(appointment -> {
            // Initialize lazy-loaded entities
            if (appointment.getPatientUser() != null) {
                appointment.getPatientUser().getUsername(); // Force initialization
                if (appointment.getPatientUser().getRole() != null) {
                    appointment.getPatientUser().getRole().getRoleName(); // Force initialization
                }
            }
            if (appointment.getDoctorUser() != null) {
                appointment.getDoctorUser().getUsername(); // Force initialization
                if (appointment.getDoctorUser().getRole() != null) {
                    appointment.getDoctorUser().getRole().getRoleName(); // Force initialization
                }
                // Attach doctor profile info for display
                doctorProfileRepository.findByUser(appointment.getDoctorUser()).ifPresent(profile -> {
                    appointment.getDoctorUser().setFirstName(profile.getFirstName());
                    appointment.getDoctorUser().setLastName(profile.getLastName());
                    if (profile.getSpecialty() != null) {
                        appointment.getDoctorUser().setSpecialty(profile.getSpecialty().getSpecialtyName());
                    }
                });
            }
            if (appointment.getAvailabilitySlot() != null) {
                appointment.getAvailabilitySlot().getSlotDate(); // Force initialization
            }
        });
        
        return appointments;
    }

    /**
     * Get upcoming appointments for a patient
     */
    @Transactional(readOnly = true)
    public List<Appointment> getPatientUpcomingAppointments(Integer patientUserId) {
        Optional<User> patientOpt = userRepository.findById(patientUserId);
        if (patientOpt.isEmpty()) {
            throw new RuntimeException("Patient not found");
        }
        
        List<Appointment> appointments = appointmentRepository.findByPatientUserAndAppointmentDateTimeAfter(
                patientOpt.get(), LocalDateTime.now());
        
        // Force initialization of lazy-loaded entities
        appointments.forEach(appointment -> {
            if (appointment.getPatientUser() != null) {
                appointment.getPatientUser().getUsername();
                if (appointment.getPatientUser().getRole() != null) {
                    appointment.getPatientUser().getRole().getRoleName();
                }
            }
            if (appointment.getDoctorUser() != null) {
                appointment.getDoctorUser().getUsername();
                if (appointment.getDoctorUser().getRole() != null) {
                    appointment.getDoctorUser().getRole().getRoleName();
                }
                // Attach doctor profile info for display
                doctorProfileRepository.findByUser(appointment.getDoctorUser()).ifPresent(profile -> {
                    appointment.getDoctorUser().setFirstName(profile.getFirstName());
                    appointment.getDoctorUser().setLastName(profile.getLastName());
                    if (profile.getSpecialty() != null) {
                        appointment.getDoctorUser().setSpecialty(profile.getSpecialty().getSpecialtyName());
                    }
                });
            }
        });
        
        return appointments;
    }

    /**
     * Get appointments for a doctor
     */
    @Transactional(readOnly = true)
    public List<Appointment> getDoctorAppointments(Integer doctorUserId) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }
        
        List<Appointment> appointments = appointmentRepository.findByDoctorUser(doctorOpt.get());
        
        // Force initialization of lazy-loaded entities
        appointments.forEach(appointment -> {
            if (appointment.getPatientUser() != null) {
                appointment.getPatientUser().getUsername();
                if (appointment.getPatientUser().getRole() != null) {
                    appointment.getPatientUser().getRole().getRoleName();
                }
            }
            if (appointment.getDoctorUser() != null) {
                appointment.getDoctorUser().getUsername();
                if (appointment.getDoctorUser().getRole() != null) {
                    appointment.getDoctorUser().getRole().getRoleName();
                }
            }
        });
        
        return appointments;
    }

    /**
     * Cancel an appointment
     */
    @Transactional
    public MessageResponse cancelAppointment(Integer appointmentId, Integer userId, String cancellationReason) {
        try {
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return MessageResponse.error("Appointment not found");
            }

            Appointment appointment = appointmentOpt.get();

            // Check if user has permission to cancel
            boolean canCancel = appointment.getPatientUser().getUserId().equals(userId) ||
                               appointment.getDoctorUser().getUserId().equals(userId);
            
            if (!canCancel) {
                return MessageResponse.error("You don't have permission to cancel this appointment");
            }

            // Check if appointment is already cancelled or completed
            if ("Cancelled".equalsIgnoreCase(appointment.getStatus()) || 
                "Completed".equalsIgnoreCase(appointment.getStatus())) {
                return MessageResponse.error("Cannot cancel this appointment");
            }

            // Update appointment status
            appointment.setStatus("Cancelled");
            
            // Set cancellation reason based on who cancelled
            if (appointment.getPatientUser().getUserId().equals(userId)) {
                appointment.setPatientCancellationReason(cancellationReason);
            } else {
                appointment.setDoctorCancellationReason(cancellationReason);
            }

            // Free up the availability slot if it was linked
            if (appointment.getAvailabilitySlot() != null) {
                DoctorAvailabilitySlot slot = appointment.getAvailabilitySlot();
                slot.setIsBooked(false);
                availabilitySlotRepository.save(slot);
            }

            appointmentRepository.save(appointment);

            logger.info("Appointment {} cancelled by user {}", appointmentId, userId);
            return MessageResponse.success("Appointment cancelled successfully!");

        } catch (Exception e) {
            logger.error("Error cancelling appointment {}: {}", appointmentId, e.getMessage(), e);
            return MessageResponse.error("Failed to cancel appointment: " + e.getMessage());
        }
    }

    /**
     * Update appointment status (for doctors)
     */
    @Transactional
    public MessageResponse updateAppointmentStatus(Integer appointmentId, Integer doctorUserId, String status, 
                                                 String notes, Boolean scheduleRecheck, String recheckDateTime, 
                                                 Integer durationMinutes) {
        try {
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return MessageResponse.error("Appointment not found");
            }

            Appointment appointment = appointmentOpt.get();

            // Check if doctor has permission
            if (!appointment.getDoctorUser().getUserId().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to update this appointment");
            }

            // Update appointment details
            appointment.setStatus(status);
            appointment.setAppointmentNotes(notes);
            if (durationMinutes != null) {
                appointment.setDurationMinutes(durationMinutes);
            }

            appointmentRepository.save(appointment);

            // Handle recheck scheduling if requested
            if (Boolean.TRUE.equals(scheduleRecheck) && recheckDateTime != null) {
                try {
                    LocalDateTime recheckTime = LocalDateTime.parse(recheckDateTime, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                    
                    Appointment recheckAppointment = new Appointment();
                    recheckAppointment.setPatientUser(appointment.getPatientUser());
                    recheckAppointment.setDoctorUser(appointment.getDoctorUser());
                    recheckAppointment.setAppointmentDateTime(recheckTime);
                    recheckAppointment.setDurationMinutes(30);
                    recheckAppointment.setStatus("Scheduled");
                    recheckAppointment.setAppointmentNotes("Follow-up appointment");

                    appointmentRepository.save(recheckAppointment);
                    logger.info("Recheck appointment scheduled for {}", recheckTime);
                } catch (Exception e) {
                    logger.error("Error scheduling recheck appointment: {}", e.getMessage());
                    return MessageResponse.error("Appointment updated but failed to schedule recheck: " + e.getMessage());
                }
            }

            logger.info("Appointment {} status updated to {} by doctor {}", appointmentId, status, doctorUserId);
            return MessageResponse.success("Appointment updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating appointment status: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update appointment: " + e.getMessage());
        }
    }

    /**
     * Doctor can access patient record for an appointment if appointment is not completed
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getPatientRecordForAppointment(Integer appointmentId, Integer doctorUserId) {
        try {
            logger.debug("Doctor {} accessing patient record for appointment {}", doctorUserId, appointmentId);
            
            // Find appointment with patient details
            Optional<Appointment> appointmentOpt = appointmentRepository.findByIdWithPatient(appointmentId);
            if (appointmentOpt.isEmpty()) {
                logger.warn("Appointment not found: {}", appointmentId);
                throw new RuntimeException("Appointment not found");
            }

            Appointment appointment = appointmentOpt.get();
            
            // Verify doctor has permission to access this appointment
            if (!appointment.getDoctorUser().getUserId().equals(doctorUserId)) {
                logger.warn("Doctor {} attempted to access appointment {} belonging to doctor {}", 
                    doctorUserId, appointmentId, appointment.getDoctorUser().getUserId());
                throw new RuntimeException("Access denied: You don't have permission to access this appointment");
            }

            // Check if appointment is completed
            if ("Completed".equalsIgnoreCase(appointment.getStatus())) {
                logger.warn("Attempted to access patient record for completed appointment: {}", appointmentId);
                throw new RuntimeException("Cannot access patient record after appointment is completed");
            }

            // Get patient user ID
            Integer patientUserId = appointment.getPatientUser().getUserId();
            logger.debug("Fetching patient record for patient ID: {}", patientUserId);

            // Try to find existing patient record
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);
            
            Map<String, Object> result = new HashMap<>();
            
            // Add appointment details
            result.put("appointmentId", appointment.getAppointmentId());
            result.put("appointmentDateTime", appointment.getAppointmentDateTime());
            result.put("appointmentStatus", appointment.getStatus());
            result.put("appointmentNotes", appointment.getAppointmentNotes());
            result.put("durationMinutes", appointment.getDurationMinutes());

            // Add patient basic info
            User patient = appointment.getPatientUser();
            result.put("patientId", patient.getUserId());
            result.put("patientUsername", patient.getUsername());
            result.put("patientEmail", patient.getEmail());

            // Add patient record if exists, otherwise create a new one
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
                result.put("profileImageBase64", record.getProfileImageBase64());
                result.put("recordCreatedAt", record.getCreatedAt());
                result.put("recordUpdatedAt", record.getUpdatedAt());
                
                logger.info("Successfully retrieved existing patient record for appointment {}", appointmentId);
            } else {
                // Create a new patient record if none exists
                logger.info("No existing patient record found for patient {}, creating new record", patientUserId);
                
                PatientRecord newRecord = new PatientRecord();
                newRecord.setPatientUserID(patientUserId);
                newRecord.setAppointmentId(appointmentId);
                newRecord.setMedicalHistory("");
                newRecord.setAllergies("");
                newRecord.setCurrentMedications("");
                newRecord.setNotes("");
                newRecord.setBloodType("");
                newRecord.setEmergencyContact("");
                newRecord.setEmergencyPhone("");
                
                // Save the new record
                PatientRecord savedRecord = patientRecordRepository.save(newRecord);
                
                result.put("recordId", savedRecord.getRecordID());
                result.put("medicalHistory", savedRecord.getMedicalHistory());
                result.put("allergies", savedRecord.getAllergies());
                result.put("currentMedications", savedRecord.getCurrentMedications());
                result.put("notes", savedRecord.getNotes());
                result.put("bloodType", savedRecord.getBloodType());
                result.put("emergencyContact", savedRecord.getEmergencyContact());
                result.put("emergencyPhone", savedRecord.getEmergencyPhone());
                result.put("profileImageBase64", savedRecord.getProfileImageBase64());
                result.put("recordCreatedAt", savedRecord.getCreatedAt());
                result.put("recordUpdatedAt", savedRecord.getUpdatedAt());
                
                logger.info("Successfully created new patient record for appointment {}", appointmentId);
            }

            // Add success flag
            result.put("success", true);
            result.put("message", "Patient record retrieved successfully");

            return result;

        } catch (Exception e) {
            logger.error("Error retrieving patient record for appointment {}: {}", appointmentId, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", "Failed to load patient record: " + e.getMessage());
            return errorResult;
        }
    }
}
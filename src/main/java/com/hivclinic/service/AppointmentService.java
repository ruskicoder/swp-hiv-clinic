package com.hivclinic.service;

import com.hivclinic.dto.request.AppointmentBookingRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.AppointmentStatusHistory;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.PatientRecord;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.AppointmentStatusHistoryRepository;
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
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for managing appointments with enhanced date/time handling
 */
@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);
    
    // Comprehensive date/time formatters for consistent parsing
    private static final DateTimeFormatter[] SUPPORTED_FORMATTERS = {
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
        DateTimeFormatter.ISO_LOCAL_DATE_TIME,
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS")
    };

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

    @Autowired
    private AppointmentStatusHistoryRepository appointmentStatusHistoryRepository;

    /**
     * Enhanced date/time parsing with comprehensive format support
     */
    private LocalDateTime parseDateTime(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.trim().isEmpty()) {
            throw new IllegalArgumentException("Date/time string cannot be null or empty");
        }

        // Clean the input string
        String cleanDateTimeStr = dateTimeStr.trim();
        
        // Remove timezone indicators for local parsing
        if (cleanDateTimeStr.endsWith("Z")) {
            cleanDateTimeStr = cleanDateTimeStr.substring(0, cleanDateTimeStr.length() - 1);
        }
        
        // Remove timezone offset patterns
        cleanDateTimeStr = cleanDateTimeStr.replaceAll("[+-]\\d{2}:\\d{2}$", "");
        cleanDateTimeStr = cleanDateTimeStr.replaceAll("[+-]\\d{4}$", "");
        
        // Try each formatter
        for (DateTimeFormatter formatter : SUPPORTED_FORMATTERS) {
            try {
                LocalDateTime result = LocalDateTime.parse(cleanDateTimeStr, formatter);
                logger.debug("Successfully parsed appointment date/time '{}' to {} using formatter {}", 
                    dateTimeStr, result, formatter.toString());
                return result;
            } catch (DateTimeParseException e) {
                logger.trace("Failed to parse '{}' with formatter {}: {}", 
                    cleanDateTimeStr, formatter.toString(), e.getMessage());
            }
        }
        
        // If all formatters fail
        logger.error("Unable to parse appointment date/time: '{}'. Supported formats: yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd HH:mm:ss, ISO formats", 
            dateTimeStr);
        
        throw new IllegalArgumentException(
            "Unable to parse date/time: " + dateTimeStr + 
            ". Expected format: yyyy-MM-ddTHH:mm:ss, yyyy-MM-dd HH:mm:ss, or ISO date-time format"
        );
    }

    /**
     * Book an appointment with enhanced validation and error handling
     */
    @Transactional
    public MessageResponse bookAppointment(AppointmentBookingRequest request, Integer patientUserId) {
        try {
            logger.info("Processing booking request: {}", request);

            // Validate request data
            if (!isValidBookingRequest(request)) {
                logger.error("Invalid booking request data: {}", request);
                return MessageResponse.error("Invalid booking request data");
            }

            // Parse appointment date time
            LocalDateTime appointmentDateTime;
            try {
                appointmentDateTime = LocalDateTime.parse(request.getAppointmentDateTime(), 
                    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            } catch (Exception e) {
                logger.error("Failed to parse appointment date time: {}", request.getAppointmentDateTime());
                return MessageResponse.error("Invalid appointment date time format");
            }

            // Validate appointment is in the future (with 5-minute buffer)
            LocalDateTime minimumTime = LocalDateTime.now().plusMinutes(5);
            if (appointmentDateTime.isBefore(minimumTime)) {
                logger.warn("Appointment time {} is too close to current time", appointmentDateTime);
                return MessageResponse.error("Appointment must be at least 5 minutes in the future");
            }

            // Validate patient exists and has correct role
            Optional<User> patientOpt = userRepository.findById(patientUserId);
            if (patientOpt.isEmpty()) {
                logger.error("Patient not found with ID: {}", patientUserId);
                return MessageResponse.error("Patient not found");
            }
            User patient = patientOpt.get();

            if (!"Patient".equalsIgnoreCase(patient.getRole().getRoleName())) {
                logger.error("User {} is not a patient", patientUserId);
                return MessageResponse.error("User is not a patient");
            }

            // Validate doctor exists and has correct role
            Optional<User> doctorOpt = userRepository.findById(request.getDoctorUserId());
            if (doctorOpt.isEmpty()) {
                logger.error("Doctor not found with ID: {}", request.getDoctorUserId());
                return MessageResponse.error("Doctor not found");
            }
            User doctor = doctorOpt.get();

            if (!"Doctor".equalsIgnoreCase(doctor.getRole().getRoleName())) {
                logger.error("User {} is not a doctor", request.getDoctorUserId());
                return MessageResponse.error("Selected user is not a doctor");
            }

            // Check for conflicting appointments for patient
            List<Appointment> patientConflicts = appointmentRepository.findByPatientUserAndAppointmentDateTimeBetween(
                patient, 
                appointmentDateTime.minusMinutes(30), 
                appointmentDateTime.plusMinutes(30)
            );
            
            if (!patientConflicts.isEmpty()) {
                logger.warn("Patient {} already has appointment around time {}", patientUserId, appointmentDateTime);
                return MessageResponse.error("You already have an appointment around this time");
            }

            // Check for conflicting appointments for doctor
            List<Appointment> doctorConflicts = appointmentRepository.findByDoctorUserAndAppointmentDateTimeBetween(
                doctor, 
                appointmentDateTime.minusMinutes(30), 
                appointmentDateTime.plusMinutes(30)
            );
            
            if (!doctorConflicts.isEmpty()) {
                logger.warn("Doctor {} is not available at time {}", request.getDoctorUserId(), appointmentDateTime);
                return MessageResponse.error("Doctor is not available at this time");
            }

            // Handle availability slot validation and booking
            DoctorAvailabilitySlot availabilitySlot = null;
            Optional<DoctorAvailabilitySlot> slotOpt = availabilitySlotRepository
                    .findById(request.getAvailabilitySlotId());
            
            if (slotOpt.isEmpty()) {
                logger.error("Availability slot not found with ID: {}", request.getAvailabilitySlotId());
                return MessageResponse.error("Availability slot not found");
            }

            availabilitySlot = slotOpt.get();
            
            // Validate slot belongs to the doctor
            if (!availabilitySlot.getDoctorUser().getUserId().equals(doctor.getUserId())) {
                logger.error("Availability slot {} does not belong to doctor {}", 
                    request.getAvailabilitySlotId(), request.getDoctorUserId());
                return MessageResponse.error("Availability slot does not belong to the selected doctor");
            }
            
            // Check if slot is already booked
            if (availabilitySlot.getIsBooked()) {
                logger.warn("Availability slot {} is already booked", request.getAvailabilitySlotId());
                return MessageResponse.error("This time slot is already booked");
            }
            
            // Mark slot as booked
            availabilitySlot.setIsBooked(true);
            availabilitySlotRepository.save(availabilitySlot);

            // Create appointment
            Appointment appointment = new Appointment();
            appointment.setPatientUser(patient);
            appointment.setDoctorUser(doctor);
            appointment.setAppointmentDateTime(appointmentDateTime);
            appointment.setDurationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 30);
            appointment.setStatus("Scheduled");
            appointment.setAvailabilitySlot(availabilitySlot);

            // Save appointment
            Appointment savedAppointment = appointmentRepository.save(appointment);

            // Create status history entry
            createStatusHistory(savedAppointment, null, "Scheduled", "Appointment booked", patient);

            logger.info("Appointment booked successfully for patient: {} with doctor: {}", 
                        patient.getUsername(), doctor.getUsername());
            return MessageResponse.success("Appointment booked successfully!");

        } catch (Exception e) {
            logger.error("Error booking appointment:", e);
            return MessageResponse.error("Booking failed: " + e.getMessage());
        }
    }

    private boolean isValidBookingRequest(AppointmentBookingRequest request) {
        return request != null 
            && request.getDoctorUserId() != null
            && request.getAvailabilitySlotId() != null
            && request.getAppointmentDateTime() != null
            && request.getAppointmentDateTime().matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}");
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
        
        // Auto-cancel overdue appointments
        checkAndCancelOverdueAppointments(appointments);
        
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
        
        // Auto-cancel overdue appointments (in case any slipped through)
        checkAndCancelOverdueAppointments(appointments);
        
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
        
        // Auto-cancel overdue appointments
        checkAndCancelOverdueAppointments(appointments);
        
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
            if (appointment.getAvailabilitySlot() != null) {
                appointment.getAvailabilitySlot().getSlotDate();
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

            String oldStatus = appointment.getStatus();

            // Update appointment status
            appointment.setStatus("Cancelled");

            // Set cancellation reason based on who cancelled
            User cancelledBy = userRepository.findById(userId).orElse(null);
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

            // Create status history entry
            createStatusHistory(appointment, oldStatus, "Cancelled", cancellationReason, cancelledBy);

            logger.info("Appointment {} cancelled by user {}", appointmentId, userId);
            return MessageResponse.success("Appointment cancelled successfully!");

        } catch (Exception e) {
            logger.error("Error cancelling appointment {}: {}", appointmentId, e.getMessage(), e);
            return MessageResponse.error("Failed to cancel appointment: " + e.getMessage());
        }
    }

    /**
     * Update appointment status with improved date/time handling
     */
    @Transactional
    public MessageResponse updateAppointmentStatus(Integer appointmentId, Integer doctorUserId, 
            String status, String notes, Boolean scheduleRecheck, String recheckDateTime, Integer durationMinutes) {
        try {
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return MessageResponse.error("Appointment not found");
            }

            Appointment appointment = appointmentOpt.get();

            // Verify doctor has permission
            if (!appointment.getDoctorUser().getUserId().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to update this appointment");
            }

            String oldStatus = appointment.getStatus();

            // Update appointment
            appointment.setStatus(status);
            if (notes != null) {
                appointment.setAppointmentNotes(notes);
            }
            if (durationMinutes != null) {
                appointment.setDurationMinutes(durationMinutes);
            }

            appointmentRepository.save(appointment);

            // Create status history
            User doctor = userRepository.findById(doctorUserId).orElse(null);
            createStatusHistory(appointment, oldStatus, status, notes, doctor);

            // Handle recheck appointment if requested
            if (Boolean.TRUE.equals(scheduleRecheck) && recheckDateTime != null && !recheckDateTime.trim().isEmpty()) {
                try {
                    LocalDateTime recheckTime = parseDateTime(recheckDateTime);
                    
                    // Create recheck appointment
                    Appointment recheckAppointment = new Appointment();
                    recheckAppointment.setPatientUser(appointment.getPatientUser());
                    recheckAppointment.setDoctorUser(appointment.getDoctorUser());
                    recheckAppointment.setAppointmentDateTime(recheckTime);
                    recheckAppointment.setDurationMinutes(30); // Default duration for recheck
                    recheckAppointment.setStatus("Scheduled");
                    recheckAppointment.setAppointmentNotes("Recheck appointment");

                    Appointment savedRecheck = appointmentRepository.save(recheckAppointment);
                    createStatusHistory(savedRecheck, null, "Scheduled", "Recheck appointment scheduled", doctor);

                    logger.info("Recheck appointment scheduled for {}", recheckTime);
                } catch (Exception e) {
                    logger.error("Failed to schedule recheck appointment: {}", e.getMessage());
                    // Don't fail the main update if recheck scheduling fails
                }
            }

            logger.info("Appointment {} status updated to {} by doctor {}", appointmentId, status, doctorUserId);
            return MessageResponse.success("Appointment status updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating appointment status: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update appointment status: " + e.getMessage());
        }
    }

    /**
     * Get patient record for appointment
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
                Map<String, Object> completedResult = new HashMap<>();
                completedResult.put("success", false);
                completedResult.put("message", "Patient record is not available for completed appointments");
                return completedResult;
            }

            // Get patient user ID
            Integer patientUserId = appointment.getPatientUser().getUserId();
            logger.debug("Fetching patient record for patient ID: {}", patientUserId);

            // Try to find existing patient record
            Optional<PatientRecord> recordOpt = patientRecordRepository.findByPatientUserID(patientUserId);

            Map<String, Object> result = new HashMap<>();

            // Add appointment details with proper date/time formatting
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
                result.put("createdAt", record.getCreatedAt());
                result.put("updatedAt", record.getUpdatedAt());
            } else {
                // Create basic record structure
                result.put("recordId", null);
                result.put("medicalHistory", "");
                result.put("allergies", "");
                result.put("currentMedications", "");
                result.put("notes", "");
                result.put("bloodType", "");
                result.put("emergencyContact", "");
                result.put("emergencyPhone", "");
                result.put("profileImageBase64", null);
                result.put("createdAt", null);
                result.put("updatedAt", null);
            }

            result.put("success", true);
            return result;

        } catch (Exception e) {
            logger.error("Error getting patient record for appointment {}: {}", appointmentId, e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("message", e.getMessage());
            return errorResult;
        }
    }

    /**
     * Create status history entry
     */
    private void createStatusHistory(Appointment appointment, String oldStatus, String newStatus, 
            String reason, User changedBy) {
        try {
            AppointmentStatusHistory history = new AppointmentStatusHistory();
            history.setAppointment(appointment);
            history.setOldStatus(oldStatus);
            history.setNewStatus(newStatus);
            history.setChangeReason(reason);
            history.setChangedByUser(changedBy);
            appointmentStatusHistoryRepository.save(history);
        } catch (Exception e) {
            logger.error("Failed to create status history: {}", e.getMessage(), e);
        }
    }

    /**
     * Get appointment status history
     */
    @Transactional(readOnly = true)
    public List<AppointmentStatusHistory> getAppointmentStatusHistory(Integer appointmentId) {
        Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
        if (appointmentOpt.isEmpty()) {
            throw new RuntimeException("Appointment not found");
        }
        
        return appointmentStatusHistoryRepository.findByAppointmentOrderByChangedAtDesc(appointmentOpt.get());
    }

    /**
     * Auto-cancel overdue appointments
     */
    private void checkAndCancelOverdueAppointments(List<Appointment> appointments) {
        LocalDateTime now = LocalDateTime.now();
        appointments.forEach(appointment -> {
            if (("Scheduled".equals(appointment.getStatus()) || "In Progress".equals(appointment.getStatus())) 
                && appointment.getAppointmentDateTime().plusMinutes(appointment.getDurationMinutes()).isBefore(now)) {
                String oldStatus = appointment.getStatus();
                appointment.setStatus("Cancelled");
                appointment.setDoctorCancellationReason("Auto-cancelled: Appointment time passed");
                appointment = appointmentRepository.save(appointment);
                
                // Free up the availability slot if it was linked
                if (appointment.getAvailabilitySlot() != null) {
                    DoctorAvailabilitySlot slot = appointment.getAvailabilitySlot();
                    slot.setIsBooked(false);
                    availabilitySlotRepository.save(slot);
                }
                
                createStatusHistory(
                    appointment, 
                    oldStatus, 
                    "Cancelled", 
                    "Auto-cancelled: Appointment time passed",
                    null
                );
                logger.info("Auto-cancelled overdue appointment ID {} scheduled for {}", 
                    appointment.getAppointmentId(), appointment.getAppointmentDateTime());
            }
        });
    }
}
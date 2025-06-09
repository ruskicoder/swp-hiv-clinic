package com.hivclinic.service;

import com.hivclinic.dto.request.DoctorAvailabilityRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.DoctorAvailabilitySlotRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class DoctorAvailabilityService {

    private static final Logger logger = LoggerFactory.getLogger(DoctorAvailabilityService.class);

    @Autowired
    private DoctorAvailabilitySlotRepository availabilitySlotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    /**
     * Create a new availability slot for a doctor
     */
    @Transactional
    public MessageResponse createAvailabilitySlot(DoctorAvailabilityRequest request, Integer doctorUserId) {
        try {
            logger.info("Creating availability slot. Request: {}, Doctor ID: {}", request, doctorUserId);

            // Basic validation
            if (request == null || request.getSlotDate() == null || request.getStartTime() == null) {
                logger.error("Invalid request data: {}", request);
                return MessageResponse.error("Invalid request data");
            }

            // Find doctor with eager loading
            User doctor = userRepository.findById(doctorUserId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

            if (!"Doctor".equalsIgnoreCase(doctor.getRole().getRoleName())) {
                logger.error("User {} is not a doctor", doctorUserId);
                return MessageResponse.error("User is not a doctor");
            }

            // Calculate end time
            LocalTime endTime = request.getStartTime().plusMinutes(request.getDurationMinutes());

            // Business hours validation
            LocalTime businessStart = LocalTime.of(8, 0);
            LocalTime businessEnd = LocalTime.of(18, 0);
            if (request.getStartTime().isBefore(businessStart) || endTime.isAfter(businessEnd)) {
                return MessageResponse.error("Slots must be between 8:00 AM and 6:00 PM");
            }

            // Check for overlaps using repository method
            List<DoctorAvailabilitySlot> overlappingSlots = availabilitySlotRepository
                .findOverlappingSlots(doctor, request.getSlotDate(), request.getStartTime(), endTime);
                
            if (!overlappingSlots.isEmpty()) {
                return MessageResponse.error("This time slot overlaps with existing slot(s)");
            }

            // Create and save slot
            DoctorAvailabilitySlot slot = new DoctorAvailabilitySlot();
            slot.setDoctorUser(doctor);
            slot.setSlotDate(request.getSlotDate());
            slot.setStartTime(request.getStartTime());
            slot.setEndTime(endTime);
            slot.setIsBooked(false);
            slot.setNotes(request.getNotes());
            slot.setCreatedAt(LocalDateTime.now());
            slot.setUpdatedAt(LocalDateTime.now());

            DoctorAvailabilitySlot savedSlot = availabilitySlotRepository.saveAndFlush(slot);
            logger.info("Successfully created slot ID: {}", savedSlot.getAvailabilitySlotId());

            return MessageResponse.success("Availability slot created successfully");
            
        } catch (Exception e) {
            logger.error("Error creating availability slot: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create availability slot: " + e.getMessage());
        }
    }

    /**
     * Get all availability slots for a doctor with safe serialization
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorAvailability(Integer doctorUserId) {
        try {
            Optional<User> doctorOpt = userRepository.findById(doctorUserId);
            if (doctorOpt.isEmpty()) {
                logger.warn("Doctor not found with ID: {}", doctorUserId);
                return Collections.emptyList();
            }

            List<DoctorAvailabilitySlot> slots = availabilitySlotRepository
                    .findByDoctorUserOrderBySlotDateAscStartTimeAsc(doctorOpt.get());

            // Safely populate appointment details for booked slots
            safePopulateAppointmentDetails(slots);

            logger.debug("Retrieved {} availability slots for doctor ID: {}", slots.size(), doctorUserId);
            return slots;

        } catch (Exception e) {
            logger.error("Error retrieving availability for doctor {}: {}", doctorUserId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Get available slots for a doctor
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorAvailableSlots(Integer doctorUserId) {
        try {
            Optional<User> doctorOpt = userRepository.findById(doctorUserId);
            if (doctorOpt.isEmpty()) {
                logger.warn("Doctor not found with ID: {}", doctorUserId);
                return Collections.emptyList();
            }

            return availabilitySlotRepository.findByDoctorUserAndIsBookedFalseOrderBySlotDateAscStartTimeAsc(doctorOpt.get());
        } catch (Exception e) {
            logger.error("Error retrieving available slots for doctor {}: {}", doctorUserId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Get doctor's availability by date with appointment details
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorAvailabilityByDate(Integer doctorUserId, LocalDate date) {
        try {
            Optional<User> doctorOpt = userRepository.findById(doctorUserId);
            if (doctorOpt.isEmpty()) {
                logger.warn("Doctor not found with ID: {}", doctorUserId);
                return Collections.emptyList();
            }

            List<DoctorAvailabilitySlot> slots = availabilitySlotRepository
                    .findByDoctorUserAndSlotDateOrderByStartTimeAsc(doctorOpt.get(), date);
            
            // Safely populate appointment details for booked slots
            safePopulateAppointmentDetails(slots);
            
            return slots;
        } catch (Exception e) {
            logger.error("Error retrieving availability by date for doctor {}: {}", doctorUserId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Get all available slots from today onwards
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getAllAvailableSlots() {
        try {
            return availabilitySlotRepository.findByIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate.now());
        } catch (Exception e) {
            logger.error("Error retrieving all available slots: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Get doctor's future available slots
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorFutureAvailableSlots(Integer doctorUserId) {
        try {
            Optional<User> doctorOpt = userRepository.findById(doctorUserId);
            if (doctorOpt.isEmpty()) {
                logger.warn("Doctor not found with ID: {}", doctorUserId);
                return Collections.emptyList();
            }

            return availabilitySlotRepository.findByDoctorUserAndIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
                    doctorOpt.get(), LocalDate.now());
        } catch (Exception e) {
            logger.error("Error retrieving future available slots for doctor {}: {}", doctorUserId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Update an existing availability slot
     */
    @Transactional
    public MessageResponse updateAvailabilitySlot(Integer slotId, DoctorAvailabilityRequest request, Integer doctorUserId) {
        try {
            Optional<DoctorAvailabilitySlot> slotOpt = availabilitySlotRepository.findById(slotId);
            if (slotOpt.isEmpty()) {
                return MessageResponse.error("Availability slot not found");
            }

            DoctorAvailabilitySlot slot = slotOpt.get();

            // Verify ownership
            if (!slot.getDoctorUser().getUserId().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to update this slot");
            }

            // Check if slot is booked
            if (slot.getIsBooked()) {
                return MessageResponse.error("Cannot update a booked slot");
            }

            // Validate required fields
            if (request.getDurationMinutes() == null || request.getDurationMinutes() <= 0) {
                return MessageResponse.error("Duration is required and must be positive");
            }

            // Calculate end time from start time and duration
            LocalTime endTime = request.getStartTime().plusMinutes(request.getDurationMinutes());

            // Validate new time range
            if (request.getStartTime().isAfter(endTime) || request.getStartTime().equals(endTime)) {
                return MessageResponse.error("Start time must be before end time");
            }

            // Validate business hours
            LocalTime businessStart = LocalTime.of(8, 0);
            LocalTime businessEnd = LocalTime.of(18, 0);
            if (request.getStartTime().isBefore(businessStart) || endTime.isAfter(businessEnd)) {
                return MessageResponse.error("Slots must be between 8:00 AM and 6:00 PM");
            }

            // Validate duration (15 minutes to 4 hours)
            if (request.getDurationMinutes() < 15 || request.getDurationMinutes() > 240) {
                return MessageResponse.error("Duration must be between 15 minutes and 4 hours");
            }

            // Check for overlapping slots (excluding current slot)
            List<DoctorAvailabilitySlot> existingSlots = availabilitySlotRepository
                    .findByDoctorUserAndSlotDateOrderByStartTimeAsc(slot.getDoctorUser(), request.getSlotDate());

            for (DoctorAvailabilitySlot existingSlot : existingSlots) {
                if (!existingSlot.getAvailabilitySlotId().equals(slotId) && 
                    isTimeOverlapping(request.getStartTime(), endTime, 
                            existingSlot.getStartTime(), existingSlot.getEndTime())) {
                    return MessageResponse.error("This time slot overlaps with an existing slot");
                }
            }

            // Update slot
            slot.setSlotDate(request.getSlotDate());
            slot.setStartTime(request.getStartTime());
            slot.setEndTime(endTime);
            slot.setNotes(request.getNotes());

            availabilitySlotRepository.save(slot);

            logger.info("Availability slot updated successfully for doctor: {} on date: {} from {} to {}", 
                    slot.getDoctorUser().getUsername(), request.getSlotDate(), request.getStartTime(), endTime);
            return MessageResponse.success("Availability slot updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating availability slot {}: {}", slotId, e.getMessage(), e);
            return MessageResponse.error("Failed to update availability slot: " + e.getMessage());
        }
    }

    /**
     * Delete an availability slot
     */
    @Transactional
    public MessageResponse deleteAvailabilitySlot(Integer slotId, Integer doctorUserId) {
        try {
            Optional<DoctorAvailabilitySlot> slotOpt = availabilitySlotRepository.findById(slotId);
            if (slotOpt.isEmpty()) {
                return MessageResponse.error("Availability slot not found");
            }

            DoctorAvailabilitySlot slot = slotOpt.get();

            // Verify ownership
            if (!slot.getDoctorUser().getUserId().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to delete this slot");
            }

            // Check if slot is booked
            if (slot.getIsBooked()) {
                return MessageResponse.error("Cannot delete a booked slot");
            }

            availabilitySlotRepository.delete(slot);

            logger.info("Availability slot deleted successfully for doctor: {} on date: {} from {} to {}", 
                    slot.getDoctorUser().getUsername(), slot.getSlotDate(), slot.getStartTime(), slot.getEndTime());
            return MessageResponse.success("Availability slot deleted successfully!");

        } catch (Exception e) {
            logger.error("Error deleting availability slot {}: {}", slotId, e.getMessage(), e);
            return MessageResponse.error("Failed to delete availability slot: " + e.getMessage());
        }
    }

    /**
     * Helper method to check if two time ranges overlap
     */
    private boolean isTimeOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

    /**
     * Safely populate appointment details for booked slots to prevent circular references
     */
    private void safePopulateAppointmentDetails(List<DoctorAvailabilitySlot> slots) {
        for (DoctorAvailabilitySlot slot : slots) {
            if (slot.getIsBooked()) {
                try {
                    // Find the appointment for this slot
                    List<Appointment> appointments = appointmentRepository.findByAvailabilitySlot(slot);
                    if (!appointments.isEmpty()) {
                        // Get the most recent appointment for this slot
                        Appointment appointment = appointments.get(0);
                        
                        // Create a safe copy to avoid circular references
                        Appointment safeAppointment = new Appointment();
                        safeAppointment.setAppointmentId(appointment.getAppointmentId());
                        safeAppointment.setAppointmentDateTime(appointment.getAppointmentDateTime());
                        safeAppointment.setStatus(appointment.getStatus());
                        safeAppointment.setDurationMinutes(appointment.getDurationMinutes());
                        
                        // Set patient user with minimal info
                        if (appointment.getPatientUser() != null) {
                            User safePatientUser = new User();
                            safePatientUser.setUserId(appointment.getPatientUser().getUserId());
                            safePatientUser.setUsername(appointment.getPatientUser().getUsername());
                            safePatientUser.setEmail(appointment.getPatientUser().getEmail());
                            safeAppointment.setPatientUser(safePatientUser);
                        }
                        
                        slot.setAppointment(safeAppointment);
                    }
                } catch (Exception e) {
                    logger.warn("Error populating appointment details for slot {}: {}", slot.getAvailabilitySlotId(), e.getMessage());
                    // Continue without appointment details if there's an error
                }
            }
        }
    }
}
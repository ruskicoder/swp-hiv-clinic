package com.hivclinic.service;

import com.hivclinic.dto.request.DoctorAvailabilityRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import com.hivclinic.repository.DoctorAvailabilitySlotRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing doctor availability slots
 */
@Service
public class DoctorAvailabilityService {

    private static final Logger logger = LoggerFactory.getLogger(DoctorAvailabilityService.class);

    @Autowired
    private DoctorAvailabilitySlotRepository availabilitySlotRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create a new availability slot
     */
    @Transactional
    public MessageResponse createAvailabilitySlot(DoctorAvailabilityRequest request, Integer doctorUserId) {
        try {
            // Validate doctor exists
            Optional<User> doctorOpt = userRepository.findById(doctorUserId);
            if (doctorOpt.isEmpty()) {
                return MessageResponse.error("Doctor not found");
            }

            User doctor = doctorOpt.get();
            if (!"Doctor".equalsIgnoreCase(doctor.getRole().getRoleName())) {
                return MessageResponse.error("User is not a doctor");
            }

            // Validate slot date is not in the past
            if (request.getSlotDate().isBefore(LocalDate.now())) {
                return MessageResponse.error("Cannot create slots for past dates");
            }

            // Validate time range
            if (request.getStartTime().isAfter(request.getEndTime()) || 
                request.getStartTime().equals(request.getEndTime())) {
                return MessageResponse.error("Start time must be before end time");
            }

            // Check for overlapping slots
            List<DoctorAvailabilitySlot> existingSlots = availabilitySlotRepository
                    .findByDoctorUserAndSlotDate(doctor, request.getSlotDate());

            boolean hasOverlap = existingSlots.stream().anyMatch(slot -> 
                isTimeOverlapping(request.getStartTime(), request.getEndTime(), 
                                slot.getStartTime(), slot.getEndTime()));

            if (hasOverlap) {
                return MessageResponse.error("Time slot overlaps with existing availability");
            }

            // Create new slot
            DoctorAvailabilitySlot slot = new DoctorAvailabilitySlot();
            slot.setDoctorUser(doctor);
            slot.setSlotDate(request.getSlotDate());
            slot.setStartTime(request.getStartTime());
            slot.setEndTime(request.getEndTime());
            slot.setIsBooked(false);
            slot.setNotes(request.getNotes());

            availabilitySlotRepository.save(slot);

            logger.info("Availability slot created for doctor: {} on date: {} from {} to {}", 
                    doctor.getUsername(), request.getSlotDate(), request.getStartTime(), request.getEndTime());

            return MessageResponse.success("Availability slot created successfully!");

        } catch (Exception e) {
            logger.error("Error creating availability slot: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to create availability slot: " + e.getMessage());
        }
    }

    /**
     * Get doctor's availability slots
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorAvailability(Integer doctorUserId) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }

        return availabilitySlotRepository.findByDoctorUserOrderBySlotDateAscStartTimeAsc(doctorOpt.get());
    }

    /**
     * Get doctor's available slots (not booked)
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorAvailableSlots(Integer doctorUserId) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }

        return availabilitySlotRepository.findByDoctorUserAndIsBookedFalseOrderBySlotDateAscStartTimeAsc(doctorOpt.get());
    }

    /**
     * Get doctor's availability by date
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorAvailabilityByDate(Integer doctorUserId, LocalDate date) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }

        return availabilitySlotRepository.findByDoctorUserAndSlotDateOrderByStartTimeAsc(doctorOpt.get(), date);
    }

    /**
     * Update availability slot
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

            // Cannot update booked slots
            if (slot.getIsBooked()) {
                return MessageResponse.error("Cannot update a booked slot");
            }

            // Validate new time range
            if (request.getStartTime().isAfter(request.getEndTime()) || 
                request.getStartTime().equals(request.getEndTime())) {
                return MessageResponse.error("Start time must be before end time");
            }

            // Check for overlapping slots (excluding current slot)
            List<DoctorAvailabilitySlot> existingSlots = availabilitySlotRepository
                    .findByDoctorUserAndSlotDate(slot.getDoctorUser(), request.getSlotDate());

            boolean hasOverlap = existingSlots.stream()
                    .filter(s -> !s.getAvailabilitySlotId().equals(slotId))
                    .anyMatch(s -> isTimeOverlapping(request.getStartTime(), request.getEndTime(), 
                                                   s.getStartTime(), s.getEndTime()));

            if (hasOverlap) {
                return MessageResponse.error("Updated time slot overlaps with existing availability");
            }

            // Update slot
            slot.setSlotDate(request.getSlotDate());
            slot.setStartTime(request.getStartTime());
            slot.setEndTime(request.getEndTime());
            slot.setNotes(request.getNotes());

            availabilitySlotRepository.save(slot);

            logger.info("Availability slot {} updated successfully", slotId);
            return MessageResponse.success("Availability slot updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating availability slot: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update availability slot: " + e.getMessage());
        }
    }

    /**
     * Delete availability slot
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

            // Cannot delete booked slots
            if (slot.getIsBooked()) {
                return MessageResponse.error("Cannot delete a booked slot. Cancel the appointment first.");
            }

            availabilitySlotRepository.delete(slot);

            logger.info("Availability slot {} deleted successfully", slotId);
            return MessageResponse.success("Availability slot deleted successfully!");

        } catch (Exception e) {
            logger.error("Error deleting availability slot: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to delete availability slot: " + e.getMessage());
        }
    }

    /**
     * Get all available slots for booking (across all doctors)
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getAllAvailableSlots() {
        return availabilitySlotRepository.findByIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate.now());
    }

    /**
     * Get available slots for a specific doctor on or after today
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorFutureAvailableSlots(Integer doctorUserId) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }

        return availabilitySlotRepository.findByDoctorUserAndIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
                doctorOpt.get(), LocalDate.now());
    }

    /**
     * Check if two time ranges overlap
     */
    private boolean isTimeOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}
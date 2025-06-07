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
import java.util.Collections;
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
            logger.debug("Creating availability slot for doctor {}", doctorUserId);
            
            // Validate request
            if (request == null || doctorUserId == null) {
                return MessageResponse.error("Invalid request data");
            }

            // Validate doctor exists
            Optional<User> doctorOpt = userRepository.findById(doctorUserId);
            if (doctorOpt.isEmpty()) {
                return MessageResponse.error("Doctor not found");
            }

            // Validate required fields
            if (request.getSlotDate() == null || request.getStartTime() == null || request.getDurationMinutes() == null) {
                return MessageResponse.error("Missing required fields: date, start time, and duration are required");
            }

            // Calculate end time
            LocalTime startTime = request.getStartTime();
            LocalTime endTime = startTime.plusMinutes(request.getDurationMinutes());

            // Validate time range
            if (startTime.isAfter(endTime) || startTime.equals(endTime)) {
                return MessageResponse.error("Invalid time range");
            }

            // Business hours validation (8 AM to 6 PM)
            LocalTime businessStart = LocalTime.of(8, 0);
            LocalTime businessEnd = LocalTime.of(18, 0);
            
            if (startTime.isBefore(businessStart) || endTime.isAfter(businessEnd)) {
                return MessageResponse.error("Time slot must be between 8:00 AM and 6:00 PM");
            }

            // Check for overlaps with existing slots
            List<DoctorAvailabilitySlot> existingSlots = availabilitySlotRepository
                .findByDoctorUserAndSlotDate(doctorOpt.get(), request.getSlotDate());

            boolean hasOverlap = existingSlots.stream()
                .anyMatch(slot -> {
                    LocalTime slotStart = slot.getStartTime();
                    LocalTime slotEnd = slot.getEndTime();
                    return startTime.isBefore(slotEnd) && slotStart.isBefore(endTime);
                });

            if (hasOverlap) {
                return MessageResponse.error("Time slot overlaps with existing slots");
            }

            // Create new slot
            DoctorAvailabilitySlot slot = new DoctorAvailabilitySlot();
            slot.setDoctorUser(doctorOpt.get());
            slot.setSlotDate(request.getSlotDate());
            slot.setStartTime(startTime);
            slot.setEndTime(endTime);
            slot.setDurationMinutes(request.getDurationMinutes());
            slot.setIsBooked(false);
            slot.setNotes(request.getNotes());
            
            availabilitySlotRepository.save(slot);
            
            logger.info("Time slot created successfully for doctor: {}", doctorUserId);
            return MessageResponse.success("Time slot created successfully");

        } catch (Exception e) {
            logger.error("Error creating availability slot", e);
            return MessageResponse.error("Failed to create time slot: " + e.getMessage());
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
     * Get all available slots from today onwards
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getAllAvailableSlots() {
        return availabilitySlotRepository.findByIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate.now());
    }

    /**
     * Get doctor's future available slots
     */
    @Transactional(readOnly = true)
    public List<DoctorAvailabilitySlot> getDoctorFutureAvailableSlots(Integer doctorUserId) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            return Collections.emptyList();
        }

        LocalDate today = LocalDate.now();
        return availabilitySlotRepository
            .findByDoctorUserAndIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
                doctorOpt.get(), today);
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
            if (request.getDurationMinutes() == null) {
                return MessageResponse.error("Duration is required");
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

            // Check for overlapping slots (excluding current slot)
            List<DoctorAvailabilitySlot> existingSlots = availabilitySlotRepository
                    .findByDoctorUserAndSlotDate(slot.getDoctorUser(), request.getSlotDate());

            boolean hasOverlap = existingSlots.stream()
                    .filter(s -> !s.getAvailabilitySlotId().equals(slotId))
                    .anyMatch(s -> isTimeOverlapping(request.getStartTime(), endTime, 
                                                   s.getStartTime(), s.getEndTime()));

            if (hasOverlap) {
                return MessageResponse.error("Updated time slot overlaps with existing availability");
            }

            // Update slot
            slot.setSlotDate(request.getSlotDate());
            slot.setStartTime(request.getStartTime());
            slot.setEndTime(endTime);
            slot.setNotes(request.getNotes() != null ? request.getNotes() : "");

            availabilitySlotRepository.save(slot);

            logger.info("Availability slot updated for doctor: {} on date: {} from {} to {}", 
                        slot.getDoctorUser().getUsername(), request.getSlotDate(), 
                        request.getStartTime(), endTime);

            return MessageResponse.success("Availability slot updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating availability slot: {}", e.getMessage(), e);
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

            logger.info("Availability slot deleted for doctor: {} on date: {} from {} to {}", 
                        slot.getDoctorUser().getUsername(), slot.getSlotDate(), 
                        slot.getStartTime(), slot.getEndTime());

            return MessageResponse.success("Availability slot deleted successfully!");

        } catch (Exception e) {
            logger.error("Error deleting availability slot: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to delete availability slot: " + e.getMessage());
        }
    }

    /**
     * Check if two time ranges overlap
     */
    private boolean isTimeOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}
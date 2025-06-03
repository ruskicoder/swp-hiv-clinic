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
import java.util.List;
import java.util.Optional;

@Service
public class DoctorAvailabilityService {
    private static final Logger logger = LoggerFactory.getLogger(DoctorAvailabilityService.class);

    @Autowired
    private DoctorAvailabilitySlotRepository availabilitySlotRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Create availability slot for a doctor
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

            // Validate doctor role
            if (!"Doctor".equalsIgnoreCase(doctor.getRole().getRoleName())) {
                return MessageResponse.error("User is not a doctor");
            }

            // Validate time logic
            if (request.getStartTime().isAfter(request.getEndTime()) || 
                request.getStartTime().equals(request.getEndTime())) {
                return MessageResponse.error("Start time must be before end time");
            }

            // Validate date is not in the past
            if (request.getSlotDate().isBefore(LocalDate.now())) {
                return MessageResponse.error("Cannot create availability for past dates");
            }

            // Check for overlapping slots
            List<DoctorAvailabilitySlot> existingSlots = availabilitySlotRepository
                    .findByDoctorUserAndSlotDate(doctor, request.getSlotDate());
            
            boolean hasOverlap = existingSlots.stream()
                    .anyMatch(slot -> 
                        (request.getStartTime().isBefore(slot.getEndTime()) && 
                         request.getEndTime().isAfter(slot.getStartTime())));
            
            if (hasOverlap) {
                return MessageResponse.error("This time slot overlaps with existing availability");
            }

            // Create availability slot
            DoctorAvailabilitySlot availabilitySlot = new DoctorAvailabilitySlot();
            availabilitySlot.setDoctorUser(doctor);
            availabilitySlot.setSlotDate(request.getSlotDate());
            availabilitySlot.setStartTime(request.getStartTime());
            availabilitySlot.setEndTime(request.getEndTime());
            availabilitySlot.setNotes(request.getNotes());
            availabilitySlot.setIsBooked(false);

            availabilitySlotRepository.save(availabilitySlot);

            logger.info("Availability slot created for doctor: {} on date: {}", 
                    doctor.getUsername(), request.getSlotDate());
            
            return MessageResponse.success("Availability slot created successfully!");

        } catch (Exception e) {
            logger.error("Error creating availability slot: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to create availability slot: " + e.getMessage());
        }
    }

    /**
     * Get all availability slots for a doctor
     */
    public List<DoctorAvailabilitySlot> getDoctorAvailability(Integer doctorUserId) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }
        return availabilitySlotRepository.findByDoctorUser(doctorOpt.get());
    }

    /**
     * Get available slots for a doctor (not booked)
     */
    public List<DoctorAvailabilitySlot> getDoctorAvailableSlots(Integer doctorUserId) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }
        return availabilitySlotRepository.findByDoctorUserAndSlotDateGreaterThanEqualAndIsBookedFalse(
                doctorOpt.get(), LocalDate.now());
    }

    /**
     * Get availability slots for a specific date
     */
    public List<DoctorAvailabilitySlot> getDoctorAvailabilityByDate(Integer doctorUserId, LocalDate date) {
        Optional<User> doctorOpt = userRepository.findById(doctorUserId);
        if (doctorOpt.isEmpty()) {
            throw new RuntimeException("Doctor not found");
        }
        return availabilitySlotRepository.findByDoctorUserAndSlotDate(doctorOpt.get(), date);
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

            // Verify the slot belongs to the doctor
            if (!slot.getDoctorUser().getUserId().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to delete this slot");
            }

            // Check if slot is booked
            if (slot.getIsBooked()) {
                return MessageResponse.error("Cannot delete a booked slot");
            }

            availabilitySlotRepository.delete(slot);

            logger.info("Availability slot {} deleted by doctor {}", slotId, doctorUserId);
            return MessageResponse.success("Availability slot deleted successfully!");

        } catch (Exception e) {
            logger.error("Error deleting availability slot: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to delete availability slot: " + e.getMessage());
        }
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

            // Verify the slot belongs to the doctor
            if (!slot.getDoctorUser().getUserId().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to update this slot");
            }

            // Check if slot is booked
            if (slot.getIsBooked()) {
                return MessageResponse.error("Cannot update a booked slot");
            }

            // Validate time logic
            if (request.getStartTime().isAfter(request.getEndTime()) || 
                request.getStartTime().equals(request.getEndTime())) {
                return MessageResponse.error("Start time must be before end time");
            }

            // Validate date is not in the past
            if (request.getSlotDate().isBefore(LocalDate.now())) {
                return MessageResponse.error("Cannot update availability for past dates");
            }

            // Check for overlapping slots (excluding current slot)
            List<DoctorAvailabilitySlot> existingSlots = availabilitySlotRepository
                    .findByDoctorUserAndSlotDate(slot.getDoctorUser(), request.getSlotDate());
            
            boolean hasOverlap = existingSlots.stream()
                    .filter(existingSlot -> !existingSlot.getAvailabilitySlotId().equals(slotId))
                    .anyMatch(existingSlot -> 
                        (request.getStartTime().isBefore(existingSlot.getEndTime()) && 
                         request.getEndTime().isAfter(existingSlot.getStartTime())));
            
            if (hasOverlap) {
                return MessageResponse.error("This time slot overlaps with existing availability");
            }

            // Update slot
            slot.setSlotDate(request.getSlotDate());
            slot.setStartTime(request.getStartTime());
            slot.setEndTime(request.getEndTime());
            slot.setNotes(request.getNotes());

            availabilitySlotRepository.save(slot);

            logger.info("Availability slot {} updated by doctor {}", slotId, doctorUserId);
            return MessageResponse.success("Availability slot updated successfully!");

        } catch (Exception e) {
            logger.error("Error updating availability slot: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update availability slot: " + e.getMessage());
        }
    }
}
package com.hivclinic.service;

import com.hivclinic.dto.request.AppointmentBookingRequest;
import com.hivclinic.dto.response.MessageResponse;
import com.hivclinic.model.Appointment;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import com.hivclinic.repository.AppointmentRepository;
import com.hivclinic.repository.DoctorAvailabilitySlotRepository;
import com.hivclinic.repository.DoctorProfileRepository;
import com.hivclinic.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
     * Get appointments for a patient with proper entity loading
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
            logger.error("Error cancelling appointment: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to cancel appointment: " + e.getMessage());
        }
    }

    /**
     * Doctor updates appointment status, adds notes, and can schedule re-check
     */
    @Transactional
    public MessageResponse updateAppointmentStatus(Integer appointmentId, Integer doctorUserId, String status, String notes, Boolean scheduleRecheck, String recheckDateTime, Integer durationMinutes) {
        try {
            Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
            if (appointmentOpt.isEmpty()) {
                return MessageResponse.error("Appointment not found");
            }
            Appointment appointment = appointmentOpt.get();

            // Only allow doctor of this appointment to update
            if (!appointment.getDoctorUser().getUserId().equals(doctorUserId)) {
                return MessageResponse.error("You don't have permission to update this appointment");
            }

            // Only allow update if not already completed/cancelled
            if ("Completed".equalsIgnoreCase(appointment.getStatus()) || "Cancelled".equalsIgnoreCase(appointment.getStatus())) {
                return MessageResponse.error("Cannot update a completed or cancelled appointment");
            }

            appointment.setStatus(status);
            appointment.setAppointmentNotes(notes);
            appointment.setUpdatedAt(LocalDateTime.now());
            appointmentRepository.save(appointment);

            // If doctor requests a re-check, create new appointment for same patient/doctor
            if (Boolean.TRUE.equals(scheduleRecheck) && recheckDateTime != null) {
                Appointment recheck = new Appointment();
                recheck.setPatientUser(appointment.getPatientUser());
                recheck.setDoctorUser(appointment.getDoctorUser());
                recheck.setAppointmentDateTime(LocalDateTime.parse(recheckDateTime));
                recheck.setDurationMinutes(durationMinutes != null ? durationMinutes : 30);
                recheck.setStatus("Scheduled");
                appointmentRepository.save(recheck);
            }

            return MessageResponse.success("Appointment status updated successfully");
        } catch (Exception e) {
            logger.error("Error updating appointment status: {}", e.getMessage(), e);
            return MessageResponse.error("Failed to update appointment status: " + e.getMessage());
        }
    }

    /**
     * Doctor can access patient record for an appointment if appointment is not completed
     */
    @Transactional(readOnly = true)
    public Object getPatientRecordForAppointment(Integer appointmentId, Integer doctorUserId) {
        Optional<Appointment> appointmentOpt = appointmentRepository.findById(appointmentId);
        if (appointmentOpt.isEmpty()) throw new RuntimeException("Appointment not found");
        Appointment appointment = appointmentOpt.get();
        if (!appointment.getDoctorUser().getUserId().equals(doctorUserId))
            throw new RuntimeException("Access denied");
        if ("Completed".equalsIgnoreCase(appointment.getStatus()))
            throw new RuntimeException("Cannot access patient record after appointment is completed");
        // Return patient record (implement as needed, e.g. fetch PatientRecords by patientUserId)
        // Example:
        // return patientRecordRepository.findByPatientUserId(appointment.getPatientUser().getUserId());
        return null; // placeholder, implement actual fetch
    }
}

package com.hivclinic.mapper;

import com.hivclinic.dto.request.DoctorAvailabilityRequest;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import org.springframework.stereotype.Component;
import java.time.LocalTime;

@Component
public class DoctorAvailabilityMapper {
    
    public DoctorAvailabilitySlot toEntity(DoctorAvailabilityRequest request, User doctor) {
        if (request == null) {
            throw new IllegalArgumentException("Request cannot be null");
        }
        
        if (doctor == null) {
            throw new IllegalArgumentException("Doctor cannot be null");
        }

        DoctorAvailabilitySlot slot = new DoctorAvailabilitySlot();
        slot.setDoctorUser(doctor);
        slot.setSlotDate(request.getSlotDate());
        
        // Get LocalTime directly since it's already in the correct format
        LocalTime startTime = request.getStartTime();
        slot.setStartTime(startTime);
        
        // Calculate end time directly from the start time
        LocalTime endTime = startTime.plusMinutes(request.getDurationMinutes());
        slot.setEndTime(endTime);
        
        slot.setIsBooked(false);
        slot.setNotes(request.getNotes());
        return slot;
    }
}

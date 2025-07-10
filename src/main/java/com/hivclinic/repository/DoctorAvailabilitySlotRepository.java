package com.hivclinic.repository;

import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface DoctorAvailabilitySlotRepository extends JpaRepository<DoctorAvailabilitySlot, Integer>, DoctorAvailabilitySlotRepositoryCustom {
    
    // Find all slots for a doctor ordered by date and time
    List<DoctorAvailabilitySlot> findByDoctorUserOrderBySlotDateAscStartTimeAsc(User doctorUser);
    
    // Find available slots for a doctor
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseOrderBySlotDateAscStartTimeAsc(User doctorUser);
    
    // Find slots for a doctor on a specific date
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateOrderByStartTimeAsc(User doctorUser, LocalDate slotDate);
    
    // Find slots for a doctor on a specific date (alternative method name)
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDate(User doctorUser, LocalDate slotDate);
    
    // Find all available slots from a specific date onwards
    List<DoctorAvailabilitySlot> findByIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate date);
    
    // Find future available slots for a specific doctor
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(User doctorUser, LocalDate date);
    
    // Custom query to find overlapping slots for validation
    @Query("SELECT s FROM DoctorAvailabilitySlot s " +
           "WHERE s.doctorUser = :doctor " +
           "AND s.slotDate = :date " +
           "AND CAST(s.startTime AS time) < CAST(:endTime AS time) " +
           "AND CAST(:startTime AS time) < CAST(s.endTime AS time)")
    List<DoctorAvailabilitySlot> findOverlappingSlots(
        @Param("doctor") User doctor,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );
}
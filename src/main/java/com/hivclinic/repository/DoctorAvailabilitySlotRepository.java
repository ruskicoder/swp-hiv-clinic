package com.hivclinic.repository;

import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository interface for DoctorAvailabilitySlot entity
 */
@Repository
public interface DoctorAvailabilitySlotRepository extends JpaRepository<DoctorAvailabilitySlot, Integer> {
    
    /**
     * Find availability slots by doctor user
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das " +
           "LEFT JOIN FETCH das.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "WHERE das.doctorUser = :doctorUser " +
           "ORDER BY das.slotDate ASC, das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUser(@Param("doctorUser") User doctorUser);
    
    /**
     * Find availability slots by doctor user and date
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das " +
           "LEFT JOIN FETCH das.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "WHERE das.doctorUser = :doctorUser " +
           "AND das.slotDate = :slotDate " +
           "ORDER BY das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDate(
            @Param("doctorUser") User doctorUser, 
            @Param("slotDate") LocalDate slotDate);
    
    /**
     * Find available slots for a doctor (not booked) from a specific date onwards
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das " +
           "LEFT JOIN FETCH das.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "WHERE das.doctorUser = :doctorUser " +
           "AND das.slotDate >= :date " +
           "AND das.isBooked = false " +
           "ORDER BY das.slotDate ASC, das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateGreaterThanEqualAndIsBookedFalse(
            @Param("doctorUser") User doctorUser, 
            @Param("date") LocalDate date);
}
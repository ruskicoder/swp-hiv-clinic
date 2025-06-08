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
 * Provides methods to query doctor availability slots
 */
@Repository
public interface DoctorAvailabilitySlotRepository extends JpaRepository<DoctorAvailabilitySlot, Integer> {

    /**
     * Find all slots for a doctor ordered by date and start time
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das WHERE das.doctorUser = :doctorUser ORDER BY das.slotDate ASC, das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserOrderBySlotDateAscStartTimeAsc(@Param("doctorUser") User doctorUser);

    /**
     * Find available slots for a doctor ordered by date and start time
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das WHERE das.doctorUser = :doctorUser AND das.isBooked = false ORDER BY das.slotDate ASC, das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseOrderBySlotDateAscStartTimeAsc(@Param("doctorUser") User doctorUser);

    /**
     * Find slots for a doctor on a specific date ordered by start time
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das WHERE das.doctorUser = :doctorUser AND das.slotDate = :slotDate ORDER BY das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateOrderByStartTimeAsc(@Param("doctorUser") User doctorUser, @Param("slotDate") LocalDate slotDate);

    /**
     * Find slots for a doctor on a specific date
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das WHERE das.doctorUser = :doctorUser AND das.slotDate = :slotDate")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDate(@Param("doctorUser") User doctorUser, @Param("slotDate") LocalDate slotDate);

    /**
     * Find all available slots from a specific date onwards
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das WHERE das.isBooked = false AND das.slotDate >= :fromDate ORDER BY das.slotDate ASC, das.startTime ASC")
    List<DoctorAvailabilitySlot> findByIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(@Param("fromDate") LocalDate fromDate);

    /**
     * Find available slots for a doctor from a specific date onwards
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das WHERE das.doctorUser = :doctorUser AND das.isBooked = false AND das.slotDate >= :fromDate ORDER BY das.slotDate ASC, das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(@Param("doctorUser") User doctorUser, @Param("fromDate") LocalDate fromDate);

    /**
     * Find slots for a doctor between two dates
     */
    @Query("SELECT das FROM DoctorAvailabilitySlot das WHERE das.doctorUser = :doctorUser AND das.slotDate BETWEEN :startDate AND :endDate ORDER BY das.slotDate ASC, das.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateBetween(@Param("doctorUser") User doctorUser, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}
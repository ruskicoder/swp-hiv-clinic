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
     * Find all slots for a doctor ordered by date and time
     */
    @Query("SELECT d FROM DoctorAvailabilitySlot d WHERE d.doctorUser = :doctorUser ORDER BY d.slotDate ASC, d.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserOrderBySlotDateAscStartTimeAsc(@Param("doctorUser") User doctorUser);

    /**
     * Find available (not booked) slots for a doctor ordered by date and time
     */
    @Query("SELECT d FROM DoctorAvailabilitySlot d WHERE d.doctorUser = :doctorUser AND d.isBooked = false ORDER BY d.slotDate ASC, d.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseOrderBySlotDateAscStartTimeAsc(@Param("doctorUser") User doctorUser);

    /**
     * Find slots for a doctor on a specific date ordered by start time
     */
    @Query("SELECT d FROM DoctorAvailabilitySlot d WHERE d.doctorUser = :doctorUser AND d.slotDate = :slotDate ORDER BY d.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateOrderByStartTimeAsc(@Param("doctorUser") User doctorUser, @Param("slotDate") LocalDate slotDate);

    /**
     * Find slots for a doctor on a specific date
     */
    @Query("SELECT d FROM DoctorAvailabilitySlot d WHERE d.doctorUser = :doctorUser AND d.slotDate = :slotDate")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDate(@Param("doctorUser") User doctorUser, @Param("slotDate") LocalDate slotDate);

    /**
     * Find all available slots from today onwards
     */
    @Query("SELECT d FROM DoctorAvailabilitySlot d WHERE d.isBooked = false AND d.slotDate >= :fromDate ORDER BY d.slotDate ASC, d.startTime ASC")
    List<DoctorAvailabilitySlot> findByIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(@Param("fromDate") LocalDate fromDate);

    /**
     * Find available slots for a specific doctor from today onwards
     */
    @Query("SELECT d FROM DoctorAvailabilitySlot d WHERE d.doctorUser = :doctorUser AND d.isBooked = false AND d.slotDate >= :fromDate ORDER BY d.slotDate ASC, d.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            @Param("doctorUser") User doctorUser, @Param("fromDate") LocalDate fromDate);

    /**
     * Find slots for a doctor between dates
     */
    @Query("SELECT d FROM DoctorAvailabilitySlot d WHERE d.doctorUser = :doctorUser AND d.slotDate BETWEEN :startDate AND :endDate ORDER BY d.slotDate ASC, d.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateBetween(
            @Param("doctorUser") User doctorUser, 
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate);
}
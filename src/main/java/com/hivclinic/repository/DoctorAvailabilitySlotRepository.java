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
 * Repository for DoctorAvailabilitySlot entity
 */
@Repository
public interface DoctorAvailabilitySlotRepository extends JpaRepository<DoctorAvailabilitySlot, Integer> {

    /**
     * Find all slots for a doctor ordered by date and time
     */
    List<DoctorAvailabilitySlot> findByDoctorUserOrderBySlotDateAscStartTimeAsc(User doctorUser);

    /**
     * Find available (not booked) slots for a doctor ordered by date and time
     */
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseOrderBySlotDateAscStartTimeAsc(User doctorUser);

    /**
     * Find slots for a doctor on a specific date ordered by start time
     */
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateOrderByStartTimeAsc(User doctorUser, LocalDate slotDate);

    /**
     * Find slots for a doctor on a specific date
     */
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDate(User doctorUser, LocalDate slotDate);

    /**
     * Find all available slots from today onwards
     */
    List<DoctorAvailabilitySlot> findByIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(LocalDate fromDate);

    /**
     * Find available slots for a specific doctor from today onwards
     */
    List<DoctorAvailabilitySlot> findByDoctorUserAndIsBookedFalseAndSlotDateGreaterThanEqualOrderBySlotDateAscStartTimeAsc(
            User doctorUser, LocalDate date);

    /**
     * Find slots for a doctor between dates
     */
    @Query("SELECT s FROM DoctorAvailabilitySlot s WHERE s.doctorUser = :doctorUser " +
           "AND s.slotDate BETWEEN :startDate AND :endDate " +
           "ORDER BY s.slotDate ASC, s.startTime ASC")
    List<DoctorAvailabilitySlot> findByDoctorUserAndSlotDateBetween(
            @Param("doctorUser") User doctorUser,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Find available slots for all doctors on a specific date
     */
    @Query("SELECT s FROM DoctorAvailabilitySlot s " +
           "LEFT JOIN FETCH s.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "WHERE s.slotDate = :slotDate AND s.isBooked = false " +
           "ORDER BY s.startTime ASC")
    List<DoctorAvailabilitySlot> findAvailableSlotsByDate(@Param("slotDate") LocalDate slotDate);
}
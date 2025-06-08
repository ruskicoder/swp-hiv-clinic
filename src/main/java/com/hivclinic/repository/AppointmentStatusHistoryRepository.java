package com.hivclinic.repository;

import com.hivclinic.model.AppointmentStatusHistory;
import com.hivclinic.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AppointmentStatusHistory entity
 */
@Repository
public interface AppointmentStatusHistoryRepository extends JpaRepository<AppointmentStatusHistory, Integer> {

    /**
     * Find all status history for a specific appointment
     */
    List<AppointmentStatusHistory> findByAppointmentOrderByChangedAtDesc(Appointment appointment);

    /**
     * Find all status history for a specific appointment by ID
     */
    @Query("SELECT ash FROM AppointmentStatusHistory ash WHERE ash.appointment.appointmentId = :appointmentId ORDER BY ash.changedAt DESC")
    List<AppointmentStatusHistory> findByAppointmentIdOrderByChangedAtDesc(@Param("appointmentId") Integer appointmentId);

    /**
     * Find the latest status change for an appointment
     */
    @Query("SELECT ash FROM AppointmentStatusHistory ash WHERE ash.appointment.appointmentId = :appointmentId ORDER BY ash.changedAt DESC LIMIT 1")
    AppointmentStatusHistory findLatestByAppointmentId(@Param("appointmentId") Integer appointmentId);
}

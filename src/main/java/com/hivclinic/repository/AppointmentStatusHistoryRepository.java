package com.hivclinic.repository;

import com.hivclinic.model.Appointment;
import com.hivclinic.model.AppointmentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for AppointmentStatusHistory entity operations
 */
@Repository
public interface AppointmentStatusHistoryRepository extends JpaRepository<AppointmentStatusHistory, Integer> {

    /**
     * Find status history by appointment ordered by changed date descending
     */
    @Query("SELECT ash FROM AppointmentStatusHistory ash " +
           "LEFT JOIN FETCH ash.changedByUser " +
           "WHERE ash.appointment = :appointment " +
           "ORDER BY ash.changedAt DESC")
    List<AppointmentStatusHistory> findByAppointmentOrderByChangedAtDesc(@Param("appointment") Appointment appointment);

    /**
     * Find status history by appointment ID
     */
    @Query("SELECT ash FROM AppointmentStatusHistory ash " +
           "LEFT JOIN FETCH ash.changedByUser " +
           "WHERE ash.appointment.appointmentId = :appointmentId " +
           "ORDER BY ash.changedAt DESC")
    List<AppointmentStatusHistory> findByAppointmentIdOrderByChangedAtDesc(@Param("appointmentId") Integer appointmentId);
}
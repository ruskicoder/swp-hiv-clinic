package com.hivclinic.repository;

import com.hivclinic.model.Appointment;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Appointment entity
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {
    
    /**
     * Find appointments by patient user
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "LEFT JOIN FETCH a.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "LEFT JOIN FETCH a.availabilitySlot " +
           "WHERE a.patientUser = :patientUser " +
           "ORDER BY a.appointmentDateTime DESC")
    List<Appointment> findByPatientUser(@Param("patientUser") User patientUser);
    
    /**
     * Find appointments by patient user after a specific date
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "LEFT JOIN FETCH a.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "LEFT JOIN FETCH a.availabilitySlot " +
           "WHERE a.patientUser = :patientUser " +
           "AND a.appointmentDateTime > :dateTime " +
           "ORDER BY a.appointmentDateTime ASC")
    List<Appointment> findByPatientUserAndAppointmentDateTimeAfter(
            @Param("patientUser") User patientUser, 
            @Param("dateTime") LocalDateTime dateTime);
    
    /**
     * Find appointments by doctor user
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "LEFT JOIN FETCH a.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "LEFT JOIN FETCH a.availabilitySlot " +
           "WHERE a.doctorUser = :doctorUser " +
           "ORDER BY a.appointmentDateTime DESC")
    List<Appointment> findByDoctorUser(@Param("doctorUser") User doctorUser);
    
    /**
     * Find appointments by doctor user within date range
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "LEFT JOIN FETCH a.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "LEFT JOIN FETCH a.availabilitySlot " +
           "WHERE a.doctorUser = :doctorUser " +
           "AND a.appointmentDateTime BETWEEN :startDateTime AND :endDateTime " +
           "ORDER BY a.appointmentDateTime ASC")
    List<Appointment> findByDoctorUserAndAppointmentDateTimeBetween(
            @Param("doctorUser") User doctorUser, 
            @Param("startDateTime") LocalDateTime startDateTime, 
            @Param("endDateTime") LocalDateTime endDateTime);
}
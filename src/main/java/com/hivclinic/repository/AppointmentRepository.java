package com.hivclinic.repository;

import com.hivclinic.model.Appointment;
import com.hivclinic.model.DoctorAvailabilitySlot;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Repository interface for Appointment entity operations
 */
@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Integer> {

    /**
     * Find appointments by patient user with eager loading
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
     * Find upcoming appointments by patient user
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
     * Find appointments by patient user within date range
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "LEFT JOIN FETCH a.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "WHERE a.patientUser = :patientUser " +
           "AND a.appointmentDateTime BETWEEN :startDateTime AND :endDateTime " +
           "ORDER BY a.appointmentDateTime ASC")
    List<Appointment> findByPatientUserAndAppointmentDateTimeBetween(
            @Param("patientUser") User patientUser,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

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
           "WHERE a.doctorUser = :doctorUser " +
           "AND a.appointmentDateTime BETWEEN :startDateTime AND :endDateTime " +
           "ORDER BY a.appointmentDateTime ASC")
    List<Appointment> findByDoctorUserAndAppointmentDateTimeBetween(
            @Param("doctorUser") User doctorUser,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime);

    /**
     * Find appointment by ID with patient details
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "WHERE a.appointmentId = :appointmentId")
    Optional<Appointment> findByIdWithPatient(@Param("appointmentId") Integer appointmentId);

    /**
     * Find appointments by availability slot
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "WHERE a.availabilitySlot = :availabilitySlot " +
           "ORDER BY a.appointmentDateTime DESC")
    List<Appointment> findByAvailabilitySlot(@Param("availabilitySlot") DoctorAvailabilitySlot availabilitySlot);
    
    /**
     * Find appointments by doctor and patient
     */
    @Query("SELECT a FROM Appointment a " +
           "LEFT JOIN FETCH a.patientUser pu " +
           "LEFT JOIN FETCH pu.role " +
           "LEFT JOIN FETCH a.doctorUser du " +
           "LEFT JOIN FETCH du.role " +
           "WHERE a.doctorUser = :doctorUser AND a.patientUser = :patientUser " +
           "ORDER BY a.appointmentDateTime DESC")
    List<Appointment> findByDoctorUserAndPatientUser(@Param("doctorUser") User doctorUser, @Param("patientUser") User patientUser);
// Thêm vào file: com/hivclinic/repository/AppointmentRepository.java

@Query("SELECT new map(a.appointmentId as appointmentId, p.firstName as patientFirstName, p.lastName as patientLastName, " +
       "a.appointmentDateTime as dateTime, a.status as status, a.appointmentNotes as notes) " +
       "FROM Appointment a LEFT JOIN a.patientUser p " +
       "WHERE a.doctorUser.userId = :doctorId")
List<Map<String, Object>> findAppointmentsByDoctorWithPatientName(@Param("doctorId") Integer doctorId);
}
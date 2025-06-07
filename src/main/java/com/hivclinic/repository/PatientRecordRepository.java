package com.hivclinic.repository;

import com.hivclinic.model.PatientRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for PatientRecord entity
 */
@Repository
public interface PatientRecordRepository extends JpaRepository<PatientRecord, Integer> {
    
    /**
     * Find patient record by patient user ID with complete user details
     */
    @Query("SELECT pr FROM PatientRecord pr " +
           "WHERE pr.patientUserID = :patientUserID")
    Optional<PatientRecord> findByPatientUserID(@Param("patientUserID") Integer patientUserID);

    /**
     * Check if patient record exists for user
     */
    @Query("SELECT CASE WHEN COUNT(pr) > 0 THEN true ELSE false END " +
           "FROM PatientRecord pr WHERE pr.patientUserID = :patientUserID")
    boolean existsByPatientUserID(@Param("patientUserID") Integer patientUserID);
    
    /**
     * Find patient record by appointment ID with better error handling
     * and comprehensive patient data
     */
    @Query("SELECT pr FROM PatientRecord pr " +
           "WHERE pr.appointmentId = :appointmentId")
    Optional<PatientRecord> findByAppointmentId(@Param("appointmentId") Integer appointmentId);

    /**
     * Find complete patient record by patient user ID with all related data
     */
    @Query(value = "SELECT pr FROM PatientRecord pr " +
           "WHERE pr.patientUserID = :patientUserID")
    Optional<PatientRecord> findCompleteRecordByPatientUserID(@Param("patientUserID") Integer patientUserID);


    /**
     * Find validated record by patient and appointment IDs
     */
    @Query("SELECT pr FROM PatientRecord pr " +
           "WHERE pr.patientUserID = :patientUserID " +
           "AND pr.appointmentId = :appointmentId")
    Optional<PatientRecord> findValidatedRecord(
            @Param("patientUserID") Integer patientUserID,
            @Param("appointmentId") Integer appointmentId);
}

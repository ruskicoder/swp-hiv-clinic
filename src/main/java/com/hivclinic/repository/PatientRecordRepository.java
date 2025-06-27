package com.hivclinic.repository;

import com.hivclinic.model.PatientRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for PatientRecord entity operations
 */
@Repository
public interface PatientRecordRepository extends JpaRepository<PatientRecord, Integer> {

    /**
     * Find patient record by patient user ID
     */
    @Query("SELECT pr FROM PatientRecord pr WHERE pr.patientUserID = :patientUserID")
    Optional<PatientRecord> findByPatientUserID(@Param("patientUserID") Integer patientUserID);

    /**
     * Find patient record by appointment ID
     */
    @Query("SELECT pr FROM PatientRecord pr WHERE pr.appointmentId = :appointmentId")
    Optional<PatientRecord> findByAppointmentId(@Param("appointmentId") Integer appointmentId);

    /**
     * Check if patient record exists for patient user ID
     */
    @Query("SELECT COUNT(pr) > 0 FROM PatientRecord pr WHERE pr.patientUserID = :patientUserID")
    boolean existsByPatientUserID(@Param("patientUserID") Integer patientUserID);
}
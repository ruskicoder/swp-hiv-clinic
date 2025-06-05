package com.hivclinic.repository;

import com.hivclinic.model.ARVTreatment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for ARVTreatment entity
 */
@Repository
public interface ARVTreatmentRepository extends JpaRepository<ARVTreatment, Integer> {
    
    /**
     * Find ARV treatments by patient user ID, ordered by creation date descending
     */
    @Query("SELECT a FROM ARVTreatment a WHERE a.patientUserID = :patientUserID ORDER BY a.createdAt DESC")
    List<ARVTreatment> findByPatientUserIDOrderByCreatedAtDesc(@Param("patientUserID") Integer patientUserID);
    
    /**
     * Find active ARV treatments by patient user ID
     */
    @Query("SELECT a FROM ARVTreatment a WHERE a.patientUserID = :patientUserID AND a.isActive = true ORDER BY a.createdAt DESC")
    List<ARVTreatment> findActiveByPatientUserID(@Param("patientUserID") Integer patientUserID);
    
    /**
     * Find ARV treatments by doctor user ID
     */
    @Query("SELECT a FROM ARVTreatment a WHERE a.doctorUserID = :doctorUserID ORDER BY a.createdAt DESC")
    List<ARVTreatment> findByDoctorUserIDOrderByCreatedAtDesc(@Param("doctorUserID") Integer doctorUserID);
    
    /**
     * Find ARV treatments by appointment ID
     */
    @Query("SELECT a FROM ARVTreatment a WHERE a.appointmentID = :appointmentID")
    List<ARVTreatment> findByAppointmentID(@Param("appointmentID") Integer appointmentID);
}

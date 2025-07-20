package com.hivclinic.repository;

import com.hivclinic.model.ARVTreatment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for ARVTreatment entity operations
 */
@Repository
public interface ARVTreatmentRepository extends JpaRepository<ARVTreatment, Integer> {

    /**
     * Find ARV treatments by patient user ID ordered by creation date descending
     */
    @Query("SELECT arv FROM ARVTreatment arv WHERE arv.patientUserID = :patientUserID ORDER BY arv.createdAt DESC")
    List<ARVTreatment> findByPatientUserIDOrderByCreatedAtDesc(@Param("patientUserID") Integer patientUserID);

    /**
     * Find active ARV treatments by patient user ID
     */
    @Query("SELECT arv FROM ARVTreatment arv WHERE arv.patientUserID = :patientUserID AND arv.isActive = true ORDER BY arv.createdAt DESC")
    List<ARVTreatment> findActiveByPatientUserID(@Param("patientUserID") Integer patientUserID);

    /**
     * Find ARV treatments by appointment ID
     */
    @Query("SELECT arv FROM ARVTreatment arv WHERE arv.appointmentID = :appointmentID ORDER BY arv.createdAt DESC")
    List<ARVTreatment> findByAppointmentID(@Param("appointmentID") Integer appointmentID);

    /**
     * Find ARV treatments by doctor user ID
     */
    @Query("SELECT arv FROM ARVTreatment arv WHERE arv.doctorUserID = :doctorUserID ORDER BY arv.createdAt DESC")
    List<ARVTreatment> findByDoctorUserID(@Param("doctorUserID") Integer doctorUserID);

    /**
     * Find active ARV treatments by doctor user ID
     */
    @Query("SELECT arv FROM ARVTreatment arv WHERE arv.doctorUserID = :doctorUserID AND arv.isActive = true ORDER BY arv.createdAt DESC")
    List<ARVTreatment> findActiveByDoctorUserID(@Param("doctorUserID") Integer doctorUserID);

    /**
     * Find ARV treatments by notes field (exact match)
     */
    @Query("SELECT arv FROM ARVTreatment arv WHERE arv.notes = :notes")
    List<ARVTreatment> findByNotes(@Param("notes") String notes);

    /**
     * Find all ARV templates (default and doctor-created)
     */
    @Query("SELECT arv FROM ARVTreatment arv WHERE (arv.notes = 'default template' OR arv.notes = 'template')")
    List<ARVTreatment> findAllTemplates();
}

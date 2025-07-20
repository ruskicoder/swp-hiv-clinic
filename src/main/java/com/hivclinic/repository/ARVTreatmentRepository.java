package com.hivclinic.repository;

import com.hivclinic.model.ARVTreatment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

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
    // Thêm vào file: com/hivclinic/repository/ARVTreatmentRepository.java

// Lấy tất cả phác đồ kèm tên (1 query)
@Query("SELECT new map(arv.arvTreatmentID as arvTreatmentID, arv.regimen as regimen, arv.startDate as startDate, arv.endDate as endDate, " +
       "arv.adherence as adherence, arv.sideEffects as sideEffects, arv.notes as notes, arv.isActive as isActive, " +
       "p.firstName as patientFirstName, p.lastName as patientLastName, " +
       "d.firstName as doctorFirstName, d.lastName as doctorLastName) " +
       "FROM ARVTreatment arv " +
       "LEFT JOIN User p ON arv.patientUserID = p.userId " +
       "LEFT JOIN User d ON arv.doctorUserID = d.userId")
List<Map<String, Object>> findAllWithPatientAndDoctorNames();

// Tìm kiếm theo ngày kèm tên (1 query)
@Query("SELECT new map(arv.arvTreatmentID as arvTreatmentID, arv.regimen as regimen, arv.startDate as startDate, arv.endDate as endDate, " +
       "p.firstName as patientFirstName, p.lastName as patientLastName, " +
       "d.firstName as doctorFirstName, d.lastName as doctorLastName) " +
       "FROM ARVTreatment arv " +
       "LEFT JOIN User p ON arv.patientUserID = p.userId " +
       "LEFT JOIN User d ON arv.doctorUserID = d.userId " +
       "WHERE arv.startDate BETWEEN :from AND :to")
List<Map<String, Object>> findTreatmentsWithNamesByDateRange(@Param("from") java.time.LocalDate from, @Param("to") java.time.LocalDate to);

// Lấy phác đồ của bác sĩ kèm tên bệnh nhân (1 query)
@Query("SELECT new map(arv.arvTreatmentID as arvTreatmentID, arv.regimen as regimen, arv.startDate as startDate, arv.endDate as endDate, arv.notes as notes, " +
       "p.firstName as patientFirstName, p.lastName as patientLastName) " +
       "FROM ARVTreatment arv LEFT JOIN User p ON arv.patientUserID = p.userId " +
       "WHERE arv.doctorUserID = :doctorId")
List<Map<String, Object>> findTreatmentsByDoctorWithPatientName(@Param("doctorId") Integer doctorId);
}

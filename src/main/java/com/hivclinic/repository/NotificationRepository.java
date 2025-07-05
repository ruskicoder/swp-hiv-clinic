package com.hivclinic.repository;

import com.hivclinic.model.Notification;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    // Get all notifications for a doctor where the patient has any appointment with the doctor
    @Query("SELECT n FROM Notification n WHERE n.doctor.userId = :doctorId " +
           "AND n.patient.userId IN (SELECT a.patientUser.userId FROM Appointment a WHERE a.doctorUser.userId = :doctorId)")
    List<Notification> findByDoctorAndPatientInDoctorAppointments(@Param("doctorId") Integer doctorId);

    // Get all notifications grouped by patients for a doctor, ordered by appointment status priority
    @Query("SELECT n FROM Notification n " +
           "JOIN Appointment a ON n.patient.userId = a.patientUser.userId AND n.doctor.userId = a.doctorUser.userId " +
           "WHERE n.doctor.userId = :doctorId " +
           "ORDER BY " +
           "CASE " +
           "   WHEN a.status = 'In Progress' THEN 1 " +
           "   WHEN a.status = 'Completed' THEN 2 " +
           "   WHEN a.status = 'Scheduled' THEN 3 " +
           "   ELSE 4 " +
           "END, a.appointmentDateTime DESC")
    List<Notification> findByDoctorOrderedByAppointmentStatusPriority(@Param("doctorId") Integer doctorId);
    
    // Get all unread notifications for a doctor
    List<Notification> findByDoctorUserIdAndRetractedAtIsNullAndReadAtIsNull(Integer doctorId);
    
    // Count unread notifications for a doctor
    long countByDoctorAndStatus(User doctor, String status);
    
    // Count retractable notifications (not yet seen by patient)
    long countByDoctorUserIdAndRetractedAtIsNullAndSeenAtIsNull(Integer doctorId);
    
    // Find notifications for a patient
    List<Notification> findByPatientUserIdAndRetractedAtIsNullOrderByCreatedAtDesc(Integer patientId);
    
    // Original method (maintained for backward compatibility)
    List<Notification> findByPatientUserIdOrderByCreatedAtDesc(Integer patientId);
    
    // Find notifications by type for a patient
    List<Notification> findByPatientUserIdAndTypeAndRetractedAtIsNull(Integer patientId, String type);
    
    // Find notifications for medication reminders
    @Query("SELECT n FROM Notification n " +
           "WHERE n.type = 'MEDICATION_REMINDER' " +
           "AND n.patient.userId = :patientId " +
           "AND n.retractedAt IS NULL " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findMedicationRemindersForPatient(@Param("patientId") Integer patientId);
    
    // Find notifications that need to be sent as reminders
    @Query("SELECT n FROM Notification n " +
           "JOIN MedicationRoutine mr ON n.payload LIKE CONCAT('%', mr.routineId, '%') " +
           "WHERE mr.isActive = true " +
           "AND mr.reminderEnabled = true " +
           "AND (mr.lastReminderSentAt IS NULL OR mr.lastReminderSentAt < :cutoffTime)")
    List<Notification> findPendingMedicationReminders(@Param("cutoffTime") LocalDateTime cutoffTime);
    
    // Find notifications by medication routine
    List<Notification> findByMedicationRoutineRoutineIdAndRetractedAtIsNull(Integer routineId);
    
    // Find notifications by medication routine for a patient
    @Query("SELECT n FROM Notification n " +
           "WHERE n.medicationRoutine.routineId = :routineId " +
           "AND n.patient.userId = :patientId " +
           "AND n.retractedAt IS NULL " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByMedicationRoutineAndPatient(@Param("routineId") Integer routineId, @Param("patientId") Integer patientId);
    
    // Find notifications by both appointment and medication routine
    List<Notification> findByAppointmentAppointmentIdAndMedicationRoutineRoutineId(Integer appointmentId, Integer routineId);
    
    // Count notifications by medication routine
    long countByMedicationRoutineRoutineIdAndRetractedAtIsNull(Integer routineId);
}

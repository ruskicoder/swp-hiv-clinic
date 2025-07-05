package com.hivclinic.repository;

import com.hivclinic.model.MedicationRoutine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface MedicationRoutineRepository extends JpaRepository<MedicationRoutine, Integer> {

    // Find all active medication routines for a patient
    List<MedicationRoutine> findByPatientUserUserIdAndIsActiveTrue(Integer patientUserId);

    // Find all medication routines for a patient (active and inactive)
    List<MedicationRoutine> findByPatientUserUserIdOrderByCreatedAtDesc(Integer patientUserId);

    // Find all medication routines created by a doctor
    List<MedicationRoutine> findByDoctorUserUserIdOrderByCreatedAtDesc(Integer doctorUserId);

    // Find active medication routines for a doctor
    List<MedicationRoutine> findByDoctorUserUserIdAndIsActiveTrueOrderByCreatedAtDesc(Integer doctorUserId);

    // Find medication routines by ARV treatment
    List<MedicationRoutine> findByArvTreatmentArvTreatmentID(Integer arvTreatmentId);

    // Find medication routines with reminders enabled
    List<MedicationRoutine> findByIsActiveTrueAndReminderEnabledTrue();

    // Find medication routines due for reminders within a time window
    List<MedicationRoutine> findByIsActiveTrueAndTimeOfDayBetween(LocalTime startTime, LocalTime endTime);

    // Find medication routines due for reminders at a specific time
    List<MedicationRoutine> findByIsActiveTrueAndReminderEnabledTrueAndTimeOfDay(LocalTime timeOfDay);

    // Find overdue medication routines (where next reminder is past due)
    @Query("SELECT mr FROM MedicationRoutine mr WHERE mr.isActive = true AND mr.reminderEnabled = true AND mr.nextReminderDue < :currentTime")
    List<MedicationRoutine> findOverdueMedicationRoutines(@Param("currentTime") LocalDateTime currentTime);

    // Find medication routines by category
    List<MedicationRoutine> findByMedicationCategoryAndIsActiveTrue(MedicationRoutine.MedicationCategory category);

    // Find medication routines by frequency type
    List<MedicationRoutine> findByFrequencyTypeAndIsActiveTrue(MedicationRoutine.FrequencyType frequencyType);

    // Find medication routines starting today
    List<MedicationRoutine> findByStartDateAndIsActiveTrue(LocalDate startDate);

    // Find medication routines ending today
    List<MedicationRoutine> findByEndDateAndIsActiveTrue(LocalDate endDate);

    // Find medication routines by medication name (case-insensitive)
    @Query("SELECT mr FROM MedicationRoutine mr WHERE LOWER(mr.medicationName) LIKE LOWER(CONCAT('%', :medicationName, '%')) AND mr.isActive = true")
    List<MedicationRoutine> findByMedicationNameContainingIgnoreCase(@Param("medicationName") String medicationName);

    // Find medication routines that need reminder calculation update
    @Query("SELECT mr FROM MedicationRoutine mr WHERE mr.isActive = true AND mr.reminderEnabled = true AND mr.nextReminderDue IS NULL")
    List<MedicationRoutine> findRoutinesNeedingReminderCalculation();

    // Find medication routines for a patient within a date range
    @Query("SELECT mr FROM MedicationRoutine mr WHERE mr.patientUser.userId = :patientUserId AND mr.isActive = true AND mr.startDate <= :endDate AND (mr.endDate IS NULL OR mr.endDate >= :startDate)")
    List<MedicationRoutine> findActiveRoutinesForPatientInDateRange(
        @Param("patientUserId") Integer patientUserId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    // Find medication routines by ARV treatment and active status
    List<MedicationRoutine> findByArvTreatmentArvTreatmentIDAndIsActiveTrue(Integer arvTreatmentId);

    // Find medication routines that haven't sent reminders today
    @Query("SELECT mr FROM MedicationRoutine mr WHERE mr.isActive = true AND mr.reminderEnabled = true AND (mr.lastReminderSentAt IS NULL OR DATE(mr.lastReminderSentAt) < CURRENT_DATE)")
    List<MedicationRoutine> findRoutinesWithoutTodayReminder();

    // Count active medication routines for a patient
    long countByPatientUserUserIdAndIsActiveTrue(Integer patientUserId);

    // Count medication routines by doctor
    long countByDoctorUserUserIdAndIsActiveTrue(Integer doctorUserId);

    // Find medication routines with specific food requirements
    List<MedicationRoutine> findByFoodRequirementAndIsActiveTrue(MedicationRoutine.FoodRequirement foodRequirement);

    // Find medication routines by patient and medication category
    List<MedicationRoutine> findByPatientUserUserIdAndMedicationCategoryAndIsActiveTrue(
        Integer patientUserId, 
        MedicationRoutine.MedicationCategory category
    );

    // Find medication routines with side effects to monitor
    @Query("SELECT mr FROM MedicationRoutine mr WHERE mr.isActive = true AND mr.sideEffectsToMonitor IS NOT NULL AND mr.sideEffectsToMonitor != ''")
    List<MedicationRoutine> findActiveRoutinesWithSideEffectsToMonitor();

    // Find medication routines that need next reminder due calculation
    @Query("SELECT mr FROM MedicationRoutine mr WHERE mr.isActive = true AND mr.reminderEnabled = true AND (mr.nextReminderDue IS NULL OR mr.nextReminderDue < :currentTime)")
    List<MedicationRoutine> findRoutinesNeedingNextReminderUpdate(@Param("currentTime") LocalDateTime currentTime);
}

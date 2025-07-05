package com.hivclinic.repository;

import com.hivclinic.model.MedicationRoutine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface MedicationRoutineRepository extends JpaRepository<MedicationRoutine, Integer> {

    List<MedicationRoutine> findByIsActiveTrueAndTimeOfDayBetween(LocalTime start, LocalTime end);
}

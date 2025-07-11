package com.hivclinic.repository;

import com.hivclinic.model.DoctorAvailabilitySlot;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DoctorAvailabilitySlotRepositoryCustom {
    List<DoctorAvailabilitySlot> findBySlotDateBetween(LocalDate from, LocalDate to);
}

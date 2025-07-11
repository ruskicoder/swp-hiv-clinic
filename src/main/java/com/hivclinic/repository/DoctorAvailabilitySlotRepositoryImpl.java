package com.hivclinic.repository;

import com.hivclinic.model.DoctorAvailabilitySlot;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import java.time.LocalDate;
import java.util.List;

@Repository
public class DoctorAvailabilitySlotRepositoryImpl implements DoctorAvailabilitySlotRepositoryCustom {
    @Autowired
    private EntityManager entityManager;

    @Override
    public List<DoctorAvailabilitySlot> findBySlotDateBetween(LocalDate from, LocalDate to) {
        String jpql = "SELECT s FROM DoctorAvailabilitySlot s WHERE s.slotDate >= :from AND s.slotDate <= :to ORDER BY s.slotDate ASC, s.startTime ASC";
        TypedQuery<DoctorAvailabilitySlot> query = entityManager.createQuery(jpql, DoctorAvailabilitySlot.class);
        query.setParameter("from", from);
        query.setParameter("to", to);
        return query.getResultList();
    }
}

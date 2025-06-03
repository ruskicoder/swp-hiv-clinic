package com.hivclinic.repository;

import com.hivclinic.model.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for Specialty entity
 * Provides data access methods for medical specialties
 */
@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Integer> {
    
    /**
     * Find specialty by name
     */
    Optional<Specialty> findBySpecialtyName(String specialtyName);
    
    /**
     * Check if specialty exists by name
     */
    boolean existsBySpecialtyName(String specialtyName);
}
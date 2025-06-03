package com.hivclinic.repository;

import com.hivclinic.model.PatientProfile;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for PatientProfile entity
 */
@Repository
public interface PatientProfileRepository extends JpaRepository<PatientProfile, Integer> {
    
    /**
     * Find patient profile by user
     */
    Optional<PatientProfile> findByUser(User user);
    
    /**
     * Find patient profile by user ID
     */
    Optional<PatientProfile> findByUser_UserId(Integer userId);
}
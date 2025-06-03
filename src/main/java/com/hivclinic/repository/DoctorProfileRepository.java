package com.hivclinic.repository;

import com.hivclinic.model.DoctorProfile;
import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for DoctorProfile entity
 */
@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Integer> {
    
    /**
     * Find doctor profile by user
     */
    Optional<DoctorProfile> findByUser(User user);
    
    /**
     * Find doctor profile by user ID
     */
    Optional<DoctorProfile> findByUser_UserId(Integer userId);
}
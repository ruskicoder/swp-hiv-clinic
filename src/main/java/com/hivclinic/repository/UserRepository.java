package com.hivclinic.repository;

import com.hivclinic.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    
    Optional<User> findByUsername(String username);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    /**
     * Find user by ID with role eagerly loaded
     */
    @Query("SELECT u FROM User u JOIN FETCH u.role WHERE u.userId = :userId")
    Optional<User> findByUserIdWithRole(@Param("userId") Integer userId);

    @Query("SELECT COUNT(u) FROM User u JOIN u.role r WHERE r.roleName = :roleName")
    long countByRoleName(@Param("roleName") String roleName);

    /**
     * Find all non-dummy users (usernames not starting with 'dummy_')
     */
    @Query("SELECT u FROM User u WHERE u.username NOT LIKE 'dummy_%'")
    List<User> findAllNonDummyUsers();

    /**
     * Find all non-dummy doctors (usernames not starting with 'dummy_')
     */
    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Doctor' AND u.username NOT LIKE 'dummy_%'")
    List<User> findAllNonDummyDoctors();

    /**
     * Find all non-dummy patients (usernames not starting with 'dummy_')
     */
    @Query("SELECT u FROM User u WHERE u.role.roleName = 'Patient' AND u.username NOT LIKE 'dummy_%'")
    List<User> findAllNonDummyPatients();
}
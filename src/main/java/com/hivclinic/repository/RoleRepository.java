package com.hivclinic.repository;

import com.hivclinic.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for Role entity
 */
@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
    
    /**
     * Find role by name
     */
    Optional<Role> findByRoleName(String roleName);
    
    /**
     * Check if role exists by name
     */
    boolean existsByRoleName(String roleName);
}
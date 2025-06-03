package com.hivclinic.repository;

import com.hivclinic.model.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository interface for SystemSetting entity
 */
@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, Integer> {
    
    /**
     * Find system setting by key
     */
    Optional<SystemSetting> findBySettingKey(String settingKey);
    
    /**
     * Check if setting exists by key
     */
    boolean existsBySettingKey(String settingKey);
}

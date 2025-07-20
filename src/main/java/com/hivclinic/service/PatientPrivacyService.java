package com.hivclinic.service;

import com.hivclinic.model.PatientProfile;
import com.hivclinic.repository.PatientProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientPrivacyService {
    private static final Logger logger = LoggerFactory.getLogger(PatientPrivacyService.class);
    
    @Autowired
    private PatientProfileRepository patientProfileRepository;
    
    /**
     * Get patient's privacy settings
     */
    @Transactional(readOnly = true)
    public boolean getPrivacySettings(Integer userId) {
        return patientProfileRepository.findByUser_UserId(userId)
            .map(PatientProfile::getIsPrivate)
            .orElse(false);
    }
    
    /**
     * Update patient's privacy settings
     */
    @Transactional
    public void updatePrivacySettings(Integer userId, boolean isPrivate) {
        PatientProfile profile = patientProfileRepository.findByUser_UserId(userId)
            .orElseThrow(() -> new RuntimeException("Patient profile not found"));
        
        profile.setIsPrivate(isPrivate);
        patientProfileRepository.save(profile);
        
        logger.info("Updated privacy settings for patient {}: isPrivate={}", userId, isPrivate);
    }
}
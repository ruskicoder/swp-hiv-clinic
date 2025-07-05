package com.hivclinic.repository;

import com.hivclinic.model.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {
    
    List<NotificationTemplate> findByIsActiveTrue();
    
    List<NotificationTemplate> findByTypeAndIsActiveTrue(NotificationTemplate.NotificationType type);
    
    List<NotificationTemplate> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);
}
package com.hivclinic.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

/**
 * Health check controller for system monitoring
 */
@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*", maxAge = 3600)
public class HealthController {

    @Autowired
    private DataSource dataSource;

    /**
     * Basic health check
     */
    @GetMapping
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", System.currentTimeMillis());
        health.put("service", "HIV Clinic Backend");
        
        return ResponseEntity.ok(health);
    }

    /**
     * Database connectivity check
     */
    @GetMapping("/db")
    public ResponseEntity<?> databaseCheck() {
        try (Connection connection = dataSource.getConnection()) {
            Map<String, Object> dbHealth = new HashMap<>();
            dbHealth.put("database", "UP");
            dbHealth.put("url", connection.getMetaData().getURL());
            dbHealth.put("driver", connection.getMetaData().getDriverName());
            dbHealth.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(dbHealth);
        } catch (Exception e) {
            Map<String, Object> dbHealth = new HashMap<>();
            dbHealth.put("database", "DOWN");
            dbHealth.put("error", e.getMessage());
            dbHealth.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.status(503).body(dbHealth);
        }
    }

    /**
     * Comprehensive system status
     */
    @GetMapping("/status")
    public ResponseEntity<?> systemStatus() {
        Map<String, Object> status = new HashMap<>();
        
        // Basic info
        status.put("service", "HIV Clinic Management System");
        status.put("version", "1.0.0");
        status.put("timestamp", System.currentTimeMillis());
        
        // Database check
        try (Connection connection = dataSource.getConnection()) {
            status.put("database", "CONNECTED");
        } catch (Exception e) {
            status.put("database", "DISCONNECTED");
            status.put("database_error", e.getMessage());
        }
        
        // Memory info
        Runtime runtime = Runtime.getRuntime();
        Map<String, Object> memory = new HashMap<>();
        memory.put("total", runtime.totalMemory());
        memory.put("free", runtime.freeMemory());
        memory.put("used", runtime.totalMemory() - runtime.freeMemory());
        memory.put("max", runtime.maxMemory());
        status.put("memory", memory);
        
        return ResponseEntity.ok(status);
    }
}
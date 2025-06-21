package com.hivclinic.controller;

import com.hivclinic.service.ManagerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasRole('MANAGER')")
public class ManagerController {
    @Autowired
    private ManagerService managerService;

    @GetMapping("/stats")
    public ResponseEntity<?> getSystemStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalPatients", managerService.getTotalPatients());
        stats.put("totalDoctors", managerService.getTotalDoctors());
        stats.put("totalAppointments", managerService.getTotalAppointments());
        stats.put("totalARVTreatments", managerService.getTotalARVTreatments());
        return ResponseEntity.ok(stats);
    }
}

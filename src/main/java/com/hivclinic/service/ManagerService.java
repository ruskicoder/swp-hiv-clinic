package com.hivclinic.service;

import com.hivclinic.model.User;
import com.hivclinic.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ManagerService {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private ARVTreatmentRepository arvTreatmentRepository;

    public long getTotalPatients() {
        return userRepository.countByRoleName("Patient");
    }

    public long getTotalDoctors() {
        return userRepository.countByRoleName("Doctor");
    }

    public long getTotalAppointments() {
        return appointmentRepository.count();
    }

    public long getTotalARVTreatments() {
        return arvTreatmentRepository.count();
    }

    public List<User> getAllPatients() {
        return userRepository.findAll().stream()
            .filter(user -> "Patient".equalsIgnoreCase(user.getRole().getRoleName()))
            .toList();
    }

    public List<User> getAllDoctors() {
        return userRepository.findAll().stream()
            .filter(user -> "Doctor".equalsIgnoreCase(user.getRole().getRoleName()))
            .toList();
    }
}

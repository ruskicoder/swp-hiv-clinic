package com.hivclinic.controller;

import com.hivclinic.dto.MedicationRoutineDto;
import com.hivclinic.service.MedicationRoutineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/medication-routines")
public class MedicationRoutineController {

    @Autowired
    private MedicationRoutineService medicationRoutineService;

    @PostMapping
    public ResponseEntity<MedicationRoutineDto> createMedicationRoutine(@RequestBody MedicationRoutineDto medicationRoutineDto) {
        MedicationRoutineDto createdRoutine = medicationRoutineService.createMedicationRoutine(medicationRoutineDto);
        return ResponseEntity.ok(createdRoutine);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicationRoutineDto> updateMedicationRoutine(@PathVariable Integer id, @RequestBody MedicationRoutineDto medicationRoutineDto) {
        MedicationRoutineDto updatedRoutine = medicationRoutineService.updateMedicationRoutine(id, medicationRoutineDto);
        return updatedRoutine != null ? ResponseEntity.ok(updatedRoutine) : ResponseEntity.notFound().build();
    }
}
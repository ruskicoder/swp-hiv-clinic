package com.hivclinic.service;

import com.hivclinic.model.*;
import com.hivclinic.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;



@Service
public class ManagerService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private AppointmentRepository appointmentRepository;
    @Autowired
    private ARVTreatmentRepository arvTreatmentRepository;
    @Autowired
    private DoctorAvailabilitySlotRepository doctorAvailabilitySlotRepository;
    @Autowired
    private PatientProfileRepository patientProfileRepository;
    @Autowired
    private PatientRecordRepository patientRecordRepository;
    @Autowired
    private DoctorProfileRepository doctorProfileRepository; // Thêm dòng này

    /**
     * Search ARV treatments by date range (startDate between from and to)
     */
    public List<Map<String, Object>> searchARVTreatmentsByDateRange(java.time.LocalDate from, java.time.LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Both from and to dates must be provided");
        }
        return arvTreatmentRepository.findAll().stream()
            .filter(arv -> arv.getStartDate() != null &&
                (arv.getStartDate().isEqual(from) || arv.getStartDate().isAfter(from)) &&
                (arv.getStartDate().isEqual(to) || arv.getStartDate().isBefore(to)))
            .map(arv -> {
                Map<String, Object> map = new HashMap<>();
                map.put("arvTreatmentID", arv.getArvTreatmentID());
                map.put("regimen", arv.getRegimen());
                map.put("startDate", arv.getStartDate());
                map.put("endDate", arv.getEndDate());
                map.put("adherence", arv.getAdherence());
                map.put("sideEffects", arv.getSideEffects());
                map.put("notes", arv.getNotes());
                map.put("isActive", arv.getIsActive());
                // Lấy tên bệnh nhân
                if (arv.getPatientUserID() != null) {
                    userRepository.findById(arv.getPatientUserID()).ifPresent(u -> {
                        map.put("patientName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                    });
                } else {
                    map.put("patientName", "-");
                }
                // Lấy tên bác sĩ
                if (arv.getDoctorUserID() != null) {
                    userRepository.findById(arv.getDoctorUserID()).ifPresent(u -> {
                        map.put("doctorName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                    });
                } else {
                    map.put("doctorName", "-");
                }
                return map;
            })
            .toList();
    }

    public long getTotalPatients() {
        return userRepository.findAllNonDummyPatients(null).getSize();
    }

    public long getTotalDoctors() {
        return userRepository.findAllNonDummyDoctors(null).getSize();
    }

    public long getTotalAppointments() {
        return appointmentRepository.count();
    }

    public long getTotalARVTreatments() {
        return arvTreatmentRepository.count();
    }

    public List<User> getAllPatients() {
        return (List<User>) userRepository.findAllNonDummyPatients(null);
    }

    public List<User> getAllDoctors() {
        return (List<User>) userRepository.findAllNonDummyDoctors(null);
    }

    public List<com.hivclinic.model.ARVTreatment> getAllARVTreatments() {
        return arvTreatmentRepository.findAll();
    }


    public List<com.hivclinic.model.DoctorAvailabilitySlot> getAllSchedules() {
        return doctorAvailabilitySlotRepository.findAll();
    }

    public List<com.hivclinic.model.DoctorAvailabilitySlot> searchSchedulesByDateRange(java.time.LocalDate from, java.time.LocalDate to) {
        if (from == null || to == null) {
            throw new IllegalArgumentException("Both from and to dates must be provided");
        }
        return doctorAvailabilitySlotRepository.findBySlotDateBetween(from, to);
    }

    public List<User> searchPatientsByName(String q) {
        String query = q == null ? "" : q.trim().toLowerCase();
        return userRepository.findAllNonDummyPatients(null).stream()
            .filter(user -> {
                String firstName = user.getFirstName() != null ? user.getFirstName().toLowerCase() : "";
                String lastName = user.getLastName() != null ? user.getLastName().toLowerCase() : "";
                String fullName = (firstName + " " + lastName).replaceAll("\\s+", " ").trim();
                // Support searching by first, last, or full name (with flexible whitespace)
                if (query.isEmpty()) return true;
                if (firstName.contains(query) || lastName.contains(query) || fullName.contains(query)) return true;
                // Also support splitting query by space and matching both parts
                String[] parts = query.split(" ");
                if (parts.length >= 2) {
                    return firstName.contains(parts[0]) && lastName.contains(parts[1]);
                }
                return false;
            })
            .toList();
    }

    public List<User> searchDoctorsByNameOrSpecialty(String q) {
        String query = q == null ? "" : q.trim().toLowerCase();
        return userRepository.findAllNonDummyDoctors(null).stream()
            .filter(user -> {
                String firstName = user.getFirstName() != null ? user.getFirstName().toLowerCase() : "";
                String lastName = user.getLastName() != null ? user.getLastName().toLowerCase() : "";
                String fullName = (firstName + " " + lastName).replaceAll("\\s+", " ").trim();
                String specialty = user.getSpecialty() != null ? user.getSpecialty().toLowerCase() : "";
                if (query.isEmpty()) return true;
                if (firstName.contains(query) || lastName.contains(query) || fullName.contains(query) || specialty.contains(query)) return true;
                // Also support splitting query by space and matching both parts
                String[] parts = query.split(" ");
                if (parts.length >= 2) {
                    return firstName.contains(parts[0]) && lastName.contains(parts[1]);
                }
                return false;
            })
            .toList();
    }

    public List<java.util.Map<String, Object>> getAllARVTreatmentsWithNames() {
        return arvTreatmentRepository.findAll().stream().map(arv -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("arvTreatmentID", arv.getArvTreatmentID());
            map.put("regimen", arv.getRegimen());
            map.put("startDate", arv.getStartDate());
            map.put("endDate", arv.getEndDate());
            map.put("adherence", arv.getAdherence());
            map.put("sideEffects", arv.getSideEffects());
            map.put("notes", arv.getNotes());
            map.put("isActive", arv.getIsActive());
            // Lấy tên bệnh nhân
            if (arv.getPatientUserID() != null) {
                userRepository.findById(arv.getPatientUserID()).ifPresent(u -> {
                    map.put("patientName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                });
            } else {
                map.put("patientName", "-");
            }
            // Lấy tên bác sĩ
            if (arv.getDoctorUserID() != null) {
                userRepository.findById(arv.getDoctorUserID()).ifPresent(u -> {
                    map.put("doctorName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                });
            } else {
                map.put("doctorName", "-");
            }
            return map;
        }).toList();
    }

    public java.util.Optional<com.hivclinic.model.PatientProfile> getPatientProfile(Integer userId) {
        return patientProfileRepository.findByUser_UserId(userId);
    }

    public java.util.List<com.hivclinic.model.PatientRecord> getPatientRecords(Integer userId) {
        return patientRecordRepository.findAll().stream()
            .filter(r -> r.getPatientUserID() != null && r.getPatientUserID().equals(userId))
            .toList();
    }

    public java.util.Optional<com.hivclinic.model.PatientProfile> getPatientProfileByUserId(Integer userId) {
        return patientProfileRepository.findByUser_UserId(userId);
    }

    public java.util.List<com.hivclinic.model.PatientRecord> getPatientRecordsByUserId(Integer userId) {
        return patientRecordRepository.findAll().stream()
            .filter(r -> r.getPatientUserID() != null && r.getPatientUserID().equals(userId))
            .toList();
    }

    public java.util.Optional<User> getDoctorById(Integer userId) {
        return userRepository.findById(userId).filter(u -> u.getRole() != null && "Doctor".equalsIgnoreCase(u.getRole().getRoleName()));
    }

    public java.util.List<java.util.Map<String, Object>> getARVTreatmentsByDoctor(Integer doctorUserId) {
        return arvTreatmentRepository.findAll().stream()
            .filter(arv -> doctorUserId.equals(arv.getDoctorUserID()))
            .map(arv -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("arvTreatmentID", arv.getArvTreatmentID());
                map.put("regimen", arv.getRegimen());
                map.put("startDate", arv.getStartDate());
                map.put("endDate", arv.getEndDate());
                map.put("notes", arv.getNotes());
                // Lấy tên bệnh nhân
                if (arv.getPatientUserID() != null) {
                    userRepository.findById(arv.getPatientUserID()).ifPresent(u -> {
                        map.put("patientName", (u.getFirstName() != null ? u.getFirstName() : "") + " " + (u.getLastName() != null ? u.getLastName() : ""));
                    });
                } else {
                    map.put("patientName", "-");
                }
                return map;
            }).toList();
    }

    public java.util.List<java.util.Map<String, Object>> getAppointmentsByDoctorUserId(Integer doctorUserId) {
        return appointmentRepository.findAll().stream()
            .filter(a -> a.getDoctorUser() != null && a.getDoctorUser().getUserId().equals(doctorUserId))
            .map(a -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("appointmentId", a.getAppointmentId());
                map.put("patientName", a.getPatientUser() != null ? a.getPatientUser().getFirstName() + " " + a.getPatientUser().getLastName() : "-");
                map.put("dateTime", a.getAppointmentDateTime());
                map.put("status", a.getStatus());
                map.put("notes", a.getAppointmentNotes());
                return map;
            }).toList();
    }

    public java.util.List<java.util.Map<String, Object>> getDoctorSlotsByUserId(Integer doctorUserId) {
        return doctorAvailabilitySlotRepository.findAll().stream()
            .filter(s -> s.getDoctorUser() != null && s.getDoctorUser().getUserId().equals(doctorUserId))
            .map(s -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("slotId", s.getAvailabilitySlotId());
                map.put("date", s.getSlotDate());
                map.put("startTime", s.getStartTime());
                map.put("endTime", s.getEndTime());
                map.put("status", s.getIsBooked() != null && s.getIsBooked() ? "Booked" : "Available");
                
                if (s.getIsBooked() != null && s.getIsBooked()) {
                    var appointments = appointmentRepository.findByAvailabilitySlot(s);
                    if (!appointments.isEmpty()) {
                        var appointment = appointments.get(0); // Most recent
                        var patientUser = appointment.getPatientUser();
                        if (patientUser != null) {
                            map.put("bookedByName", (patientUser.getFirstName() != null ? patientUser.getFirstName() : "") + " " + (patientUser.getLastName() != null ? patientUser.getLastName() : ""));
                            map.put("bookedByUsername", patientUser.getUsername());
                            map.put("bookedByEmail", patientUser.getEmail());
                        }
                    }
                }
                return map;
            }).toList();
    }

    /**
     * Generate CSV content for PatientProfiles table
     */
    public String generatePatientProfilesCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("Profile ID,User ID,First Name,Last Name,Phone Number,Date of Birth,Gender,Address,Blood Type,Emergency Contact,Emergency Phone,Insurance Provider,Insurance Number,Private\n");

        List<PatientProfile> profiles = patientProfileRepository.findAll();
        for (PatientProfile profile : profiles) {
            User user = profile.getUser();
            csv.append(String.format("%d,%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                profile.getPatientProfileId(),
                user != null ? user.getUserId() : "",
                profile.getFirstName().replace("\"", "\"\""),
                profile.getLastName().replace("\"", "\"\""),
                profile.getPhoneNumber() != null ? profile.getPhoneNumber().replace("\"", "\"\"") : "",
                profile.getDateOfBirth() != null ? profile.getDateOfBirth() : "",
                profile.getGender() != null ? profile.getGender().toString().replace("\"", "\"\"") : "",
                profile.getAddress() != null ? profile.getAddress().replace("\"", "\"\"") : "",
                profile.getBloodType() != null ? profile.getBloodType().replace("\"", "\"\"") : "",
                profile.getEmergencyContact() != null ? profile.getEmergencyContact().replace("\"", "\"\"") : "",
                profile.getEmergencyPhone() != null ? profile.getEmergencyPhone().replace("\"", "\"\"") : "",
                profile.getInsuranceProvider() != null ? profile.getInsuranceProvider().replace("\"", "\"\"") : "",
                profile.getInsuranceNumber() != null ? profile.getInsuranceNumber().replace("\"", "\"\"") : "",
                profile.getIsPrivate() != null ? profile.getIsPrivate().toString() : "false"
            ));
        }
        return csv.toString();
    }

    /**
     * Generate CSV content for DoctorAvailabilitySlots table
     */
    public String generateDoctorSlotsCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("Slot ID,Doctor ID,Doctor Name,Date,Start Time,End Time,Status,Booked By\n");

        doctorAvailabilitySlotRepository.findAll().forEach(slot -> {
            String doctorName = "";
            String bookedBy = "";

            if (slot.getDoctorUser() != null) {
                doctorName = (slot.getDoctorUser().getFirstName() + " " + slot.getDoctorUser().getLastName()).trim();
            }

            if (slot.getIsBooked() != null && slot.getIsBooked() && slot.getAppointment() != null && slot.getAppointment().getPatientUser() != null) {
                User patient = slot.getAppointment().getPatientUser();
                bookedBy = (patient.getFirstName() + " " + patient.getLastName()).trim();
            }

            csv.append(String.format("%d,%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                slot.getAvailabilitySlotId(),
                slot.getDoctorUser() != null ? slot.getDoctorUser().getUserId() : "",
                doctorName.replace("\"", "\"\""),
                slot.getSlotDate(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getIsBooked() != null && slot.getIsBooked() ? "Booked" : "Available",
                bookedBy.replace("\"", "\"\"")
            ));
        });

        return csv.toString();
    }

    /**
     * Generate CSV content for ARVTreatments table
     */
    public String generateARVTreatmentsCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("Treatment ID,Patient Name,Doctor Name,Regimen,Start Date,End Date,Adherence,Side Effects,Notes,Is Active,Created At,Updated At\n");

        List<ARVTreatment> treatments = arvTreatmentRepository.findAll();
        for (ARVTreatment arv : treatments) {
            final String[] patientName = {""};  // Make array to be effectively final
            final String[] doctorName = {""};   // Make array to be effectively final

            if (arv.getPatientUserID() != null) {
                userRepository.findById(arv.getPatientUserID()).ifPresent(u -> {
                    String name = (u.getFirstName() + " " + u.getLastName()).trim();
                    if (!name.isEmpty()) {
                        patientName[0] = name;
                    }
                });
            }

            if (arv.getDoctorUserID() != null) {
                userRepository.findById(arv.getDoctorUserID()).ifPresent(u -> {
                    String name = (u.getFirstName() + " " + u.getLastName()).trim();
                    if (!name.isEmpty()) {
                        doctorName[0] = "Dr. " + name;
                    }
                });
            }

            csv.append(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                arv.getArvTreatmentID(),
                patientName[0].replace("\"", "\"\""),  // Access array element
                doctorName[0].replace("\"", "\"\""),   // Access array element
                arv.getRegimen() != null ? arv.getRegimen().replace("\"", "\"\"") : "",
                arv.getStartDate(),
                arv.getEndDate(),
                arv.getAdherence() != null ? arv.getAdherence().replace("\"", "\"\"") : "",
                arv.getSideEffects() != null ? arv.getSideEffects().replace("\"", "\"\"") : "",
                arv.getNotes() != null ? arv.getNotes().replace("\"", "\"\"") : "",
                arv.getIsActive() != null ? arv.getIsActive().toString() : "false",
                arv.getCreatedAt(),
                arv.getUpdatedAt()
            ));
        }
        return csv.toString();
    }

    /**
     * Generate CSV content for Appointments table
     */
    public String generateAppointmentsCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("Appointment ID,Patient Name,Doctor Name,Date Time,Status,Notes,Created At\n");

        appointmentRepository.findAll().forEach(appointment -> {
            String patientName = appointment.getPatientUser() != null ? 
                (appointment.getPatientUser().getFirstName() + " " + appointment.getPatientUser().getLastName()).trim() : "";
            
            String doctorName = appointment.getDoctorUser() != null ? 
                (appointment.getDoctorUser().getFirstName() + " " + appointment.getDoctorUser().getLastName()).trim() : "";

            csv.append(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                appointment.getAppointmentId(),
                patientName.replace("\"", "\"\""),
                doctorName.replace("\"", "\"\""),
                appointment.getAppointmentDateTime(),
                appointment.getStatus() != null ? appointment.getStatus() : "",
                appointment.getAppointmentNotes() != null ? appointment.getAppointmentNotes().replace("\"", "\"\"") : "",
                appointment.getCreatedAt()
            ));
        });

        return csv.toString();
    }

    /**
     * Generate CSV content for DoctorProfiles table
     */
    public String generateDoctorProfilesCSV() {
        StringBuilder csv = new StringBuilder();
        csv.append("Profile ID,User ID,First Name,Last Name,Specialty,Phone Number,Bio\n");

        List<DoctorProfile> profiles = doctorProfileRepository.findAll();
        for (DoctorProfile profile : profiles) {
            User user = profile.getUser();
            String specialtyName = profile.getSpecialty() != null ? profile.getSpecialty().getSpecialtyName() : "";
            
            csv.append(String.format("%d,%d,\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                profile.getDoctorProfileId(),
                user != null ? user.getUserId() : "",
                profile.getFirstName().replace("\"", "\"\""),
                profile.getLastName().replace("\"", "\"\""),
                specialtyName.replace("\"", "\"\""),
                profile.getPhoneNumber() != null ? profile.getPhoneNumber().replace("\"", "\"\"") : "",
                profile.getBio() != null ? profile.getBio().replace("\"", "\"\"") : ""
            ));
        }
        return csv.toString();
    }
}

package com.hivclinic.config;

import com.hivclinic.model.Role;
import com.hivclinic.model.Specialty;
import com.hivclinic.model.SystemSetting;
import com.hivclinic.model.User;
import com.hivclinic.model.PatientProfile;
import com.hivclinic.model.DoctorProfile;
import com.hivclinic.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data initializer for setting up default data
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Autowired
    private SystemSettingRepository systemSettingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PatientProfileRepository patientProfileRepository;

    @Autowired
    private DoctorProfileRepository doctorProfileRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting data initialization...");
        
        // Check if data already exists
        if (roleRepository.count() > 0) {
            logger.info("Data already initialized, skipping...");
            return;
        }

        initializeRoles();
        initializeSpecialties();
        initializeSystemSettings();
        initializeDefaultAdmin();
        initializeTestPatient();
        initializeTestDoctor();
        
        logger.info("Data initialization completed successfully!");
    }

    private void initializeRoles() {
        try {
                Role patientRole = new Role();
                patientRole.setRoleName("Patient");
                roleRepository.save(patientRole);
                logger.info("Patient role created");

                Role doctorRole = new Role();
                doctorRole.setRoleName("Doctor");
                roleRepository.save(doctorRole);
                logger.info("Doctor role created");

                Role adminRole = new Role();
                adminRole.setRoleName("Admin");
                roleRepository.save(adminRole);
                logger.info("Admin role created");
        } catch (Exception e) {
            logger.error("Error initializing roles: {}", e.getMessage());
        }
    }

    private void initializeSpecialties() {
        try {
            Specialty specialty1 = new Specialty();
            specialty1.setSpecialtyName("HIV/AIDS Specialist");
            specialty1.setDescription("Specialist in HIV/AIDS treatment and care");
            specialty1.setIsActive(true);
            specialtyRepository.save(specialty1);
                logger.info("HIV/AIDS Specialist specialty created");

            Specialty specialty2 = new Specialty();
            specialty2.setSpecialtyName("Infectious Disease");
            specialty2.setDescription("Specialist in infectious diseases");
            specialty2.setIsActive(true);
            specialtyRepository.save(specialty2);
                logger.info("Infectious Disease specialty created");

            Specialty specialty3 = new Specialty();
            specialty3.setSpecialtyName("Internal Medicine");
            specialty3.setDescription("Internal medicine physician");
            specialty3.setIsActive(true);
            specialtyRepository.save(specialty3);
                logger.info("Internal Medicine specialty created");
        } catch (Exception e) {
            logger.error("Error initializing specialties: {}", e.getMessage());
        }
    }

    private void initializeSystemSettings() {
        try {
            SystemSetting setting1 = new SystemSetting();
            setting1.setSettingKey("DefaultAppointmentDurationMinutes");
            setting1.setSettingValue("30");
            setting1.setDescription("Default duration for appointments in minutes");
            systemSettingRepository.save(setting1);
                logger.info("Default appointment duration setting created");

            SystemSetting setting2 = new SystemSetting();
            setting2.setSettingKey("MaxBookingLeadDays");
            setting2.setSettingValue("30");
            setting2.setDescription("Maximum number of days in advance that appointments can be booked");
            systemSettingRepository.save(setting2);
                logger.info("Max booking lead days setting created");
        } catch (Exception e) {
            logger.error("Error initializing system settings: {}", e.getMessage());
        }
    }

    private void initializeDefaultAdmin() {
        try {
            if (userRepository.findByUsername("admin").isEmpty()) {
                Role adminRole = roleRepository.findByRoleName("Admin")
                        .orElseThrow(() -> new RuntimeException("Admin role not found"));

                User adminUser = new User();
                adminUser.setUsername("admin");
                adminUser.setEmail("admin@hivclinic.com");
                adminUser.setPasswordHash(passwordEncoder.encode("admin123"));
                adminUser.setRole(adminRole);
                adminUser.setIsActive(true);

                userRepository.save(adminUser);
                logger.info("Default admin user created - Username: admin, Password: admin123");
        }
        } catch (Exception e) {
            logger.error("Error creating default admin: {}", e.getMessage());
        }
    }

    private void initializeTestPatient() {
        try {
            if (userRepository.findByUsername("patient1").isEmpty()) {
                Role patientRole = roleRepository.findByRoleName("Patient")
                        .orElseThrow(() -> new RuntimeException("Patient role not found"));

                User patientUser = new User();
                patientUser.setUsername("patient1");
                patientUser.setEmail("patient1@hivclinic.com");
                patientUser.setPasswordHash(passwordEncoder.encode("patient123"));
                patientUser.setRole(patientRole);
                patientUser.setIsActive(true);

                User savedPatient = userRepository.save(patientUser);

                PatientProfile patientProfile = new PatientProfile();
                patientProfile.setUser(savedPatient);
                patientProfile.setFirstName("John");
                patientProfile.setLastName("Doe");
                patientProfile.setPhoneNumber("+1234567890");
                patientProfileRepository.save(patientProfile);

                logger.info("Test patient created - Username: patient1, Password: patient123");
}
        } catch (Exception e) {
            logger.error("Error creating test patient: {}", e.getMessage());
        }
    }

    private void initializeTestDoctor() {
        try {
            if (userRepository.findByUsername("doctor1").isEmpty()) {
                Role doctorRole = roleRepository.findByRoleName("Doctor")
                        .orElseThrow(() -> new RuntimeException("Doctor role not found"));

                Specialty specialty = specialtyRepository.findBySpecialtyName("HIV/AIDS Specialist")
                        .orElse(null);

                User doctorUser = new User();
                doctorUser.setUsername("doctor1");
                doctorUser.setEmail("doctor1@hivclinic.com");
                doctorUser.setPasswordHash(passwordEncoder.encode("doctor123"));
                doctorUser.setRole(doctorRole);
                doctorUser.setIsActive(true);

                User savedDoctor = userRepository.save(doctorUser);

                DoctorProfile doctorProfile = new DoctorProfile();
                doctorProfile.setUser(savedDoctor);
                doctorProfile.setFirstName("Dr. John");
                doctorProfile.setLastName("Smith");
                doctorProfile.setPhoneNumber("+1234567890");
                doctorProfile.setSpecialty(specialty);
                doctorProfile.setBio("Experienced HIV/AIDS specialist with 10+ years of practice.");
                doctorProfileRepository.save(doctorProfile);

                logger.info("Test doctor created - Username: doctor1, Password: doctor123");
            }
        } catch (Exception e) {
            logger.error("Error creating test doctor: {}", e.getMessage());
        }
    }
}
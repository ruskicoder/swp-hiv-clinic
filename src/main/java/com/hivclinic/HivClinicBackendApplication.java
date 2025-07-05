package com.hivclinic;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HivClinicBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(HivClinicBackendApplication.class, args);
    }
}
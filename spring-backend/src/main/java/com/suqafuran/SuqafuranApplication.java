package com.suqafuran;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ConfigurationPropertiesScan
public class SuqafuranApplication {

    public static void main(String[] args) {
        SpringApplication.run(SuqafuranApplication.class, args);
    }
}


package com.vivek.novelforge.engagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EngagementServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(EngagementServiceApplication.class, args);
	}

}

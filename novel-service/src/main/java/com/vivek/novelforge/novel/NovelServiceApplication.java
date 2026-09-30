package com.vivek.novelforge.novel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NovelServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(NovelServiceApplication.class, args);
	}

}

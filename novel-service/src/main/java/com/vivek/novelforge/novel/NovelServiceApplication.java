package com.vivek.novelforge.novel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class NovelServiceApplication {

	public static void main(String[] args) {
		configureDatabaseUrl();
		SpringApplication.run(NovelServiceApplication.class, args);
	}

	private static void configureDatabaseUrl() {
		String dbUrl = System.getenv("DATABASE_URL");
		if (dbUrl != null && !dbUrl.isBlank() && System.getProperty("spring.datasource.url") == null && System.getenv("SPRING_DATASOURCE_URL") == null) {
			try {
				String cleanUrl = dbUrl.replaceFirst("^[a-zA-Z]+://", "");
				int atIndex = cleanUrl.indexOf('@');
				if (atIndex != -1) {
					String userInfo = cleanUrl.substring(0, atIndex);
					String hostAndPath = cleanUrl.substring(atIndex + 1);

					int colonIndex = userInfo.indexOf(':');
					String username = colonIndex != -1 ? userInfo.substring(0, colonIndex) : userInfo;
					String password = colonIndex != -1 ? userInfo.substring(colonIndex + 1) : "";

					String jdbcUrl = "jdbc:postgresql://" + hostAndPath;
					if (!jdbcUrl.contains("sslmode") && (hostAndPath.contains("render.com") || hostAndPath.contains("oregon-postgres"))) {
						jdbcUrl += (jdbcUrl.contains("?") ? "&" : "?") + "sslmode=require";
					}

					System.setProperty("spring.datasource.url", jdbcUrl);
					System.setProperty("spring.datasource.username", username);
					System.setProperty("spring.datasource.password", password);
				}
			} catch (Exception e) {
				System.err.println("Failed to parse DATABASE_URL: " + e.getMessage());
			}
		}
	}

}

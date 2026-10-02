package com.vivek.novelforge.identity;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.net.URI;

@SpringBootApplication
public class IdentityServiceApplication {

	public static void main(String[] args) {
		configureCloudEnvironment();
		SpringApplication.run(IdentityServiceApplication.class, args);
	}

	private static void configureCloudEnvironment() {
		// 1. Configure Redis from REDIS_URL or individual env vars
		String redisUrl = getFirstEnv("REDIS_URL", "SPRING_DATA_REDIS_URL", "redis url");
		if (redisUrl != null && !redisUrl.isBlank()) {
			try {
				URI uri = URI.create(redisUrl);
				if (uri.getHost() != null) {
					System.setProperty("spring.data.redis.host", uri.getHost());
				}
				if (uri.getPort() > 0) {
					System.setProperty("spring.data.redis.port", String.valueOf(uri.getPort()));
				}

				if (uri.getUserInfo() != null) {
					String[] parts = uri.getUserInfo().split(":", 2);
					if (parts.length > 0 && !parts[0].isBlank()) {
						System.setProperty("spring.data.redis.username", parts[0]);
					}
					if (parts.length > 1 && !parts[1].isBlank()) {
						System.setProperty("spring.data.redis.password", parts[1]);
					}
				}

				if ("rediss".equalsIgnoreCase(uri.getScheme())) {
					System.setProperty("spring.data.redis.ssl.enabled", "true");
				}
			} catch (Exception e) {
				System.err.println("Could not parse REDIS_URL into components: " + e.getMessage());
			}
		}

		// Support individual env vars (e.g. host, port, passwd)
		String host = getFirstEnv("REDIS_HOST", "SPRING_DATA_REDIS_HOST", "host");
		if (host != null && !host.isBlank()) {
			System.setProperty("spring.data.redis.host", host);
		}
		String port = getFirstEnv("REDIS_PORT", "SPRING_DATA_REDIS_PORT", "port");
		if (port != null && !port.isBlank()) {
			System.setProperty("spring.data.redis.port", port);
		}
		String passwd = getFirstEnv("REDIS_PASSWORD", "SPRING_DATA_REDIS_PASSWORD", "passwd");
		if (passwd != null && !passwd.isBlank()) {
			System.setProperty("spring.data.redis.password", passwd);
		}

		// 2. Configure PostgreSQL if DATABASE_URL is set
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
				System.err.println("Failed to parse DATABASE_URL in identity-service: " + e.getMessage());
			}
		}
	}

	private static String getFirstEnv(String... names) {
		for (String name : names) {
			String val = System.getenv(name);
			if (val != null && !val.isBlank()) return val;
		}
		return null;
	}

}

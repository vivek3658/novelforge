package com.vivek.novelforge.security;

import com.vivek.novelforge.security.jwt.JwtProperties;
import com.vivek.novelforge.security.jwt.JwtTokenValidator;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(NovelforgeSecurityApplicationTests.SecurityTestConfiguration.class)
class NovelforgeSecurityApplicationTests {

	@Test
	void contextLoads() {
	}

	@TestConfiguration
	static class SecurityTestConfiguration {
		@Bean
		JwtTokenValidator jwtTokenValidator() {
			JwtProperties properties = new JwtProperties();
			properties.setSecretKey("test-signing-key-with-at-least-32-bytes");
			return new JwtTokenValidator(properties);
		}
	}

}

package com.vivek.novelforge.engagement.security;

import com.vivek.novelforge.security.jwt.JwtAuthFilter;
import com.vivek.novelforge.security.jwt.JwtProperties;
import com.vivek.novelforge.security.jwt.JwtTokenValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(JwtProperties.class)
@RequiredArgsConstructor
public class EngagementSecurityConfig {
    @Bean JwtTokenValidator jwtTokenValidator(JwtProperties properties) { return new JwtTokenValidator(properties); }
    @Bean JwtAuthFilter jwtAuthFilter(JwtTokenValidator validator) { return new JwtAuthFilter(validator); }

    @Bean
    SecurityFilterChain engagementFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/**", "/public/posts/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/targets/**", "/follows/*/*/count").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .formLogin(form -> form.disable()).build();
    }
}

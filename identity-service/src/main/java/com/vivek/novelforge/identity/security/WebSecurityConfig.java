package com.vivek.novelforge.identity.security;


import com.vivek.novelforge.security.jwt.JwtAuthFilter;
import com.vivek.novelforge.security.jwt.JwtProperties;
import com.vivek.novelforge.security.jwt.JwtTokenValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@Slf4j
@RequiredArgsConstructor
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {
    @Bean
    public JwtProperties jwtProperties() {
        return new JwtProperties();
    }
    @Bean
    public JwtTokenValidator jwtTokenValidator(
            JwtProperties jwtProperties
    ) {
        return new JwtTokenValidator(jwtProperties);
    }
    @Bean
    public JwtAuthFilter jwtAuthFilter(
            JwtTokenValidator jwtTokenValidator
    ) {
        return new JwtAuthFilter(jwtTokenValidator);
    }
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity,JwtAuthFilter jwtAuthFilter) throws Exception{
        httpSecurity
                .csrf(csrfConfig -> csrfConfig.disable())
                .sessionManagement(sessionManagement -> sessionManagement.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/login",
                                "/register/**",
                                "/auth/refresh",
                                "/auth/forgot-password/**"
                        ).permitAll()

                        .requestMatchers("/auth/me").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                ;
        return httpSecurity.build();

    }

}

package com.vivek.novelforge.novel.security;
import com.vivek.novelforge.security.jwt.JwtAuthFilter;
import com.vivek.novelforge.security.jwt.JwtProperties;
import com.vivek.novelforge.security.jwt.JwtTokenValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
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
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthFilter jwtAuthFilter
    ) throws Exception {

        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/public/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .formLogin(form -> form.disable())
                .build();
    }
}
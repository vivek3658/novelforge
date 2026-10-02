package com.vivek.novelforge.api.config;

import org.springframework.context.annotation.Configuration;


import org.springframework.context.annotation.Bean;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsWebFilter corsWebFilter() {

        CorsConfiguration config = new CorsConfiguration();

        // Support local frontend development, preview environments, and production Render domains
        config.setAllowedOriginPatterns(
                List.of(
                        "http://localhost:[*]",
                        "http://127.0.0.1:[*]",
                        "https://*.onrender.com",
                        "https://novelforge-7aa8.onrender.com"
                )
        );

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS",
                        "HEAD"
                )
        );

        config.setAllowedHeaders(
                List.of(
                        "Origin",
                        "Content-Type",
                        "Accept",
                        "Authorization",
                        "X-Requested-With",
                        "Access-Control-Request-Method",
                        "Access-Control-Request-Headers"
                )
        );

        config.setExposedHeaders(
                List.of(
                        "Authorization",
                        "Set-Cookie",
                        "Content-Disposition"
                )
        );

        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config
        );

        return new CorsWebFilter(source);
    }
}

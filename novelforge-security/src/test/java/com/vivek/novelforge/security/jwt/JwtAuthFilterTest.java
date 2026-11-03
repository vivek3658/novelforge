package com.vivek.novelforge.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.ServletException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

class JwtAuthFilterTest {
    private static final String SECRET = "novelforge-test-signing-key-0123456789";

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void downstreamExceptionsAreNotConvertedToUnauthorized() {
        JwtProperties properties = new JwtProperties();
        properties.setSecretKey(SECRET);
        JwtAuthFilter filter = new JwtAuthFilter(new JwtTokenValidator(properties));
        String token = accessToken();
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + token);
        request.addHeader("X-Request-Id", "request-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        ServletException downstreamFailure = new ServletException("membership lookup failed");
        FilterChain downstream = (servletRequest, servletResponse) -> {
            throw downstreamFailure;
        };

        ServletException thrown = assertThrows(ServletException.class,
                () -> filter.doFilterInternal(request, response, downstream));

        assertSame(downstreamFailure, thrown);
        assertEquals(200, response.getStatus());
    }

    private String accessToken() {
        Claims claims = Jwts.claims()
                .subject("test-user")
                .add("type", "access")
                .add("userId", "42")
                .add("roles", List.of())
                .add("authorities", List.of())
                .build();
        return Jwts.builder()
                .claims(claims)
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .compact();
    }
}
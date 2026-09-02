package com.vivek.novelforge.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@RequiredArgsConstructor
public class JwtTokenValidator {

    private final JwtProperties properties;

    private SecretKey getSecretKey() {
        return Keys.hmacShaKeyFor(
                properties.getSecretKey()
                        .getBytes(StandardCharsets.UTF_8)
        );
    }

    public Claims validate(String token) {

        return Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
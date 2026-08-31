package com.vivek.novelforge.identity.security;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.type.RoleType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

@Component
@Slf4j
public class AuthUtil {
    @Value("${jwt.secretKey}")
    private String jwtSecretKey;

    private SecretKey getSecretKey(){
        return Keys.hmacShaKeyFor(jwtSecretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user){
        List<String> roles = user.getRoles()
                .stream()
                .map(RoleType::name)
                .toList();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId",user.getId().toString())
                .claim("roles",roles)
                .claim("type","access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000*60*10))
                .signWith(getSecretKey())
                .compact();
    }

    public String getUsernameFromToken(String token){
        Claims claims = Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }
    public String getUsernameFromRefreshToken(String token) {

        Claims claims = Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        return claims.getSubject();
    }
    public String generateRefreshToken(User user) {
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("userId",user.getId().toString())
                .claim("type","refresh")
                .issuedAt(new Date())
                .expiration(new Date(
                        System.currentTimeMillis() + 1000L * 60 * 60 * 24 * 30
                ))
                .signWith(getSecretKey())
                .compact();
    }
}

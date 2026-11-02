package com.vivek.novelforge.identity.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.UUID;

@Component
public class OtpFlowCookieSupport {
    @Value("${identity.cookies.secure:true}")
    private boolean secure;

    public String resolveOrCreate(String existing) {
        try {
            return UUID.fromString(existing).toString();
        } catch (RuntimeException exception) {
            return UUID.randomUUID().toString();
        }
    }

    public ResponseCookie cookie(String name, String value) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ofMinutes(15))
                .build();
    }

    public ResponseCookie expiredCookie(String name) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(secure)
                .sameSite(secure ? "None" : "Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }

    public boolean isSecure() {
        return secure;
    }
}

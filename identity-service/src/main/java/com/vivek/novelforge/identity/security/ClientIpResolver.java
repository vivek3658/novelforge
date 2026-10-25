package com.vivek.novelforge.identity.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class ClientIpResolver {
    @Value("${identity.gateway.internal-secret:}")
    private String gatewayInternalSecret;

    public String resolve(HttpServletRequest request) {
        String suppliedSecret = request.getHeader("X-NF-Gateway-Secret");
        String forwardedIp = request.getHeader("X-NF-Client-IP");
        if (gatewayInternalSecret != null && !gatewayInternalSecret.isBlank()
                && suppliedSecret != null && forwardedIp != null
                && MessageDigest.isEqual(
                gatewayInternalSecret.getBytes(StandardCharsets.UTF_8),
                suppliedSecret.getBytes(StandardCharsets.UTF_8))) {
            return forwardedIp;
        }
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}

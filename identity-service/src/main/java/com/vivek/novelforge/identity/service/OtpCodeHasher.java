package com.vivek.novelforge.identity.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

@Component
public class OtpCodeHasher {
    private final byte[] secret;

    public OtpCodeHasher(@Value("${novelforge.otp.hmac-secret}") String secret) {
        if (secret == null) throw new IllegalStateException("OTP_HMAC_SECRET must be configured");
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        if (this.secret.length < 32) {
            throw new IllegalStateException("OTP_HMAC_SECRET must contain at least 32 bytes");
        }
    }

    public String hash(String otp) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(otp.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to hash OTP", exception);
        }
    }

    public boolean matches(String otp, String expectedHash) {
        if (otp == null || expectedHash == null) return false;
        return MessageDigest.isEqual(
                hash(otp).getBytes(StandardCharsets.US_ASCII),
                expectedHash.getBytes(StandardCharsets.US_ASCII)
        );
    }
}

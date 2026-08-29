package com.vivek.novelforge.identity.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RegistrationRedisService {

    private final StringRedisTemplate redisTemplate;

    private static final String PREFIX = "registration:";

    private String otpKey(String email) {
        return PREFIX + email.toLowerCase();
    }

    private String verifiedKey(String email) {
        return PREFIX + "verified:" + email.toLowerCase();
    }

    public void saveOtp(String email, String otp) {
        redisTemplate.opsForValue()
                .set(
                        otpKey(email),
                        otp,
                        Duration.ofMinutes(5)
                );
    }

    public String getOtp(String email) {
        return redisTemplate.opsForValue()
                .get(otpKey(email));
    }

    public void deleteOtp(String email) {
        redisTemplate.delete(otpKey(email));
    }

    public void markEmailVerified(String email) {
        redisTemplate.opsForValue()
                .set(
                        verifiedKey(email),
                        "true",
                        Duration.ofMinutes(10)
                );
    }

    public boolean isEmailVerified(String email) {
        return Boolean.TRUE.equals(
                redisTemplate.hasKey(verifiedKey(email))
        );
    }

    public void deleteEmailVerified(String email) {
        redisTemplate.delete(verifiedKey(email));
    }
}
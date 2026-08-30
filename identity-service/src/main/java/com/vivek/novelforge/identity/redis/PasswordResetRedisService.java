package com.vivek.novelforge.identity.redis;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class PasswordResetRedisService {
    private final StringRedisTemplate redisTemplate;
    private static final String OTP_PREFIX = "password-reset:";
    private static final String VERIFIED_PREFIX = "password-reset:verified:";

    public void saveOtp(String email, String otp) {

        String key = OTP_PREFIX + email.toLowerCase();

        redisTemplate.opsForValue()
                .set(key, otp, Duration.ofMinutes(5));
    }

    public String getOtp(String email) {

        return redisTemplate.opsForValue()
                .get(OTP_PREFIX + email.toLowerCase());
    }

    public void deleteOtp(String email) {

        redisTemplate.delete(
                OTP_PREFIX + email.toLowerCase()
        );
    }

    public void markVerified(String email) {

        redisTemplate.opsForValue().set(
                VERIFIED_PREFIX + email.toLowerCase(),
                "true",
                Duration.ofMinutes(10)
        );
    }

    public boolean isVerified(String email) {

        return Boolean.TRUE.equals(
                redisTemplate.hasKey(
                        VERIFIED_PREFIX + email.toLowerCase()
                )
        );
    }

    public void deleteVerified(String email) {

        redisTemplate.delete(
                VERIFIED_PREFIX + email.toLowerCase()
        );
    }
}

package com.vivek.novelforge.identity.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OtpRateLimitService {
    private static final int MAX_SENDS_PER_WINDOW = 3;
    private static final int WINDOW_SECONDS = 600;
    private static final DefaultRedisScript<Long> INCREMENT_WINDOW = new DefaultRedisScript<>(
            "local n = redis.call('incr', KEYS[1]); " +
            "if n == 1 then redis.call('expire', KEYS[1], ARGV[1]); end; " +
            "local i = redis.call('incr', KEYS[2]); " +
            "if i == 1 then redis.call('expire', KEYS[2], ARGV[1]); end; " +
            "if n > tonumber(ARGV[2]) or i > tonumber(ARGV[3]) then return 0; end; " +
            "return 1", Long.class);
    private static final DefaultRedisScript<Long> INCREMENT_VERIFY_WINDOW = new DefaultRedisScript<>(
            "local f = redis.call('incr', KEYS[1]); " +
            "if f == 1 then redis.call('expire', KEYS[1], ARGV[1]); end; " +
            "local i = redis.call('incr', KEYS[2]); " +
            "if i == 1 then redis.call('expire', KEYS[2], ARGV[1]); end; " +
            "if f > tonumber(ARGV[2]) or i > tonumber(ARGV[3]) then return 0; end; " +
            "return 1", Long.class);

    private final StringRedisTemplate redisTemplate;
    private final OtpCodeHasher otpCodeHasher;

    public OtpRateLimitService(StringRedisTemplate redisTemplate, OtpCodeHasher otpCodeHasher) {
        this.redisTemplate = redisTemplate;
        this.otpCodeHasher = otpCodeHasher;
    }

    public void checkOtpSendAllowed(String email, String clientIp) {
        String normalized = email.trim().toLowerCase(java.util.Locale.ROOT);
        String emailKey = "rate-limit:otp-email:" + otpCodeHasher.hash("email:" + normalized);
        String ipKey = "rate-limit:otp-ip:" + otpCodeHasher.hash("ip:" + clientIp);
        Long allowed = redisTemplate.execute(INCREMENT_WINDOW, List.of(emailKey, ipKey),
                Integer.toString(WINDOW_SECONDS), Integer.toString(MAX_SENDS_PER_WINDOW), "20");
        if (allowed == null || allowed != 1L) {
            throw new OtpRateLimitExceededException();
        }
    }

    public void checkOtpVerificationAllowed(String flowId, String clientIp) {
        String flowKey = "rate-limit:otp-verify:flow:" + otpCodeHasher.hash("flow:" + flowId);
        String ipKey = "rate-limit:otp-verify:ip:" + otpCodeHasher.hash("ip:" + clientIp);
        Long allowed = redisTemplate.execute(INCREMENT_VERIFY_WINDOW, List.of(flowKey, ipKey),
                "300", "5", "100");
        if (allowed == null || allowed != 1L) {
            throw new OtpRateLimitExceededException();
        }
    }
}

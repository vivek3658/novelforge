package com.vivek.novelforge.identity.redis;

import com.vivek.novelforge.identity.service.OtpCodeHasher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RegistrationRedisService {
    private static final String PREFIX = "registration:flow:";
    private static final DefaultRedisScript<Long> SAVE_CHALLENGE = new DefaultRedisScript<>(
            "redis.call('setex', KEYS[1], ARGV[4], ARGV[1]); " +
            "redis.call('setex', KEYS[2], ARGV[4], ARGV[2]); " +
            "redis.call('setex', KEYS[3], ARGV[4], ARGV[3]); return 1",
            Long.class);
    private static final DefaultRedisScript<Long> DELETE_IF_CHALLENGE_MATCHES =
            new DefaultRedisScript<>(
                    "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                    "redis.call('del', KEYS[1], KEYS[2], KEYS[3]); return 1; " +
                    "end; return 0", Long.class);
    private static final DefaultRedisScript<Long> VERIFY_CHALLENGE = new DefaultRedisScript<>(
            "if redis.call('get', KEYS[1]) == ARGV[1] and " +
            "redis.call('get', KEYS[2]) == ARGV[2] and " +
            "redis.call('get', KEYS[3]) == ARGV[3] then " +
            "redis.call('del', KEYS[1], KEYS[2], KEYS[3]); " +
            "redis.call('setex', KEYS[4], ARGV[4], ARGV[1]); return 1; end; return 0",
            Long.class);

    private final StringRedisTemplate redisTemplate;
    private final OtpCodeHasher otpCodeHasher;

    private String key(String flowId, String suffix) {
        return PREFIX + flowId + ":" + suffix;
    }

    public void saveOtp(String email, String otp, String challengeId, String flowId) {
        redisTemplate.execute(SAVE_CHALLENGE,
                List.of(key(flowId, "email"), key(flowId, "otp"), key(flowId, "challenge")),
                email, otpCodeHasher.hash(otp), challengeId, "300");
        redisTemplate.delete(key(flowId, "verified"));
    }

    public boolean isCurrentChallenge(String email, String flowId, String challengeId) {
        return email.equals(redisTemplate.opsForValue().get(key(flowId, "email")))
                && challengeId.equals(redisTemplate.opsForValue().get(key(flowId, "challenge")));
    }

    public void deleteOtp(String flowId) {
        redisTemplate.delete(List.of(key(flowId, "email"), key(flowId, "otp"), key(flowId, "challenge")));
    }

    public boolean verifyOtpAndMarkEmail(String email, String otp, String flowId) {
        if (otp == null || !otp.matches("\\d{6}")) return false;
        Long verified = redisTemplate.execute(VERIFY_CHALLENGE,
                List.of(key(flowId, "email"), key(flowId, "otp"), key(flowId, "challenge"), key(flowId, "verified")),
                email, otpCodeHasher.hash(otp), "300", "600");
        return verified != null && verified == 1L;
    }

    public void deleteOtpIfChallengeMatches(String flowId, String challengeId) {
        redisTemplate.execute(DELETE_IF_CHALLENGE_MATCHES,
                List.of(key(flowId, "challenge"), key(flowId, "email"), key(flowId, "otp")), challengeId);
    }

    public boolean isEmailVerified(String email, String flowId) {
        return email.equals(redisTemplate.opsForValue().get(key(flowId, "verified")));
    }

    public void deleteEmailVerified(String flowId) {
        redisTemplate.delete(key(flowId, "verified"));
    }
}

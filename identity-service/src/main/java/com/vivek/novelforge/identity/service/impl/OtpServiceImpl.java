package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.messaging.OtpEmailPublisher;
import com.vivek.novelforge.identity.redis.PasswordResetRedisService;
import com.vivek.novelforge.identity.redis.RegistrationRedisService;
import com.vivek.novelforge.identity.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {
    private final OtpEmailPublisher otpEmailPublisher;
    private final RegistrationRedisService registrationRedisService;
    private final PasswordResetRedisService passwordResetRedisService;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Override
    public void sendOtp(String email, String otp, UUID challengeId, String flowId, String purpose) {
        otpEmailPublisher.publish(email, otp, challengeId, flowId, purpose);
    }

    @Override
    public boolean verifyOtp(String email, String otp, String flowId) {
        return verifyOtp(email, otp, flowId, "REGISTRATION");
    }

    @Override
    public boolean verifyOtp(String email, String otp, String flowId, String purpose) {
        if ("PASSWORD_RESET".equals(purpose)) {
            return passwordResetRedisService.verifyOtpAndMarkVerified(email, otp, flowId);
        }
        return "REGISTRATION".equals(purpose)
                && registrationRedisService.verifyOtpAndMarkEmail(email, otp, flowId);
    }

    @Override
    public String generateOtp(String email) {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }
}

package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.exception.PasswordResetNotVerifiedException;
import com.vivek.novelforge.identity.redis.PasswordResetRedisService;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.OtpService;
import com.vivek.novelforge.identity.service.PasswordResetService;
import com.vivek.novelforge.identity.service.OtpRateLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {
    private final PasswordResetRedisService passwordResetRedisService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final OtpRateLimitService otpRateLimitService;

    @Override
    public void sendResetOtp(String email, String flowId, String clientIp) {
        email = email.toLowerCase(Locale.ROOT).trim();
        otpRateLimitService.checkOtpSendAllowed(email, clientIp);
        passwordResetRedisService.deleteOtp(flowId);

        /*
         * Don't reveal whether the email exists.
         */
        if (!userRepository.existsByEmail(email)) {
            return;
        }

        String otp = otpService.generateOtp(email);
        String challengeId = UUID.randomUUID().toString();
        passwordResetRedisService.saveOtp(email, otp, challengeId, flowId);
        try {
            otpService.sendOtp(email, otp, UUID.fromString(challengeId), flowId, "PASSWORD_RESET");
        } catch (RuntimeException exception) {
            passwordResetRedisService.deleteOtpIfChallengeMatches(flowId, challengeId);
            throw exception;
        }
    }

    @Override
    public void verifyResetOtp(String email, String otp, String flowId, String clientIp) {
        email = email.toLowerCase(Locale.ROOT).trim();
        otpRateLimitService.checkOtpVerificationAllowed(flowId, clientIp);

        if (!otpService.verifyOtp(email, otp, flowId, "PASSWORD_RESET")) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
    }

    @Override
    public boolean isCurrentOtpChallenge(String email, String flowId, String challengeId) {
        return passwordResetRedisService.isCurrentChallenge(
                email.trim().toLowerCase(Locale.ROOT), flowId, challengeId);
    }

    @Override
    public void resetPassword(String email, String newPassword, String flowId) {
        email = email.toLowerCase(Locale.ROOT).trim();
        if(!passwordResetRedisService.isVerified(email, flowId)){
            throw new PasswordResetNotVerifiedException(
                    "Password Reset is Not Verified"
            );
        }
        User user = userRepository.findByEmail(email.toLowerCase()).orElseThrow(() -> new RuntimeException("User Not Found"));
        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );
        userRepository.save(user);
        passwordResetRedisService.deleteVerified(flowId);
    }
}

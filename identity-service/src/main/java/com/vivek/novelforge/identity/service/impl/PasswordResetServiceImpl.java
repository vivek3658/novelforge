package com.vivek.novelforge.identity.service.impl;

import com.vivek.novelforge.identity.entity.User;
import com.vivek.novelforge.identity.exception.PasswordResetNotVerifiedException;
import com.vivek.novelforge.identity.redis.PasswordResetRedisService;
import com.vivek.novelforge.identity.repository.UserRepository;
import com.vivek.novelforge.identity.service.OtpService;
import com.vivek.novelforge.identity.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PasswordResetServiceImpl implements PasswordResetService {
    private final PasswordResetRedisService passwordResetRedisService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;

    @Override
    public void sendResetOtp(String email) {
        email = email.toLowerCase().trim();

        /*
         * Don't reveal whether the email exists.
         */
        if (!userRepository.existsByEmail(email)) {
            return;
        }

        String otp = otpService.generateOtp(email);

        passwordResetRedisService.saveOtp(email, otp);

        // Send OTP through your Notification Service
        otpService.sendOtp(email, otp);
    }

    @Override
    public void verifyResetOtp(String email, String otp) {
        email = email.toLowerCase().trim();

        String storedOtp =
                passwordResetRedisService.getOtp(email);

        if (storedOtp == null ||
                !storedOtp.equals(otp)) {

            throw new RuntimeException("Invalid or expired OTP");
        }

        passwordResetRedisService.deleteOtp(email);

        passwordResetRedisService.markVerified(email);
    }

    @Override
    public void resetPassword(String email, String newPassword) {
        if(!passwordResetRedisService.isVerified(email)){
            throw new PasswordResetNotVerifiedException(
                    "Password Reset is Not Verified"
            );
        }
        User user = userRepository.findByEmail(email.toLowerCase()).orElseThrow(() -> new RuntimeException("User Not Found"));
        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );
        userRepository.save(user);
        passwordResetRedisService.deleteVerified(email);
    }
}

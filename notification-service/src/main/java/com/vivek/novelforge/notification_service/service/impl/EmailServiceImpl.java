package com.vivek.novelforge.notification_service.service.impl;

import com.vivek.novelforge.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;
    @Override
    public void sendOtp(String email, String otp) {
        log.info("Sending verification OTP [{}] to email [{}]", otp, email);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("NovelForge Email Verification");
            message.setText(
                    "Your NovelForge verification OTP is: "
                    + otp
                    + "\n\nThis OTP expires in 5 minutes."
            );
            mailSender.send(message);
            log.info("Successfully sent OTP email to {}", email);
        } catch (Exception ex) {
            log.error("Failed to send OTP email to {}: {}. OTP [{}] is logged for verification.", email, ex.getMessage(), otp);
        }
    }
}

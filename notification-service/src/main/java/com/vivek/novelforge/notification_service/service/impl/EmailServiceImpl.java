package com.vivek.novelforge.notification_service.service.impl;

import com.vivek.novelforge.notification_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;
    @Override
    public void sendOtp(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("NovelForge Email Verification");
        message.setText(
                "Your NovelForge verification OTP is: "
                + otp
                + "\n\nThis OTP expires in 5 minutes."
        );
        mailSender.send(message);
    }
}

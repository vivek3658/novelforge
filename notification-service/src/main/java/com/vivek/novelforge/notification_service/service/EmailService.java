package com.vivek.novelforge.notification_service.service;

public interface EmailService {
    default void sendOtp(String email, String otp) {
        sendOtp(email, otp, "REGISTRATION");
    }
    void sendOtp(String email, String otp, String purpose);
}

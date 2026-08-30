package com.vivek.novelforge.identity.service;

public interface PasswordResetService {

    void sendResetOtp(String email);

    void verifyResetOtp(String email, String otp);

    void resetPassword(String email, String newPassword);
}

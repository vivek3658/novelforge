package com.vivek.novelforge.identity.service;

public interface PasswordResetService {

    void sendResetOtp(String email, String flowId, String clientIp);

    void verifyResetOtp(String email, String otp, String flowId, String clientIp);
    boolean isCurrentOtpChallenge(String email, String flowId, String challengeId);

    void resetPassword(String email, String newPassword, String flowId);
}

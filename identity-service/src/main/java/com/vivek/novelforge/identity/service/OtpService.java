package com.vivek.novelforge.identity.service;

import java.util.UUID;

public interface OtpService {
    void sendOtp(String email, String otp, UUID challengeId, String flowId, String purpose);
    boolean verifyOtp(String email, String otp, String flowId);
    boolean verifyOtp(String email, String otp, String flowId, String purpose);
    String generateOtp(String email);
}

package com.vivek.novelforge.identity.service;

public interface OtpService {
    void sendOtp(String email,String otp);
    boolean verifyOtp(String email,String otp);
    String generateOtp(String email);
}
